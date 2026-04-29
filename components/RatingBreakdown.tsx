"use client";

import type { Review } from "@/lib/types";

export function RatingBreakdown({
  reviews,
  reviewCount,
}: {
  reviews: Review[];
  reviewCount: number;
}) {
  // Use either provided seed total or derived counts.
  const total = Math.max(reviewCount, reviews.length, 1);
  const buckets = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    // Scale up the local count to a faux distribution proportional to overall rating
    const pct = Math.round((count / Math.max(reviews.length, 1)) * 100);
    return { star, count, pct };
  });

  return (
    <ul className="space-y-1.5">
      {buckets.map(({ star, pct }) => (
        <li key={star} className="flex items-center gap-2 text-xs text-muted">
          <span className="w-7 shrink-0 text-right tabular-nums text-muted-strong">
            {star}★
          </span>
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-bg-card">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-amber-400/70"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right tabular-nums">{pct}%</span>
        </li>
      ))}
      <li className="pt-1 text-[10px] text-muted">
        Based on {total.toLocaleString()} ratings
      </li>
    </ul>
  );
}
