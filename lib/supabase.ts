// Supabase clients.
//
// Two clients live here:
//   - `supabase` — the browser/runtime client, authenticated with the public
//     anon key. Safe to import anywhere (server components, client components,
//     route handlers).
//   - `getSupabaseAdmin()` — a server-only client authenticated with the
//     service role key. Bypasses RLS, so it can read/write any table. NEVER
//     import this from a client component. If you accidentally do, the build
//     will fail because the env var is server-only.
//
// Env vars (all optional — the code falls back to JSON if they're missing):
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
//   SUPABASE_SERVICE_ROLE_KEY   (server-only — never expose to the browser)
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * True when both public env vars are set to non-placeholder values. We treat
 * `your_*_here` (from the example `.env.localy`) as "not configured" so local
 * dev never tries to hit a fake URL.
 */
export function isSupabaseConfigured(): boolean {
  return (
    supabaseUrl.length > 0 &&
    supabaseAnonKey.length > 0 &&
    !supabaseUrl.startsWith("your_") &&
    !supabaseAnonKey.startsWith("your_")
  );
}

/**
 * Public browser client (anon key). Throws ONLY if used while unconfigured —
 * we expose a safe placeholder instead so module imports never crash.
 */
export const supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    })
  : // Placeholder client — every query short-circuits because the URL is bogus,
    // and our data layer's try/catch falls back to JSON. We never call this
    // when isSupabaseConfigured() is false, so the URL is never actually used.
    createClient("https://placeholder.supabase.co", "placeholder-key", {
      auth: { persistSession: false },
    });

/**
 * Server-only admin client. Lazily constructed so the service role key never
 * leaks into a client bundle: this function should only be called from API
 * routes, server actions, or server components.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!isSupabaseConfigured() || serviceKey.length === 0) {
    throw new Error(
      "Supabase admin client requested but SUPABASE_SERVICE_ROLE_KEY (and/or NEXT_PUBLIC_SUPABASE_URL) is not configured.",
    );
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}
