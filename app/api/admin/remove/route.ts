import { NextResponse } from "next/server";
import { checkPassword, readApps, writeApps } from "@/lib/admin";
import { deleteAppFromDatabase } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase";

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

  // Prefer Supabase — that's the authoritative store after migration. The
  // local JSON file is still updated as a belt-and-suspenders backup on
  // self-hosted runs (no-op on Vercel since the filesystem is read-only).
  if (isSupabaseConfigured()) {
    try {
      await deleteAppFromDatabase(id);
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          error:
            err instanceof Error
              ? `Supabase delete failed: ${err.message}`
              : "Supabase delete failed",
        },
        { status: 502 },
      );
    }
    // Best-effort JSON sync — never blocks the success response.
    try {
      const apps = await readApps();
      const next = apps.filter((a) => a.id !== id);
      if (next.length !== apps.length) await writeApps(next);
    } catch {
      // Read-only filesystem on Vercel; ignore.
    }
    return NextResponse.json({ ok: true });
  }

  // No Supabase configured — fall back to the legacy JSON path.
  try {
    const apps = await readApps();
    const next = apps.filter((a) => a.id !== id);
    if (next.length === apps.length) {
      return NextResponse.json(
        { ok: false, error: `No app with id "${id}"` },
        { status: 404 },
      );
    }
    await writeApps(next);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? `Filesystem write failed: ${err.message}. Admin writes only persist on local or self-hosted runs.`
            : "Unknown error",
      },
      { status: 500 },
    );
  }
}
