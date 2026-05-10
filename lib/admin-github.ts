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

export async function mergePR(
  prNumber: number,
): Promise<{ ok: boolean; error?: string }> {
  const cfg = getConfig();
  if (!cfg) {
    return {
      ok: false,
      error: "GITHUB_TOKEN or GITHUB_REPOSITORY is not configured",
    };
  }
  try {
    await gh(cfg, `/repos/${cfg.repo}/pulls/${prNumber}/merge`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commit_title: `Approve PR #${prNumber}: AI catalog auto-update`,
        merge_method: "squash",
      }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function closePR(
  prNumber: number,
): Promise<{ ok: boolean; error?: string }> {
  const cfg = getConfig();
  if (!cfg) {
    return {
      ok: false,
      error: "GITHUB_TOKEN or GITHUB_REPOSITORY is not configured",
    };
  }
  try {
    await gh(cfg, `/repos/${cfg.repo}/pulls/${prNumber}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: "closed" }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
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
