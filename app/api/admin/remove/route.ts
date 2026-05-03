import { NextResponse } from "next/server";
import { checkPassword, readApps, writeApps } from "@/lib/admin";

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
