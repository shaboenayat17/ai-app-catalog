// Supabase row → frontend type transformers.
//
// Supabase columns are snake_case; the rest of the app reads camelCase fields
// off the existing TypeScript types in `./types`. These transformers are the
// single source of truth for that mapping — change the SQL schema in one
// place and update the mapping here in the other.
import type {
  AIApp,
  Category,
  NewsItem,
  Pricing,
  PricingDetails,
  Review,
  TrendingDirection,
  Workflow,
} from "./types";

/* -------------------- Raw Supabase row shapes -------------------- */

export interface AppRow {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  pricing: string | null;
  url: string | null;
  logo_url: string | null;
  featured: boolean | null;
  added_date: string | null;
  is_new: boolean | null;
  weekly_views: number | null;
  saved_count: number | null;
  trending_score: number | null;
  trending_direction: string | null;
  rating: number | string | null;
  review_count: number | null;
  best_for: string[] | null;
  workflow: string | null;
  compatible_with: string[] | null;
  pros: string[] | null;
  cons: string[] | null;
  verdict: string | null;
  not_good_for: string | null;
  pricing_details: Partial<PricingDetails> | null;
  // Joined-in reviews when we select with `reviews(*)`.
  reviews?: ReviewRow[];
}

export interface ReviewRow {
  id: string;
  app_id: string;
  author: string;
  rating: number;
  text: string | null;
  use_case: string | null;
  date: string | null;
  created_at: string;
}

export interface NewsRow {
  id: string;
  title: string;
  summary: string | null;
  source: string | null;
  source_color: string | null;
  url: string;
  date: string | null;
  category: string | null;
}

export interface PendingAppRow {
  id: string;
  app_data: Partial<AIApp> & Record<string, unknown>;
  status: "pending" | "approved" | "rejected";
  suggested_at: string;
  reviewed_at: string | null;
}

/** UI-friendly pending-app shape returned from the data layer. */
export interface PendingApp {
  id: string;
  app: AIApp;
  status: "pending" | "approved" | "rejected";
  suggestedAt: string;
  reviewedAt: string | null;
}

/* -------------------- App transformer -------------------- */

const EMPTY_PRICING_DETAILS: PricingDetails = {
  free_tier: false,
  free_tier_limits: "",
  starting_price: "",
  most_popular_plan: "",
  annual_discount: "",
  has_student_discount: false,
  free_trial: "",
  estimated_monthly_cost: {
    light_user: "",
    regular_user: "",
    power_user: "",
  },
};

export function transformApp(row: AppRow | null | undefined): AIApp | null {
  if (!row) return null;

  const rating =
    typeof row.rating === "string" ? parseFloat(row.rating) : row.rating;

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    category: (row.category as Category) ?? "Productivity",
    tags: row.tags ?? [],
    pricing: (row.pricing as Pricing) ?? "Free",
    url: row.url ?? "",
    logoUrl: row.logo_url ?? null,
    featured: row.featured ?? false,
    addedDate:
      row.added_date ?? new Date().toISOString().split("T")[0],
    isNew: row.is_new ?? false,
    weeklyViews: row.weekly_views ?? 0,
    savedCount: row.saved_count ?? 0,
    trendingScore: row.trending_score ?? 50,
    trendingDirection:
      (row.trending_direction as TrendingDirection) ?? "stable",
    rating: Number.isFinite(rating) ? (rating as number) : 4.0,
    reviewCount: row.review_count ?? 0,
    reviews: (row.reviews ?? []).map(transformReview).filter(
      (r): r is Review => r !== null,
    ),
    bestFor: row.best_for ?? [],
    workflow: (row.workflow as Workflow) ?? "create",
    compatibleWith: row.compatible_with ?? [],
    pros: row.pros ?? [],
    cons: row.cons ?? [],
    verdict: row.verdict ?? "",
    notGoodFor: row.not_good_for ?? "",
    pricing_details: {
      ...EMPTY_PRICING_DETAILS,
      ...(row.pricing_details ?? {}),
      estimated_monthly_cost: {
        ...EMPTY_PRICING_DETAILS.estimated_monthly_cost,
        ...(row.pricing_details?.estimated_monthly_cost ?? {}),
      },
    } as PricingDetails,
  };
}

