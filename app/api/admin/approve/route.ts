import { NextResponse } from "next/server";
import { checkPassword } from "@/lib/admin";
import { mergePR } from "@/lib/admin-github";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { password?: unknown; prNumber?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }
  if (!checkPassword(body.password)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const prNumber =
    typeof body.prNumber === "number" && Number.isFinite(body.prNumber)
      ? body.prNumber
      : null;
  if (!prNumber) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid prNumber" },
      { status: 400 },
    );
  }

  const result = await mergePR(prNumber);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true, prNumber });
}
