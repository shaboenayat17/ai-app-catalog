"use client";

/**
 * 4 skeleton news cards. Used while RSS is loading.
 */
export function SkeletonNews({ count = 4 }: { count?: number }) {
  return (
    <ul className="space-y-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="rounded-xl border border-border bg-bg-card p-4 sm:p-5"
        >
          <div className="mb-3 flex gap-2">
            <span className="block h-4 w-20 shimmer rounded-full" />
            <span className="block h-4 w-16 shimmer rounded-full" />
            <span className="block h-4 w-14 shimmer rounded-full" />
          </div>
          <span className="block h-5 w-3/4 shimmer rounded" />
          <span className="mt-2 block h-4 w-full shimmer rounded" />
          <span className="mt-1.5 block h-4 w-2/3 shimmer rounded" />
        </li>
      ))}
    </ul>
  );
}
