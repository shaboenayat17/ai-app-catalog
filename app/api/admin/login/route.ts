import { NextResponse } from "next/server";
import { checkPassword } from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const pwd = (body as { password?: unknown })?.password;
  if (!checkPassword(pwd)) {
    return NextResponse.json(
      { ok: false, error: "Incorrect password" },
      { status: 401 },
    );
  }
  return NextResponse.json({ ok: true });
}
