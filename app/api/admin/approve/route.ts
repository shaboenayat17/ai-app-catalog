import { NextResponse } from "next/server";
import {
  checkPassword,
  readApps,
  readPending,
  writeApps,
  writePending,
} from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { password?: unknown; id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!checkPassword(body.password)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const id = typeof body.id === "string" ? body.id : null;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
  }

  try {
    const [apps, pending] = await Promise.all([readApps(), readPending()]);
    const target = pending.find((p) => p.id === id);
    if (!target) {
      return NextResponse.json(
        { ok: false, error: `No pending app with id "${id}"` },
        { status: 404 },
      );
    }
    if (apps.some((a) => a.id === id)) {
      // Drop from pending — already exists in catalog. Don't double-add.
      const remainingPending = pending.filter((p) => p.id !== id);
      await writePending(remainingPending);
      return NextResponse.json({
        ok: true,
        warning: "App already existed in catalog; removed from pending instead.",
        app: target,
      });
    }
    const today = new Date().toISOString().slice(0, 10);
    const approved = { ...target, addedDate: target.addedDate || today, isNew: true };
    const nextApps = [...apps, approved];
    const nextPending = pending.filter((p) => p.id !== id);
    await Promise.all([writeApps(nextApps), writePending(nextPending)]);
    return NextResponse.json({ ok: true, app: approved });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? `Filesystem write failed: ${err.message}. On Vercel the runtime is read-only — run the admin locally to persist changes.`
            : "Unknown error",
      },
      { status: 500 },
    );
  }
}
