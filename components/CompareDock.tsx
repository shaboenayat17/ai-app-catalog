"use client";

import Link from "next/link";
import clsx from "clsx";
import { useCompare } from "@/lib/compare-context";
import { CATEGORY_META, type AIApp } from "@/lib/types";
import { AppLogo } from "./AppLogo";

export function CompareDock({ apps }: { apps: AIApp[] }) {
  const { ids, remove, clear, max } = useCompare();
  const chosen = ids
    .map((id) => apps.find((a) => a.id === id))
    .filter((a): a is AIApp => Boolean(a));

  if (chosen.length === 0) return null;

  const compareUrl = `/compare?apps=${chosen.map((a) => a.id).join(",")}`;
  const canCompare = chosen.length >= 2;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-4">
      <div
        className="pointer-events-auto flex w-full max-w-3xl items-center gap-3 rounded-2xl border border-border bg-bg-elevated/95 px-3 py-2 shadow-lift backdrop-blur-md animate-slide-up"
        role="region"
        aria-label="Compare tray"
      >
        <span className="hidden text-[11px] font-semibold uppercase tracking-wider text-muted sm:inline">
          Compare
        </span>
        <div className="flex flex-1 items-center gap-1.5 overflow-x-auto">
          {chosen.map((app) => {
            const meta = CATEGORY_META[app.category];
            return (
              <span
                key={app.id}
                className={clsx(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full border bg-bg-card py-0.5 pl-0.5 pr-2.5 text-xs",
                  meta.badge,
                )}
              >
                <AppLogo logoUrl={app.logoUrl} appName={app.name} category={app.category} size="sm" />
                <span className="font-medium text-white">{app.name}</span>
                <button
                  onClick={() => remove(app.id)}
                  aria-label={`Remove ${app.name}`}
                  className="text-muted hover:text-white"
                >
                  ×
                </button>
              </span>
            );
          })}
          {Array.from({ length: max - chosen.length }).map((_, i) => (
            <span
              key={`slot-${i}`}
              className="hidden shrink-0 rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted sm:inline"
            >
              slot {chosen.length + i + 1}
            </span>
          ))}
        </div>
        <button
          onClick={clear}
          className="press hidden rounded-md border border-border bg-bg-card px-2.5 py-1.5 text-xs text-muted-strong transition hover:border-accent/40 hover:text-white sm:inline-flex"
        >
          Clear
        </button>
        <Link
          href={compareUrl}
          aria-disabled={!canCompare}
          className={clsx(
            "press inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition",
            canCompare
              ? "bg-gradient-to-r from-accent to-cyan-400 text-bg shadow-glow hover:from-accent-hover"
              : "pointer-events-none cursor-not-allowed bg-bg-card text-muted",
          )}
        >
          Compare {canCompare ? `(${chosen.length})` : "—"}
          {canCompare && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 6h6m-2-3 3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </Link>
      </div>
    </div>
  );
}
