"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  CATEGORY_META,
  PRICING_COLORS,
  type AIApp,
  type Review,
} from "@/lib/types";
import { useReviews } from "@/hooks/useReviews";
import { StarRating } from "./StarRating";
import { RatingBreakdown } from "./RatingBreakdown";
import { PricingCard } from "./PricingCard";
import { WriteReviewSheet } from "./WriteReviewSheet";
import { ProsConsBlock } from "./ProsConsBlock";
type SortKey = "recent" | "rating" | "helpful";

export interface CompareSuggestion {
  id: string;
  title: string;
  otherAppId: string;
  expert: boolean;
}

export function AppDetailClient({
  app,
  apps,
  compareSuggestions = [],
}: {
  app: AIApp;
  apps: AIApp[];
  compareSuggestions?: CompareSuggestion[];
}) {
  const [sort, setSort] = useState<SortKey>("recent");
  const [sheetOpen, setSheetOpen] = useState(false);
  const { allReviews, addReview } = useReviews(app.id, app.reviews);

  const m = CATEGORY_META[app.category];

  const sorted = useMemo(() => {
    const arr = [...allReviews];
    if (sort === "recent") arr.sort((a, b) => b.date.localeCompare(a.date));
    if (sort === "rating") arr.sort((a, b) => b.rating - a.rating);
    if (sort === "helpful")
      arr.sort((a, b) => (b.helpfulCount ?? 0) - (a.helpfulCount ?? 0));
    return arr;
  }, [allReviews, sort]);

  const compatibleApps = app.compatibleWith
    .map((id) => apps.find((a) => a.id === id))
    .filter((a): a is AIApp => Boolean(a));

  const handleSubmit = (r: Review) => addReview(r);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-28 pt-6 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8">
      <Link
        href="/"
        className="press inline-flex min-h-[36px] items-center gap-1 text-xs text-muted hover:text-white"
      >
        ← Back to catalog
      </Link>

      {/* Header */}
      <header className="mt-4 flex flex-col gap-4 rounded-2xl border border-border bg-bg-card p-4 sm:flex-row sm:items-start sm:gap-5 sm:p-6">
        <span
          aria-hidden
          className={clsx(
            "grid h-16 w-16 shrink-0 place-items-center rounded-xl text-3xl",
            m.badge,
            m.glow,
          )}
        >
          {m.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {app.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={clsx("inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium", m.badge)}>
              {app.category}
            </span>
            <span className={clsx("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide", PRICING_COLORS[app.pricing])}>
              {app.pricing}
            </span>
            {app.isNew && (
              <span className="inline-flex rounded-full border border-emerald-400/50 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                NEW
              </span>
            )}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-strong">
            {app.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StarRating value={app.rating} size="md" showNumber count={app.reviewCount} />
            <a
              href={app.url}
              target="_blank"
              rel="noreferrer"
              className="press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-gradient-to-r from-accent to-cyan-400 px-4 text-sm font-semibold text-bg shadow-glow"
            >
              Visit {app.name}
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                <path d="M3 9L9 3M9 3H4M9 3V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Pricing */}
      <div className="mt-4">
        <PricingCard app={app} />
      </div>

      {/* Pros & cons */}
      <section className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-white sm:text-lg">
          Pros &amp; cons
        </h2>
        <ProsConsBlock
          pros={app.pros}
          cons={app.cons}
          verdict={app.verdict}
          notGoodFor={app.notGoodFor}
        />
      </section>

      {/* Suggested comparisons */}
      {compareSuggestions.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-base font-semibold text-white sm:text-lg">
            Compare {app.name} with…
          </h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {compareSuggestions.slice(0, 6).map((sug) => {
              const other = apps.find((a) => a.id === sug.otherAppId);
              if (!other) return null;
              const om = CATEGORY_META[other.category];
              return (
                <li key={sug.id}>
                  <Link
                    href={`/compare/${sug.id}`}
                    className="press flex min-h-[56px] items-center gap-2 rounded-md border border-border bg-bg-card p-2 text-sm text-white transition active:bg-bg-hover hover:border-accent/40"
                  >
                    <span aria-hidden className={clsx("grid h-8 w-8 shrink-0 place-items-center rounded-md text-base", m.badge)}>
                      {m.emoji}
                    </span>
                    <span aria-hidden className="text-xs font-bold text-muted">vs</span>
                    <span aria-hidden className={clsx("grid h-8 w-8 shrink-0 place-items-center rounded-md text-base", om.badge)}>
                      {om.emoji}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {app.name} vs {other.name}
                    </span>
                    {sug.expert ? (
                      <span
                        aria-label="Expert reviewed"
                        title="Expert reviewed"
                        className="rounded-full border border-violet-400/40 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-violet-200"
                      >
                        ✍️
                      </span>
                    ) : (
                      <span
                        aria-label="Auto-generated"
                        title="Auto-generated from app data"
                        className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-cyan-200"
                      >
                        🤖
                      </span>
                    )}
                    <span aria-hidden className="text-muted">→</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Compatible apps */}
      {compatibleApps.length > 0 && (
        <section className="mt-6">
          <h2 className="text-base font-semibold text-white sm:text-lg">
            Works well with
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {compatibleApps.slice(0, 9).map((c) => {
              const cm = CATEGORY_META[c.category];
              return (
                <li key={c.id}>
                  <Link
                    href={`/app/${c.id}`}
                    className="press flex min-h-[56px] items-center gap-2 rounded-md border border-border bg-bg-card p-2 text-sm text-white transition active:bg-bg-hover hover:border-accent/40"
                  >
                    <span aria-hidden className={clsx("grid h-8 w-8 shrink-0 place-items-center rounded-md text-base", cm.badge)}>
                      {cm.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{c.name}</span>
                      <span className="block truncate text-[10px] text-muted">{c.category}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Reviews */}
      <section id="reviews" className="mt-8 scroll-mt-24">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white sm:text-lg">
              Reviews
            </h2>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted">
              <StarRating value={app.rating} size="sm" />
              <span className="font-semibold text-muted-strong">
                {app.rating.toFixed(1)}
              </span>
              <span>· {app.reviewCount.toLocaleString()} reviews</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="press inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-accent/15 px-4 text-sm font-semibold text-accent transition hover:bg-accent/25"
          >
            ✍️ Write a review
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
          <div className="rounded-xl border border-border bg-bg-card p-4">
            <RatingBreakdown reviews={allReviews} reviewCount={app.reviewCount} />
          </div>

          <div>
            <div className="mb-3 flex items-center gap-1.5 overflow-x-auto">
              {(["recent", "rating", "helpful"] as SortKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSort(k)}
                  className={clsx(
                    "press min-h-[36px] shrink-0 rounded-full border px-3 text-xs transition",
                    sort === k
                      ? "border-accent/60 bg-accent/15 text-white"
                      : "border-border bg-bg-card text-muted-strong hover:border-accent/40 hover:text-white",
                  )}
                >
                  {k === "recent" && "Most recent"}
                  {k === "rating" && "Highest rated"}
                  {k === "helpful" && "Most helpful"}
                </button>
              ))}
            </div>

            <ul className="space-y-3">
              {sorted.length === 0 && (
                <li className="rounded-xl border border-dashed border-border bg-bg-card/50 px-4 py-8 text-center text-sm text-muted">
                  No reviews yet — be the first.
                </li>
              )}
              {sorted.map((r, i) => (
                <li
                  key={`${r.author}-${r.date}-${i}`}
                  className="rounded-xl border border-border bg-bg-card p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {r.author}
                      </p>
                      <p className="text-[11px] text-muted">
                        {formatDate(r.date)}
                        {r.useCase && r.useCase !== "General" && (
                          <span> · used for {r.useCase}</span>
                        )}
                      </p>
                    </div>
                    <StarRating value={r.rating} size="sm" />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-strong">
                    {r.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <WriteReviewSheet
        appName={app.name}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
