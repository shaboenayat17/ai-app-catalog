// Server-side admin helpers. Only import from API routes / server components.
import path from "path";
import { promises as fs } from "fs";
import type { AIApp } from "./types";

const ROOT = process.cwd();
export const APPS_PATH = path.join(ROOT, "data", "apps.json");
export const PENDING_PATH = path.join(ROOT, "data", "pending-apps.json");

export const DEFAULT_ADMIN_PASSWORD = "admin123";

/** Resolve admin password from env, falling back to "admin123" for local dev. */
export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
}

/** True if ADMIN_PASSWORD env var is set (regardless of value). */
export function adminEnabled(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

/** Constant-time-ish password comparison. Good-enough for a personal admin. */
export function checkPassword(input: unknown): boolean {
  if (typeof input !== "string") return false;
  const expected = getAdminPassword();
  if (input.length !== expected.length) return false;
  let same = 0;
  for (let i = 0; i < expected.length; i++) {
    same |= expected.charCodeAt(i) ^ input.charCodeAt(i);
  }
  return same === 0;
}

/* -------------------- File I/O -------------------- */

export async function readApps(): Promise<AIApp[]> {
  const raw = await fs.readFile(APPS_PATH, "utf8");
  return JSON.parse(raw) as AIApp[];
}

export async function writeApps(apps: AIApp[]): Promise<void> {
  await fs.writeFile(APPS_PATH, JSON.stringify(apps, null, 2) + "\n", "utf8");
}

export async function readPending(): Promise<AIApp[]> {
  try {
    const raw = await fs.readFile(PENDING_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AIApp[]) : [];
  } catch {
    return [];
  }
}

export async function writePending(apps: AIApp[]): Promise<void> {
  await fs.writeFile(PENDING_PATH, JSON.stringify(apps, null, 2) + "\n", "utf8");
}

/** Quick read of pending count for UI badges. Never throws. */
export async function readPendingCount(): Promise<number> {
  try {
    const list = await readPending();
    return list.length;
  } catch {
    return 0;
  }
}

/* -------------------- Schedule helpers -------------------- */

/** Cron is "0 9 */2 * *" — every other day at 9am UTC. Compute the next firing in UTC. */
export function nextScheduledRun(now = new Date()): Date {
  // Find the next date where day-of-month is even or odd matching today's parity rule.
  // The cron */2 in day-of-month fires on days 1, 3, 5, ..., 31 (odd days), then resets.
  // We approximate "every 2 days at 09:00 UTC" by stepping forward day-by-day.
  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      9,
      0,
      0,
      0,
    ),
  );
  // If 09:00 today already passed, advance one day.
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  // Walk forward to a day that matches the cron */2 pattern (odd days).
  while (next.getUTCDate() % 2 === 0) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next;
}

/** Pretty-format a date in user-friendly UTC. */
export function formatRunDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}
