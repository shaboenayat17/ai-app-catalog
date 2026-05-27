// GitHub-API helpers used by the admin panel to drive Pending Review via
// open Pull Requests created by the auto-update robot.
//
// Requires two env vars at runtime:
//   GITHUB_TOKEN       — a PAT (or installation token) with `repo` scope
//   GITHUB_REPOSITORY  — "owner/repo"
import type { AIApp } from "./types";

export interface PRSummary {
  number: number;
  title: string;
  url: string;
  createdAt: string;
  branch: string;
  author: string;
  /** Apps present in the PR head's data/apps.json that aren't on main yet. */
  newApps: AIApp[];
}

interface GitHubConfig {
  token: string;
  repo: string;
}

interface RawPR {
  number: number;
  title: string;
  html_url: string;
  created_at: string;
  user: { login: string } | null;
  head: { ref: string; sha: string };
}

interface RawContents {
  content: string; // base64-encoded
  encoding: string;
}

function getConfig(): GitHubConfig | null {
  const token = process.env.GITHUB_TOKEN;
  const repo =
    process.env.GITHUB_REPOSITORY ||
    process.env.NEXT_PUBLIC_GITHUB_REPOSITORY;
  if (!token || !repo) return null;
  return { token, repo };
}

export function isConfigured(): boolean {
  return getConfig() !== null;
}

/** Lightweight wrapper around the GitHub REST API. Throws on non-2xx. */
async function gh<T>(
  cfg: GitHubConfig,
  path: string,
  init?: RequestInit & { revalidate?: number | false },
): Promise<T> {
  const { revalidate, ...rest } = init ?? {};
  const res = await fetch(`https://api.github.com${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(rest.headers || {}),
    },
    // Default to no-store for mutations; reads override with explicit revalidate.
    ...(revalidate !== undefined
      ? { next: { revalidate } }
      : { cache: "no-store" as RequestCache }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub ${res.status}: ${body.slice(0, 240)}`);
  }
  return (await res.json()) as T;
}

/** True if a PR was likely produced by our auto-update workflow. */
function isAutoUpdatePR(pr: RawPR): boolean {
  if (pr.head.ref.startsWith("auto-update-")) return true;
  if (pr.user?.login === "github-actions[bot]") return true;
  if (pr.title.startsWith("🤖")) return true;
  return false;
}

/* -------------------- List + diff -------------------- */

export async function listAutoUpdatePRs(): Promise<PRSummary[]> {
  const cfg = getConfig();
  if (!cfg) return [];

  // Cache PR listing for 60s — the admin tab may refresh frequently.
  const prs = await gh<RawPR[]>(
    cfg,
    `/repos/${cfg.repo}/pulls?state=open&per_page=30&sort=created&direction=desc`,
    { revalidate: 60 },
  );

  const filtered = prs.filter(isAutoUpdatePR);
  const summaries: PRSummary[] = [];

  // Sequential fetch — keeps us well inside the 5000/hr rate limit even with
  // multiple admin tabs open. Typical case is 0–2 PRs at once.
  for (const pr of filtered) {
    let newApps: AIApp[] = [];
    try {
      newApps = await computeNewApps(cfg, pr.head.sha);
    } catch {
      newApps = [];
    }
    summaries.push({
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      createdAt: pr.created_at,
      branch: pr.head.ref,
      author: pr.user?.login ?? "unknown",
      newApps,
    });
  }
  return summaries;
}

async function fetchAppsJsonAt(
  cfg: GitHubConfig,
  ref: string,
): Promise<AIApp[]> {
  const data = await gh<RawContents>(
    cfg,
    `/repos/${cfg.repo}/contents/data/apps.json?ref=${encodeURIComponent(ref)}`,
    { revalidate: 60 },
  );
  if (data.encoding !== "base64") return [];
  const text = Buffer.from(data.content, "base64").toString("utf8");
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) return parsed as AIApp[];
  if (parsed && Array.isArray(parsed.apps)) return parsed.apps as AIApp[];
  return [];
}

