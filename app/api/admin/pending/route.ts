import { NextResponse } from "next/server";
import { checkPassword, readPending } from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await safeJson(req);
  if (!checkPassword(body.password)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const apps = await readPending();
  return NextResponse.json({ ok: true, apps });
}

async function safeJson(req: Request): Promise<{ password?: unknown }> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