export function transformApps(rows: AppRow[] | null | undefined): AIApp[] {
  if (!rows) return [];
  return rows
    .map((r) => transformApp(r))
    .filter((a): a is AIApp => a !== null);
}

/* -------------------- Review transformer -------------------- */

export function transformReview(row: ReviewRow | null | undefined): Review | null {
  if (!row) return null;
  return {
    author: row.author,
    rating: row.rating,
    text: row.text ?? "",
    useCase: row.use_case ?? "",
    date: row.date ?? row.created_at.split("T")[0],
  };
}

export function transformReviews(
  rows: ReviewRow[] | null | undefined,
): Review[] {
  if (!rows) return [];
  return rows
    .map((r) => transformReview(r))
    .filter((r): r is Review => r !== null);
}

/* -------------------- News transformer -------------------- */

export function transformNews(row: NewsRow | null | undefined): NewsItem | null {
  if (!row) return null;
  return {
    title: row.title,
    summary: row.summary ?? "",
    source: row.source ?? "",
    sourceColor: row.source_color ?? "gray",
    url: row.url,
    date: row.date ?? new Date().toISOString(),
    category: row.category ?? "Productivity",
  };
}

export function transformAllNews(
  rows: NewsRow[] | null | undefined,
): NewsItem[] {
  if (!rows) return [];
  return rows
    .map((r) => transformNews(r))
    .filter((n): n is NewsItem => n !== null);
}

/* -------------------- Pending app transformer -------------------- */

export function transformPendingApp(
  row: PendingAppRow | null | undefined,
): PendingApp | null {
  if (!row) return null;
  // The robot stores app_data in the same camelCase shape we use everywhere
  // else, so we don't need a deep transform — just patch defaults so the UI
  // never blows up on missing fields.
  const raw = row.app_data ?? {};
  const app: AIApp = {
    id: String(raw.id ?? row.id),
    name: String(raw.name ?? "Untitled"),
    description: String(raw.description ?? ""),
    category: (raw.category as Category) ?? "Productivity",
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    pricing: (raw.pricing as Pricing) ?? "Free",
    url: String(raw.url ?? ""),
    logoUrl: typeof raw.logoUrl === "string" ? raw.logoUrl : null,
    featured: Boolean(raw.featured),
    addedDate:
      typeof raw.addedDate === "string"
        ? raw.addedDate
        : new Date().toISOString().split("T")[0],
    isNew: raw.isNew !== false,
    weeklyViews: typeof raw.weeklyViews === "number" ? raw.weeklyViews : 0,
    savedCount: typeof raw.savedCount === "number" ? raw.savedCount : 0,
    trendingScore:
      typeof raw.trendingScore === "number" ? raw.trendingScore : 70,
    trendingDirection:
      (raw.trendingDirection as TrendingDirection) ?? "up",
    rating: typeof raw.rating === "number" ? raw.rating : 4.0,
    reviewCount: typeof raw.reviewCount === "number" ? raw.reviewCount : 0,
    reviews: Array.isArray(raw.reviews) ? (raw.reviews as Review[]) : [],
    bestFor: Array.isArray(raw.bestFor) ? (raw.bestFor as string[]) : [],
    workflow: (raw.workflow as Workflow) ?? "create",
    compatibleWith: Array.isArray(raw.compatibleWith)
      ? (raw.compatibleWith as string[])
      : [],
    pros: Array.isArray(raw.pros) ? (raw.pros as string[]) : [],
    cons: Array.isArray(raw.cons) ? (raw.cons as string[]) : [],
    verdict: typeof raw.verdict === "string" ? raw.verdict : "",
    notGoodFor: typeof raw.notGoodFor === "string" ? raw.notGoodFor : "",
    pricing_details: {
      ...EMPTY_PRICING_DETAILS,
      ...((raw.pricing_details as Partial<PricingDetails>) ?? {}),
    } as PricingDetails,
  };
  return {
    id: row.id,
    app,
    status: row.status,
    suggestedAt: row.suggested_at,
    reviewedAt: row.reviewed_at,
  };
}

export function transformPendingApps(
  rows: PendingAppRow[] | null | undefined,
): PendingApp[] {
  if (!rows) return [];
  return rows
    .map((r) => transformPendingApp(r))
    .filter((p): p is PendingApp => p !== null);
}
