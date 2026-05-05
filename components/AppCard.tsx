"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  CATEGORY_META,
  PRICING_COLORS,
  type AIApp,
} from "@/lib/types";
import { useCompare } from "@/lib/compare-context";
import { StarRating } from "./StarRating";
import { TrendArrow } from "./TrendingSection";
import { AppLogo } from "./AppLogo";

interface Props {
  app: AIApp;
  apps: AIApp[];
  draggable?: boolean;
  onView?: (id: string) => void;
  isTrending?: boolean;
  /** When true, the logo loads eagerly (above the fold). */
  priority?: boolean;
}

export function AppCard({
  app,
  apps,
  draggable = true,
  onView,
  isTrending = false,
  priority = false,
}: Props) {
  const meta = CATEGORY_META[app.category];
  const compare = useCompare();
  const inCompare = compare.has(app.id);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: app.id, disabled: !draggable });

  const compatibleApps = app.compatibleWith
    .map((id) => apps.find((a) => a.id === id))
    .filter((a): a is AIApp => Boolean(a));

  const priceLabel = formatPriceLabel(app);

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={clsx(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-bg-card pl-4 pr-5 py-5 lift",
        app.featured && "gradient-border",
        inCompare
          ? "border-accent/60 shadow-glow"
          : "border-border hover:border-accent/40 hover:bg-bg-hover",
        isDragging && "opacity-40",
      )}
    >
      {/* Color strip */}
      <span
        aria-hidden
        className={clsx(
          "absolute inset-y-0 left-0 w-1.5",
          meta.bar,
        )}
      />

      {/* Drag handle (top-left) */}
      {draggable && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Drag ${app.name} to compare`}
          className="absolute left-3 top-3 cursor-grab rounded p-0.5 text-muted opacity-0 transition hover:text-white group-hover:opacity-100 active:cursor-grabbing"
        >
          <DragIcon />
        </button>
      )}

      {/* Corner badges */}
      {(app.isNew || isTrending) && (
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
          {app.isNew && (
            <span className="inline-flex items-center rounded-full border border-emerald-400/50 bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-200">
              NEW
            </span>
          )}
          {isTrending && (
            <span className="inline-flex items-center gap-0.5 rounded-full border border-orange-400/40 bg-orange-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-200">
              <span aria-hidden>🔥</span> Trending
            </span>
          )}
        </div>
      )}

      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <AppLogo
            logoUrl={app.logoUrl}
            appName={app.name}
            category={app.category}
            size="md"
            className={meta.glow}
            priority={priority}
          />
          <div className="min-w-0">
            <Link
              href={`/app/${app.id}`}
              onClick={() => onView?.(app.id)}
              className="block truncate text-left font-semibold leading-tight text-white transition hover:text-accent"
            >
              {app.name}
            </Link>
            <span
              className={clsx(
                "mt-1 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                meta.badge,
              )}
            >
              {app.category}
            </span>
          </div>
        </div>
      </div>

      {/* Rating + price + trend */}
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <StarRating value={app.rating} size="sm" showNumber count={app.reviewCount} />
        <TrendArrow direction={app.trendingDirection} />
        <span className="ml-auto text-[11px] font-medium text-muted-strong">
          {priceLabel}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-muted-strong">{app.description}</p>

      {app.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {app.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-border bg-bg/60 px-1.5 py-0.5 text-[10px] text-muted"
            >
              {tag}
            </span>
          ))}
          {app.tags.length > 4 && (
            <span className="text-[10px] text-muted">+{app.tags.length - 4}</span>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <a
            href={app.url}
            target="_blank"
            rel="noreferrer"
            onClick={() => onView?.(app.id)}
            className={clsx(
              "press inline-flex min-h-[40px] items-center gap-1 rounded-md px-3 text-xs font-medium transition",
              meta.badge,
              "hover:brightness-125",
            )}
          >
            Visit
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M3 9L9 3M9 3H4M9 3V8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <CompatBadge count={compatibleApps.length} apps={compatibleApps} />
        </div>
        <button
          type="button"
          onClick={() =>
            inCompare ? compare.remove(app.id) : compare.add(app.id)
          }
          aria-pressed={inCompare}
          className={clsx(
            "press inline-flex min-h-[40px] items-center rounded-md border px-3 text-[11px] font-medium transition",
            inCompare
              ? "border-accent/60 bg-accent/15 text-white"
              : "border-border bg-bg-card text-muted-strong hover:border-accent/40 hover:text-white",
          )}
        >
          {inCompare ? "✓ In compare" : "+ Compare"}
        </button>
      </div>

      {/* Footer links */}
      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3 text-[11px]">
        <Link
          href={`/app/${app.id}#reviews`}
          className="press inline-flex min-h-[36px] items-center gap-1 text-muted hover:text-white"
        >
          Pros &amp; cons
          <span aria-hidden>›</span>
        </Link>
        <Link
          href={`/app/${app.id}`}
          className="press inline-flex min-h-[36px] items-center gap-1 text-muted hover:text-white"
        >
          Compare
          <span aria-hidden>›</span>
        </Link>
      </div>
    </article>
  );
}

function formatPriceLabel(app: AIApp): string {
  const p = app.pricing_details;
  const free = p.free_tier ? "Free" : null;
  const start = p.starting_price && p.starting_price !== "$0" ? p.starting_price : null;
  if (free && start) return `Free · from ${start.replace("/mo", "/mo")}`;
  if (free) return "Free";
  if (start) return `from ${start}`;
  return app.pricing;
}

function CompatBadge({
  count,
  apps,
}: {
  count: number;
  apps: AIApp[];
}) {
  const [open, setOpen] = useState(false);
  // close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [open]);

  if (count === 0) return null;

  return (
    <span className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="press inline-flex items-center gap-1 rounded-md border border-border bg-bg/60 px-2 py-1 text-[11px] text-muted-strong transition hover:border-accent/40 hover:text-white"
        aria-label={`Pairs with ${count} apps`}
      >
        <LinkIcon />
        {count}
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full left-0 z-20 mb-2 w-60 rounded-lg border border-border bg-bg-elevated p-2 shadow-lift animate-scale-in"
        >
          <p className="px-1 pb-1 text-[10px] uppercase tracking-wider text-muted">
            Pairs with
          </p>
          <ul className="max-h-56 space-y-0.5 overflow-y-auto">
            {apps.map((c) => {
              const m = CATEGORY_META[c.category];
              return (
                <li key={c.id} className="flex items-center gap-2 rounded px-1.5 py-1 text-xs text-white hover:bg-bg-hover">
                  <span aria-hidden className={clsx("h-2 w-2 rounded-full", m.bar)} />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-[10px] text-muted">{c.category}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </span>
  );
}

function DragIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="4" cy="3" r="1" fill="currentColor" />
      <circle cx="4" cy="7" r="1" fill="currentColor" />
      <circle cx="4" cy="11" r="1" fill="currentColor" />
      <circle cx="10" cy="3" r="1" fill="currentColor" />
      <circle cx="10" cy="7" r="1" fill="currentColor" />
      <circle cx="10" cy="11" r="1" fill="currentColor" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <path
        d="M5 7l2-2M3.5 8.5a1.8 1.8 0 0 1 0-2.5l1.5-1.5M8.5 3.5a1.8 1.8 0 0 1 0 2.5l-1.5 1.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
