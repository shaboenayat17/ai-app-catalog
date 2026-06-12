// Data layer.
//
// Every page and API route reads through this module instead of importing
// `data.ts` (which talks directly to JSON). Each function:
//   1. tries Supabase first,
//   2. on any error, falls back to the bundled JSON,
//   3. always returns a typed value — never throws to the caller.
//
// That keeps deploys safe: even if Supabase is misconfigured or down, the
// site keeps rendering with the last-known JSON snapshot.
import { isSupabaseConfigured, supabase, getSupabaseAdmin } from "./supabase";
import {
  transformApp,
  transformApps,
  transformAllNews,
  transformPendingApps,
  transformReviews,
  type AppRow,
  type NewsRow,
  type PendingApp,
  type PendingAppRow,
  type ReviewRow,
} from "./transformers";
import type {
  AIApp,
  Comparison,
  ComparisonDimension,
  ComparisonQuickPick,
  NewsItem,
  Review,
} from "./types";

/* -------------------- JSON fallback loaders -------------------- */
// Dynamic-imported so the JSON is only pulled into the bundle when a
// Supabase call actually fails. Keeps the happy path lean.

async function loadAppsFromJson(): Promise<AIApp[]> {
  const mod = await import("@/data/apps.json");
  const data = (mod as { default: unknown }).default ?? mod;
  if (Array.isArray(data)) return data as AIApp[];
  if (data && typeof data === "object" && "apps" in data) {
    const apps = (data as { apps?: unknown }).apps;
    if (Array.isArray(apps)) return apps as AIApp[];
  }
  return [];
}

async function loadComparisonsFromJson(): Promise<Comparison[]> {
  try {
    const mod = await import("@/data/comparisons.json");
    const data = (mod as { default: unknown }).default ?? mod;
    if (Array.isArray(data)) return data as Comparison[];
    if (data && typeof data === "object") {
      return Object.values(data as Record<string, Comparison>);
    }
  } catch {
    // No comparisons.json — fine.
  }
  return [];
}

async function loadNewsFromJson(): Promise<NewsItem[]> {
  try {
    const mod = await import("@/data/news.json");
    const data = (mod as { default: unknown }).default ?? mod;
    if (Array.isArray(data)) return data as NewsItem[];
    if (data && typeof data === "object" && "articles" in data) {
      const articles = (data as { articles?: unknown }).articles;
      if (Array.isArray(articles)) return articles as NewsItem[];
    }
  } catch {
    // No news.json — fine.
  }
  return [];
}

const APP_SELECT = "*";

/* ==================================================================== APPS */

export async function getApps(): Promise<AIApp[]> {
  if (!isSupabaseConfigured()) return loadAppsFromJson();
  try {
    const { data, error } = await supabase
      .from("apps")
      .select(APP_SELECT)
      .order("added_date", { ascending: false });
    if (error) throw error;
    const apps = transformApps((data as AppRow[]) ?? []);
    if (apps.length === 0) return loadAppsFromJson();
    return apps;
  } catch (err) {
    console.error("[db] getApps failed, falling back to JSON:", err);
    return loadAppsFromJson();
  }
}

