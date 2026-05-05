"use client";

/**
 * Pulsing placeholder card matching AppCard dimensions.
 * Use while the catalog is loading to keep layout stable.
 */
export function SkeletonCard() {
  return (
    <article
      aria-hidden
      className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-bg-card pl-4 pr-5 py-5"
    >
      <span className="absolute inset-y-0 left-0 w-1.5 bg-bg-hover" />
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="block h-10 w-10 shimmer rounded-lg" />
          <div className="space-y-2">
            <span className="block h-4 w-24 shimmer rounded" />
            <span className="block h-3 w-16 shimmer rounded" />
          </div>
        </div>
        <span className="block h-5 w-14 shimmer rounded-full" />
      </div>
      <span className="block h-3 w-full shimmer rounded" />
      <span className="mt-1.5 block h-3 w-5/6 shimmer rounded" />
      <div className="mt-4 flex gap-1.5">
        <span className="block h-4 w-12 shimmer rounded" />
        <span className="block h-4 w-16 shimmer rounded" />
        <span className="block h-4 w-10 shimmer rounded" />
      </div>
      <div className="mt-5 flex items-center justify-between">
        <span className="block h-7 w-20 shimmer rounded-md" />
        <span className="block h-7 w-24 shimmer rounded-md" />
      </div>
    </article>
  );
}

/** A grid of skeleton cards for the catalog. Defaults to 8 — first viewport on mobile. */
export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
