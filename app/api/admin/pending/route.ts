// Unified pending-apps endpoint. Replaces the old PR-based approve/reject
// routes — now everything goes through Supabase's `pending_apps` table.
//
//   GET  → { ok: true, pending: PendingApp[] }
//   POST → { action: "approve" | "reject", pendingId, password }
//
// The GET endpoint is public-ish (anyone with the URL can list pending
// suggestions) because the data is just "robot's unmoderated candidates" —
// nothing sensitive — and we want the admin UI to be able to fetch it on
// boot without a round-trip through the login check. Mutations still require
// the admin password.
import { NextResponse } from "next/server";
import { checkPassword } from "@/lib/admin";
import {
  approvePendingApp,
  getPendingApps,
  rejectPendingApp,
} from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* -------------------- GET: list pending apps -------------------- */

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      pending: [],
      warning:
        "Supabase env vars are not configured. Pending Review will start working once NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.",
    });
  }
  try {
    const pending = await getPendingApps();
    return NextResponse.json({ ok: true, pending });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? `Supabase fetch failed: ${err.message}`
            : "Supabase fetch failed",
        pending: [],
      },
      { status: 502 },
    );
  }
}

/* -------------------- POST: approve / reject / list-with-auth -------------------- */

export async function POST(req: Request) {
  let body: {
    action?: unknown;
    pendingId?: unknown;
    password?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  // The admin panel posts password-authed requests for both listing and
  // mutating. We use the same endpoint shape for both — action: "list" is
  // optional and lets the UI consolidate everything into one POST helper.
  if (!checkPassword(body.password)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const action =
    typeof body.action === "string" ? body.action : "list";

  if (action === "list") {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        ok: true,
        pending: [],
        warning:
          "Supabase env vars are not configured. Pending Review will start working once NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.",
      });
    }
    try {
      const pending = await getPendingApps();
      return NextResponse.json({ ok: true, pending });
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          error:
            err instanceof Error
              ? `Supabase fetch failed: ${err.message}`
              : "Supabase fetch failed",
          pending: [],
        },
        { status: 502 },
      );
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Supabase is not configured on this deployment. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  const pendingId =
    typeof body.pendingId === "string" ? body.pendingId : null;
  if (!pendingId) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid pendingId" },
      { status: 400 },
    );
  }

  try {
    if (action === "approve") {
      await approvePendingApp(pendingId);
      return NextResponse.json({ ok: true, pendingId, action: "approve" });
    }
    if (action === "reject") {
      await rejectPendingApp(pendingId);
      return NextResponse.json({ ok: true, pendingId, action: "reject" });
    }
    return NextResponse.json(
      { ok: false, error: `Unknown action "${action}"` },
      { status: 400 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Supabase mutation failed",
      },
      { status: 502 },
    );
  }
}
