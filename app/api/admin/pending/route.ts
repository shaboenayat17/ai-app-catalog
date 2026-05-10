import { NextResponse } from "next/server";
import { checkPassword } from "@/lib/admin";
import { isConfigured, listAutoUpdatePRs } from "@/lib/admin-github";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await safeJson(req);
  if (!checkPassword(body.password)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  if (!isConfigured()) {
    return NextResponse.json({
      ok: true,
      prs: [],
      warning:
        "GITHUB_TOKEN and GITHUB_REPOSITORY env vars are not set. Pending Review now reads open PRs from GitHub — configure both to enable.",
    });
  }
  try {
    const prs = await listAutoUpdatePRs();
    return NextResponse.json({ ok: true, prs });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? `GitHub fetch failed: ${err.message}`
            : "GitHub fetch failed",
        prs: [],
      },
      { status: 502 },
    );
  }
}

async function safeJson(req: Request): Promise<{ password?: unknown }> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
