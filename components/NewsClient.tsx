"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import type { NewsItem } from "@/lib/types";
import { SkeletonNews } from "./SkeletonNews";

interface LiveArticle {
  title: string;
  summary: string;
  url: string;
  date: string;
  source: string;
  sourceColor: "orange" | "purple" | "blue" | "green";
  category: string;
}

interface ApiResponse {
  ok: boolean;
  articles: LiveArticle[];
  fetchedAt: string;
}

const SOURCE_STYLE: Record<string, string> = {
  orange: "border-orange-400/40 bg-orange-500/15 text-orange-200",
  purple: "border-purple-400/40 bg-purple-500/15 text-purple-200",
  blue: "border-blue-400/40 bg-blue-500/15 text-blue-200",
  green: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
};

export function NewsClient({ fallback }: { fallback: NewsItem[] }) {
  const [articles, setArticles] = useState<LiveArticle[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (force = false) => {
    setRefreshing(force);
    try {
      const res = await fetch("/api/news", {
        cache: force ? "no-store" : "default",
      });
      const data: ApiResponse = await res.json();
      if (data.ok && data.articles.length > 0) {
        setArticles(data.articles);
        setUsingFallback(false);
      } else {
        setArticles(null);
        setUsingFallback(true);
      }
    } catch {
      setArticles(null);
      setUsingFallback(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-28 pt-10 sm:px-6 sm:pb-16 lg:px-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            News
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/40 bg-rose-500/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-200">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-rose-400/70" />
                <span className="relative inline-block h-2 w-2 rounded-full bg-rose-400" />
              </span>
              Live
            </span>
          </h1>
          <p className="mt-2 text-sm text-muted-strong">
            {usingFallback
              ? "Showing cached news — live feed temporarily unavailable."
              : "Updated hourly from TechCrunch, The Verge, VentureBeat, and MIT Tech Review."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={refreshing}
          className={clsx(
            "press inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-border bg-bg-card px-3 text-xs font-semibold transition",
            refreshing
              ? "cursor-not-allowed text-muted opacity-70"
              : "text-muted-strong hover:border-accent/40 hover:text-white",
          )}
        >
          <span aria-hidden className={refreshing ? "animate-spin" : ""}>↻</span>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {loading && <SkeletonNews />}

      {!loading && usingFallback && (
        <FallbackList items={fallback} />
      )}

      {!loading && !usingFallback && articles && (
        <ul className="space-y-3">
          {articles.map((a, i) => (
            <ArticleCard key={`${a.source}-${i}-${a.url}`} article={a} />
          ))}
        </ul>
      )}
    </div>
  );
}

/* -------------------- Card + skeleton + fallback -------------------- */

function ArticleCard({ article }: { article: LiveArticle }) {
  const sourceCls = SOURCE_STYLE[article.sourceColor] ?? SOURCE_STYLE.blue;
  return (
    <li className="rounded-xl border border-border bg-bg-card p-4 transition hover:border-accent/40 sm:p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
        <span
          className={clsx(
            "inline-flex items-center rounded-full border px-2 py-0.5 font-semibold uppercase tracking-wider",
            sourceCls,
          )}
        >
          {article.source}
        </span>
        <span className="rounded-md border border-border bg-bg/60 px-1.5 py-0.5 uppercase tracking-wider text-muted">
          {article.category}
        </span>
        <span className="text-muted">·</span>
        <span className="text-muted">{timeAgo(article.date)}</span>
      </div>
      <a
        href={article.url}
        target="_blank"
        rel="noreferrer"
        className="block text-base font-semibold leading-snug text-white hover:text-accent sm:text-lg"
      >
        {article.title}
      </a>
      {article.summary && (
        <p className="mt-2 text-sm leading-relaxed text-muted-strong">
          {article.summary}
        </p>
      )}
    </li>
  );
}

function NewsSkeleton() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <li
          key={i}
          className="rounded-xl border border-border bg-bg-card p-4 sm:p-5"
        >
          <div className="mb-3 flex gap-2">
            <span className="h-4 w-20 animate-pulse rounded-full bg-bg-hover" />
            <span className="h-4 w-16 animate-pulse rounded-full bg-bg-hover" />
            <span className="h-4 w-14 animate-pulse rounded-full bg-bg-hover" />
          </div>
          <span className="mb-2 block h-5 w-3/4 animate-pulse rounded bg-bg-hover" />
          <span className="block h-4 w-full animate-pulse rounded bg-bg-hover" />
          <span className="mt-1.5 block h-4 w-2/3 animate-pulse rounded bg-bg-hover" />
        </li>
      ))}
    </ul>
  );
}

function FallbackList({ items }: { items: NewsItem[] }) {
  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <p className="mb-4 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
        ⚠️ Showing cached news — live feed temporarily unavailable.
      </p>
      <ul className="space-y-3">
        {sorted.map((item, i) => (
          <li
            key={i}
            className="rounded-xl border border-border bg-bg-card p-4 sm:p-5"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded-full border border-border bg-bg-card px-2 py-0.5 font-semibold uppercase tracking-wider text-muted-strong">
                {item.source}
              </span>
              <span className="rounded-md border border-border bg-bg/60 px-1.5 py-0.5 uppercase tracking-wider text-muted">
                {item.category}
              </span>
              <span className="text-muted">·</span>
              <span className="text-muted">{formatDateOnly(item.date)}</span>
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="block text-base font-semibold leading-snug text-white hover:text-accent sm:text-lg"
            >
              {item.title}
            </a>
            <p className="mt-2 text-sm leading-relaxed text-muted-strong">
              {item.summary}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}

/* -------------------- helpers -------------------- */

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const diff = Date.now() - t;
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.round(hr / 24);
  if (day === 1) return "yesterday";
  if (day < 7) return `${day} days ago`;
  return formatDateOnly(iso);
}

function formatDateOnly(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