export async function getAppById(id: string): Promise<AIApp | null> {
  if (!isSupabaseConfigured()) {
    const apps = await loadAppsFromJson();
    return apps.find((a) => a.id === id) ?? null;
  }
  try {
    const { data, error } = await supabase
      .from("apps")
      .select(APP_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    const app = transformApp(data as AppRow | null);
    if (app) return app;
    // Row missing — fall through to JSON so pre-DB apps still render.
    const apps = await loadAppsFromJson();
    return apps.find((a) => a.id === id) ?? null;
  } catch (err) {
    console.error(`[db] getAppById(${id}) failed, falling back to JSON:`, err);
    const apps = await loadAppsFromJson();
    return apps.find((a) => a.id === id) ?? null;
  }
}

export async function getFeaturedApps(limit = 12): Promise<AIApp[]> {
  if (!isSupabaseConfigured()) {
    const apps = await loadAppsFromJson();
    return apps.filter((a) => a.featured).slice(0, limit);
  }
  try {
    const { data, error } = await supabase
      .from("apps")
      .select(APP_SELECT)
      .eq("featured", true)
      .order("trending_score", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return transformApps((data as AppRow[]) ?? []);
  } catch (err) {
    console.error("[db] getFeaturedApps failed:", err);
    const apps = await getApps();
    return apps.filter((a) => a.featured).slice(0, limit);
  }
}

export async function getTrendingApps(limit = 10): Promise<AIApp[]> {
  if (!isSupabaseConfigured()) {
    const apps = await loadAppsFromJson();
    return [...apps]
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);
  }
  try {
    const { data, error } = await supabase
      .from("apps")
      .select(APP_SELECT)
      .order("trending_score", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return transformApps((data as AppRow[]) ?? []);
  } catch (err) {
    console.error("[db] getTrendingApps failed:", err);
    const apps = await getApps();
    return [...apps]
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);
  }
}

export async function getNewApps(limit = 10): Promise<AIApp[]> {
  if (!isSupabaseConfigured()) {
    const apps = await loadAppsFromJson();
    return apps.filter((a) => a.isNew).slice(0, limit);
  }
  try {
    const { data, error } = await supabase
      .from("apps")
      .select(APP_SELECT)
      .eq("is_new", true)
      .order("added_date", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return transformApps((data as AppRow[]) ?? []);
  } catch (err) {
    console.error("[db] getNewApps failed:", err);
    const apps = await getApps();
    return apps.filter((a) => a.isNew).slice(0, limit);
  }
}

/* ==================================================================== REVIEWS */

export async function getReviewsByAppId(appId: string): Promise<Review[]> {
  if (!isSupabaseConfigured()) {
    const app = await getAppById(appId);
    return app?.reviews ?? [];
  }
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("app_id", appId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return transformReviews((data as ReviewRow[]) ?? []);
  } catch (err) {
    console.error(`[db] getReviewsByAppId(${appId}) failed:`, err);
    const app = await getAppById(appId);
    return app?.reviews ?? [];
  }
}

export async function addReview(input: {
  appId: string;
  author: string;
  rating: number;
  text: string;
  useCase: string;
}): Promise<Review | null> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured; cannot persist new reviews.");
  }
  const row = {
    app_id: input.appId,
    author: input.author,
    rating: input.rating,
    text: input.text,
    use_case: input.useCase,
  };
  const { data, error } = await supabase
    .from("reviews")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  // Fire-and-forget rating recompute. We don't await it — the user sees their
  // review immediately, and the app's aggregate rating updates next paint.
  void recalculateAppRating(input.appId);
  return transformReviews([data as ReviewRow])[0] ?? null;
}

async function recalculateAppRating(appId: string): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    const { data: reviews } = await admin
      .from("reviews")
      .select("rating")
      .eq("app_id", appId);
    if (!reviews || reviews.length === 0) return;
    const total = reviews.reduce(
      (sum, r) => sum + Number((r as { rating: number }).rating ?? 0),
      0,
    );
    const avg = total / reviews.length;
    await admin
      .from("apps")
      .update({
        rating: Math.round(avg * 10) / 10,
        review_count: reviews.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appId);
  } catch (err) {
    console.error(`[db] recalculateAppRating(${appId}) failed:`, err);
  }
}

/* ==================================================================== NEWS */

export async function getNewsFromDB(): Promise<NewsItem[]> {
  if (!isSupabaseConfigured()) return loadNewsFromJson();
  try {
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("date", { ascending: false })
      .limit(40);
    if (error) throw error;
    const items = transformAllNews((data as NewsRow[]) ?? []);
    if (items.length === 0) return loadNewsFromJson();
    return items;
  } catch (err) {
    console.error("[db] getNewsFromDB failed:", err);
    return loadNewsFromJson();
  }
}

interface NewsArticleInput {
  title: string;
  summary?: string;
  source?: string;
  sourceColor?: string;
  color?: string;
  url: string;
  date?: string;
  category?: string;
}

export async function saveNewsToDB(
  articles: NewsArticleInput[],
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  if (!articles || articles.length === 0) return;
  try {
    const admin = getSupabaseAdmin();
    // Dedupe by URL within the batch — Supabase's upsert with onConflict on a
    // unique column can fail if the same URL appears twice in one batch.
    const seen = new Set<string>();
    const rows = articles
      .filter((a) => {
        if (!a.url) return false;
        if (seen.has(a.url)) return false;
        seen.add(a.url);
        return true;
      })
      .map((a) => ({
        title: a.title,
        summary: a.summary ?? "",
        source: a.source ?? "",
        source_color: a.sourceColor ?? a.color ?? "gray",
        url: a.url,
        date: a.date ?? new Date().toISOString(),
        category: a.category ?? "Productivity",
      }));
    if (rows.length === 0) return;
    const { error } = await admin
      .from("news")
      .upsert(rows, { onConflict: "url", ignoreDuplicates: true });
    if (error) console.error("[db] saveNewsToDB error:", error);
  } catch (err) {
    console.error("[db] saveNewsToDB threw:", err);
  }
}

