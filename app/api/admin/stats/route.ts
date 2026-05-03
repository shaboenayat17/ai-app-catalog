import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import {
  checkPassword,
  nextScheduledRun,
  readApps,
  readPending,
} from "@/lib/admin";

export const runtime = "nodejs";

const LAST_RUN_PATH = path.join(process.cwd(), "data", "last-run.json");

interface LastRunMeta {
  ranAt?: string;
  addedCount?: number;
  rejectedCount?: number;
}

export async function POST(req: Request) {
  let body: { password?: unknown };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (!checkPassword(body.password)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const [apps, pending] = await Promise.all([readApps(), readPending()]);

  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const addedThisMonth = apps.filter((a) => {
    const d = new Date(`${a.addedDate}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d >= startOfMonth;
  }).length;

  let lastRun: string | null = null;
  let lastRunAddedCount = 0;
  try {
    const raw = await fs.readFile(LAST_RUN_PATH, "utf8");
    const meta: LastRunMeta = JSON.parse(raw);
    lastRun = typeof meta.ranAt === "string" ? meta.ranAt : null;
    lastRunAddedCount = typeof meta.addedCount === "number" ? meta.addedCount : 0;
  } catch {
    // first run — no metadata yet
  }

  const next = nextScheduledRun(now);

  return NextResponse.json({
    ok: true,
    total: apps.length,
    addedThisMonth,
    pendingCount: pending.length,
    lastRun,
    lastRunAddedCount,
    nextRun: next.toISOString(),
  });
}