async function computeNewApps(
  cfg: GitHubConfig,
  headSha: string,
): Promise<AIApp[]> {
  const [headApps, mainApps] = await Promise.all([
    fetchAppsJsonAt(cfg, headSha),
    // "HEAD" on the contents endpoint resolves to the default branch.
    fetchAppsJsonAt(cfg, "HEAD"),
  ]);
  const mainIds = new Set(mainApps.map((a) => a.id));
  return headApps.filter((a) => !mainIds.has(a.id));
}

/* -------------------- Mutations -------------------- */

/**
 * Merge a PR, trying merge methods in order so branch-protection rules don't
 * fail us silently. Returns the method that succeeded for telemetry/logs.
 */
export async function mergePR(
  prNumber: number,
): Promise<{ ok: boolean; error?: string; method?: string }> {
  const cfg = getConfig();
  if (!cfg) {
    return {
      ok: false,
      error:
        "GITHUB_TOKEN or GITHUB_REPOSITORY is not configured on this deployment",
    };
  }

  const methods = ["merge", "squash", "rebase"] as const;
  let lastError = "Could not merge. Check that your GitHub token has repo write access.";

  for (const method of methods) {
    let res: Response;
    try {
      res = await fetch(
        `https://api.github.com/repos/${cfg.repo}/pulls/${prNumber}/merge`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${cfg.token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            merge_method: method,
            commit_title: `🤖 Add new AI apps (approved via admin panel)`,
          }),
          cache: "no-store",
        },
      );
    } catch (err) {
      lastError =
        err instanceof Error ? `Network error: ${err.message}` : "Network error";
      continue;
    }

    if (res.status === 200 || res.status === 201) {
      return { ok: true, method };
    }

    // 405 = this method blocked by branch protection — try the next one.
    if (res.status === 405) {
      continue;
    }

    // Map other common errors to clear user-facing strings.
    let apiMessage = "";
    try {
      const json = (await res.json()) as { message?: string };
      apiMessage = json.message ?? "";
    } catch {
      // Body wasn't JSON; fall through to status-based message.
    }

    if (res.status === 404) {
      return { ok: false, error: "Pull request not found" };
    }
    if (res.status === 422) {
      return {
        ok: false,
        error:
          "Pull request has conflicts and cannot be merged automatically",
      };
    }
    return {
      ok: false,
      error: apiMessage || `GitHub returned ${res.status}`,
    };
  }

  // All three methods returned 405 (or network-erred): give a helpful nudge.
  return { ok: false, error: lastError };
}

export async function closePR(
  prNumber: number,
): Promise<{ ok: boolean; error?: string }> {
  const cfg = getConfig();
  if (!cfg) {
    return {
      ok: false,
      error:
        "GITHUB_TOKEN or GITHUB_REPOSITORY is not configured on this deployment",
    };
  }

  let res: Response;
  try {
    res = await fetch(
      `https://api.github.com/repos/${cfg.repo}/pulls/${prNumber}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${cfg.token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state: "closed" }),
        cache: "no-store",
      },
    );
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? `Network error: ${err.message}` : "Network error",
    };
  }

  if (res.status === 200) return { ok: true };

  let apiMessage = "";
  try {
    const json = (await res.json()) as { message?: string };
    apiMessage = json.message ?? "";
  } catch {
    /* ignore */
  }
  if (res.status === 404) return { ok: false, error: "Pull request not found" };
  if (res.status === 403) {
    return {
      ok: false,
      error: "Could not close PR. Check that your GitHub token has repo write access.",
    };
  }
  return {
    ok: false,
    error: apiMessage || `GitHub returned ${res.status}`,
  };
}

/* -------------------- Cached count for the header badge -------------------- */

export async function countOpenAutoUpdatePRs(): Promise<number> {
  const cfg = getConfig();
  if (!cfg) return 0;
  try {
    const prs = await gh<RawPR[]>(
      cfg,
      `/repos/${cfg.repo}/pulls?state=open&per_page=30`,
      { revalidate: 60 },
    );
    return prs.filter(isAutoUpdatePR).length;
  } catch {
    return 0;
  }
}