/* ==================================================================== PENDING APPS */

export async function getPendingApps(): Promise<PendingApp[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("pending_apps")
      .select("*")
      .eq("status", "pending")
      .order("suggested_at", { ascending: false });
    if (error) throw error;
    return transformPendingApps((data as PendingAppRow[]) ?? []);
  } catch (err) {
    console.error("[db] getPendingApps failed:", err);
    return [];
  }
}

export async function countPendingApps(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  try {
    const admin = getSupabaseAdmin();
    const { count, error } = await admin
      .from("pending_apps")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    if (error) throw error;
    return count ?? 0;
  } catch (err) {
    console.error("[db] countPendingApps failed:", err);
    return 0;
  }
}

export async function savePendingApps(
  apps: Array<Partial<AIApp> & { id?: string; name?: string }>,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("pending_apps")
      .insert(apps.map((app) => ({ app_data: app, status: "pending" })));
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("[db] savePendingApps failed:", err);
    return false;
  }
}

export async function approvePendingApp(pendingId: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  // 1) Load the pending row so we can copy its embedded app into `apps`.
  const { data: pending, error: fetchErr } = await admin
    .from("pending_apps")
    .select("*")
    .eq("id", pendingId)
    .single();
  if (fetchErr) throw fetchErr;
  const row = pending as PendingAppRow;
  const a = row.app_data ?? {};

  // 2) Map camelCase → snake_case for the apps table.
  const appRow = {
    id: String(a.id ?? `pending-${pendingId}`),
    name: String(a.name ?? "Untitled"),
    description: String(a.description ?? ""),
    category: typeof a.category === "string" ? a.category : "Productivity",
    tags: Array.isArray(a.tags) ? (a.tags as string[]) : [],
    pricing: typeof a.pricing === "string" ? a.pricing : "Free",
    url: String(a.url ?? ""),
    logo_url: typeof a.logoUrl === "string" ? a.logoUrl : null,
    featured: false,
    added_date:
      typeof a.addedDate === "string"
        ? a.addedDate
        : new Date().toISOString().split("T")[0],
    is_new: true,
    weekly_views: typeof a.weeklyViews === "number" ? a.weeklyViews : 0,
    saved_count: typeof a.savedCount === "number" ? a.savedCount : 0,
    trending_score:
      typeof a.trendingScore === "number" ? a.trendingScore : 70,
    trending_direction: "up",
    rating: typeof a.rating === "number" ? a.rating : 4.0,
    review_count: 0,
    best_for: Array.isArray(a.bestFor) ? (a.bestFor as string[]) : [],
    workflow: typeof a.workflow === "string" ? a.workflow : "create",
    compatible_with: Array.isArray(a.compatibleWith)
      ? (a.compatibleWith as string[])
      : [],
    pros: Array.isArray(a.pros) ? (a.pros as string[]) : [],
    cons: Array.isArray(a.cons) ? (a.cons as string[]) : [],
    verdict: typeof a.verdict === "string" ? a.verdict : "",
    not_good_for: typeof a.notGoodFor === "string" ? a.notGoodFor : "",
    pricing_details: a.pricing_details ?? {},
  };

  const { error: insertErr } = await admin.from("apps").upsert(appRow);
  if (insertErr) throw insertErr;

  // 3) Mark the pending row as approved so it stops showing in the queue.
  const { error: updateErr } = await admin
    .from("pending_apps")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", pendingId);
  if (updateErr) throw updateErr;

  return true;
}

export async function rejectPendingApp(pendingId: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("pending_apps")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", pendingId);
  if (error) throw error;
  return true;
}

/* ==================================================================== COMPARISONS */

