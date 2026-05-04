"use client";

import Link from "next/link";
import { type AIApp, type TrendingDirection } from "@/lib/types";
import { StarRating } from "./StarRating";
import { AppLogo } from "./AppLogo";

export function TrendingSection({ apps }: { apps: AIApp[] }) {
  if (apps.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
      <div className="mb-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white sm:text-xl">
          <span aria-hidden>🔥</span> Trending this week
        </h2>
        <p className="text-xs text-muted">Most-viewed apps right now</p>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {apps.slice(0, 6).map((a, i) => {
          return (
            <li key={a.id}>
              <Link
                href={`/app/${a.id}`}
                className="press relative flex h-full min-h-[120px] flex-col items-start rounded-xl border border-border bg-bg-card p-3 transition active:bg-bg-hover hover:border-orange-400/40"
              >
                <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-full border border-orange-400/40 bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-orange-200">
                  <span aria-hidden>🔥</span>
                  {i + 1}
                </span>
                <AppLogo logoUrl={a.logoUrl} appName={a.name} category={a.category} size="sm" />
                <h3 className="mt-2 truncate text-sm font-semibold text-white">
                  {a.name}
                </h3>
                <p className="text-[10px] text-muted">{a.category}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <StarRating value={a.rating} size="sm" />
                  <TrendArrow direction={a.trendingDirection} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function TrendArrow({ direction }: { direction: TrendingDirection }) {
  if (direction === "up") {
    return (
      <span aria-label="Trending up" className="inline-flex items-center text-[10px] font-bold text-emerald-300">
        ↑
      </span>
    );
  }
  if (direction === "down") {
    return (
      <span aria-label="Trending down" className="inline-flex items-center text-[10px] font-bold text-rose-300">
        ↓
      </span>
    );
  }
  return (
    <span aria-label="Stable" className="inline-flex items-center text-[10px] font-bold text-muted">
      →
    </span>
  );
}