interface ComparisonRow {
  id: string;
  app1_id: string | null;
  app2_id: string | null;
  title: string | null;
  subtitle: string | null;
  verdict: string | null;
  updated_date: string | null;
  dimensions: ComparisonDimension[] | null;
  quick_picks: ComparisonQuickPick[] | null;
}

function transformComparison(row: ComparisonRow | null): Comparison | null {
  if (!row) return null;
  return {
    id: row.id,
    app1: row.app1_id ?? "",
    app2: row.app2_id ?? "",
    title: row.title ?? "",
    subtitle: row.subtitle ?? "",
    verdict: row.verdict ?? "",
    updatedDate:
      row.updated_date ?? new Date().toISOString().split("T")[0],
    dimensions: Array.isArray(row.dimensions) ? row.dimensions : [],
    quickPicks: Array.isArray(row.quick_picks) ? row.quick_picks : [],
  };
}

export async function getComparisons(): Promise<Comparison[]> {
  if (!isSupabaseConfigured()) return loadComparisonsFromJson();
  try {
    const { data, error } = await supabase.from("comparisons").select("*");
    if (error) throw error;
    const rows = (data as ComparisonRow[]) ?? [];
    const comparisons = rows
      .map(transformComparison)
      .filter((c): c is Comparison => c !== null);
    if (comparisons.length === 0) return loadComparisonsFromJson();
    return comparisons;
  } catch (err) {
    console.error("[db] getComparisons failed, falling back to JSON:", err);
    return loadComparisonsFromJson();
  }
}

export async function getComparisonById(
  id: string,
): Promise<Comparison | null> {
  const comparisons = await getComparisons();
  return comparisons.find((c) => c.id === id) ?? null;
}

export async function getComparison(
  app1Id: string,
  app2Id: string,
): Promise<Comparison | null> {
  const comparisons = await getComparisons();
  return (
    comparisons.find(
      (c) =>
        (c.app1 === app1Id && c.app2 === app2Id) ||
        (c.app1 === app2Id && c.app2 === app1Id),
    ) ?? null
  );
}

export async function getComparisonsForApp(
  appId: string,
): Promise<Comparison[]> {
  const comparisons = await getComparisons();
  return comparisons.filter((c) => c.app1 === appId || c.app2 === appId);
}

/* ==================================================================== ADMIN OPS */

export async function addAppToDatabase(
  app: Partial<AIApp> & { id: string; name: string },
): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const row = {
    id: app.id,
    name: app.name,
    description: app.description ?? "",
    category: app.category ?? "Productivity",
    tags: app.tags ?? [],
    pricing: app.pricing ?? "Free",
    url: app.url ?? "",
    logo_url: app.logoUrl ?? null,
    featured: app.featured ?? false,
    added_date:
      app.addedDate ?? new Date().toISOString().split("T")[0],
    is_new: app.isNew ?? true,
    weekly_views: app.weeklyViews ?? 0,
    saved_count: app.savedCount ?? 0,
    trending_score: app.trendingScore ?? 50,
    trending_direction: app.trendingDirection ?? "stable",
    rating: app.rating ?? 4.0,
    review_count: app.reviewCount ?? 0,
    best_for: app.bestFor ?? [],
    workflow: app.workflow ?? "create",
    compatible_with: app.compatibleWith ?? [],
    pros: app.pros ?? [],
    cons: app.cons ?? [],
    verdict: app.verdict ?? "",
    not_good_for: app.notGoodFor ?? "",
    pricing_details: app.pricing_details ?? {},
  };
  const { error } = await admin.from("apps").upsert(row);
  if (error) throw error;
  return true;
}

export async function deleteAppFromDatabase(id: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("apps").delete().eq("id", id);
  if (error) throw error;
  return true;
}

/* ==================================================================== HELPERS */

/**
 * Derive `lastUpdated` from the freshest app + news date. Computed in JS so
 * we don't need an extra round trip for a single timestamp.
 */
export function getLastUpdatedFrom(apps: AIApp[], news: NewsItem[]): string {
  const dates = [
    ...apps.map((a) => a.addedDate),
    ...news.map((n) => n.date),
  ]
    .filter((d): d is string => typeof d === "string" && d.length > 0)
    .sort();
  return dates[dates.length - 1] ?? "";
}

export function getAllTagsFrom(apps: AIApp[]): string[] {
  const set = new Set<string>();
  for (const app of apps) for (const tag of app.tags) set.add(tag);
  return Array.from(set).sort();
}
