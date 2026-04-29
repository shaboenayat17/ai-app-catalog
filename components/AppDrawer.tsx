"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  CATEGORY_META,
  PRICING_COLORS,
  type AIApp,
} from "@/lib/types";
import {
  getAppExample,
  getAppRole,
  type MinimumStackApp,
  type UseCase,
} from "@/lib/usecases";
import { StarRating } from "./StarRating";

interface Props {
  app: AIApp | null;
  apps: AIApp[];
  nodesOnCanvas: Set<string>;
  selectedUseCase: UseCase | null;
  minStackApp: MinimumStackApp | null;
  onClose: () => void;
  onSwitchTo: (id: string) => void;
  onAddToCanvas: (id: string) => void;
  onPulse: (id: string) => void;
}

const CLOSE_DRAG_THRESHOLD = 110;

export function AppDrawer({
  app,
  apps,
  nodesOnCanvas,
  selectedUseCase,
  minStackApp,
  onClose,
  onSwitchTo,
  onAddToCanvas,
  onPulse,
}: Props) {
  const open = app !== null;
  // Keep last app visible during the slide-out animation.
  const [shownApp, setShownApp] = useState<AIApp | null>(null);
  const [shownStackApp, setShownStackApp] = useState<MinimumStackApp | null>(
    null,
  );
  const [isMobile, setIsMobile] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef<number | null>(null);

  useEffect(() => {
    if (app) {
      setShownApp(app);
      setShownStackApp(minStackApp);
    }
  }, [app, minStackApp]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Esc closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isMobile) return;
    startYRef.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (startYRef.current === null) return;
    setDragY(Math.max(0, e.clientY - startYRef.current));
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    if (startYRef.current === null) return;
    const delta = e.clientY - startYRef.current;
    startYRef.current = null;
    if (delta > CLOSE_DRAG_THRESHOLD) {
      onClose();
    }
    setDragY(0);
  };

  const meta = shownApp ? CATEGORY_META[shownApp.category] : null;

  const inlineStyle: CSSProperties = {
    borderColor: meta?.hex ?? "#2a3759",
    ...(isMobile && dragY > 0 ? { transform: `translateY(${dragY}px)` } : {}),
    ...(isMobile && dragY > 0 ? { transition: "none" } : {}),
  };

  return (
    <>
      {/* Mobile backdrop only */}
      <div
        onClick={onClose}
        aria-hidden
        className={clsx(
          "fixed inset-0 z-40 bg-black/55 transition-opacity duration-200 sm:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        role="dialog"
        aria-label="App details"
        aria-hidden={!open}
        onClick={(e) => e.stopPropagation()}
        style={inlineStyle}
        className={clsx(
          "fixed z-50 flex flex-col bg-bg-elevated shadow-lift transition-transform duration-300 ease-out",
          // Mobile bottom sheet
          "inset-x-0 bottom-0 max-h-[60vh] rounded-t-2xl border-t-2",
          // Desktop right drawer (overrides at sm+)
          "sm:inset-x-auto sm:right-0 sm:top-[60px] sm:bottom-0 sm:w-[320px] sm:max-h-none sm:rounded-none sm:rounded-l-2xl sm:border-t-0 sm:border-l-2",
          // Open / closed transforms — mobile uses Y, desktop uses X
          open ? "translate-y-0" : "translate-y-full",
          open ? "sm:translate-x-0" : "sm:translate-y-0 sm:translate-x-full",
        )}
      >
        {shownApp && meta && (
          <>
            {/* Mobile drag handle */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="flex shrink-0 cursor-grab touch-none justify-center py-2 sm:hidden"
            >
              <span className="block h-1 w-10 rounded-full bg-border-strong" />
            </div>

            {/* Header */}
            <header className="flex shrink-0 items-start gap-3 border-b border-border/60 px-5 pb-4 pt-3 sm:pt-5">
              <span
                aria-hidden
                className={clsx(
                  "grid h-12 w-12 shrink-0 place-items-center rounded-lg text-2xl",
                  meta.badge,
                  meta.glow,
                )}
              >
                {meta.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold leading-tight text-white">
                  {shownApp.name}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span
                    className={clsx(
                      "inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                      meta.badge,
                    )}
                  >
                    {shownApp.category}
                  </span>
                  <span
                    className={clsx(
                      "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                      PRICING_COLORS[shownApp.pricing],
                    )}
                  >
                    {shownApp.pricing}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close panel"
                className="press shrink-0 rounded-md p-1.5 text-muted transition hover:bg-bg-hover hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 4l8 8M12 4l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </header>

            {/* Body */}
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              <section>
                <p className="text-sm leading-relaxed text-muted-strong">
                  {shownApp.description}
                </p>
                {shownApp.bestFor.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted">
                      Best for
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {shownApp.bestFor.map((b) => (
                        <span
                          key={b}
                          className={clsx(
                            "rounded-full border px-2 py-0.5 text-[11px]",
                            meta.badge,
                          )}
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {!shownStackApp && (
                <section className="rounded-lg border border-accent/30 bg-accent/10 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-accent">
                    {selectedUseCase
                      ? `Role in ${selectedUseCase.label}`
                      : "What it does"}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-white">
                    {getAppRole(
                      shownApp.id,
                      shownApp.category,
                      shownApp.name,
                      selectedUseCase?.id,
                    )}
                  </p>
                  {shownApp.verdict && (
                    <p className="mt-2 border-t border-accent/20 pt-2 text-[11px] italic leading-relaxed text-accent">
                      💡 {shownApp.verdict}
                    </p>
                  )}
                </section>
              )}

              {/* Quick pros & cons */}
              {(shownApp.pros.length > 0 || shownApp.cons.length > 0) && (
                <section className="rounded-lg border border-border bg-bg-card p-3">
                  <p className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted">
                    <span>Pros &amp; cons</span>
                    <Link
                      href={`/app/${shownApp.id}`}
                      className="text-[11px] font-medium normal-case tracking-normal text-accent hover:text-accent-hover"
                    >
                      Full breakdown →
                    </Link>
                  </p>
                  <ul className="mt-2 space-y-1">
                    {shownApp.pros.slice(0, 2).map((p, i) => (
                      <li key={`p-${i}`} className="flex gap-1.5 text-xs leading-relaxed text-emerald-100/90">
                        <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                        <span>{p}</span>
                      </li>
                    ))}
                    {shownApp.cons.slice(0, 1).map((c, i) => (
                      <li key={`c-${i}`} className="flex gap-1.5 text-xs leading-relaxed text-rose-100/90">
                        <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {!shownStackApp && (() => {
                const example = getAppExample(shownApp.id, selectedUseCase?.id);
                if (!example) return null;
                return (
                  <section className="rounded-lg border border-indigo-400/30 bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-sky-500/10 p-3">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-200">
                      <span aria-hidden>💡</span>
                      Try this
                    </p>
                    <p className="mt-1 text-sm italic leading-relaxed text-indigo-50/95">
                      {example}
                    </p>
                  </section>
                );
              })()}

              {shownStackApp && (
                <section className="rounded-lg border border-emerald-400/40 bg-gradient-to-br from-emerald-500/15 via-bg-card to-teal-500/10 p-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-200">
                    <span aria-hidden>💰</span>
                    Roles in this stack
                  </p>
                  <ul className="mt-2 space-y-2.5">
                    {shownStackApp.roles.map((r) => (
                      <li key={r.label}>
                        <p className="text-sm font-semibold text-white">
                          <span aria-hidden className="mr-1.5">{r.emoji}</span>
                          {r.label}
                        </p>
                        <p className="mt-0.5 text-xs italic leading-relaxed text-emerald-50/90">
                          {r.tip}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {shownStackApp && (
                <section className="rounded-lg border border-border bg-bg-card p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Pricing
                  </p>
                  <p className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-white">
                      {shownApp.pricing}
                    </span>
                    <span className="text-xs text-muted">·</span>
                    <span className="text-xs text-muted-strong">
                      Free tier:{" "}
                      {shownStackApp.freeTier === true
                        ? "Yes"
                        : shownStackApp.freeTier === "limited"
                        ? "Limited"
                        : "No"}
                    </span>
                  </p>
                  <p className="mt-1.5 text-xs text-muted-strong">
                    <span className="text-muted">Estimated:</span>{" "}
                    {shownStackApp.monthlyCost}
                  </p>
                </section>
              )}

              {(() => {
                const top = [...shownApp.reviews]
                  .sort((a, b) => b.rating - a.rating || b.date.localeCompare(a.date))[0];
                if (!top) return null;
                return (
                  <section className="rounded-lg border border-border bg-bg-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                        <span aria-hidden>⭐</span> Top review
                      </p>
                      <Link
                        href={`/app/${shownApp.id}#reviews`}
                        className="text-[11px] text-accent hover:text-accent-hover"
                      >
                        See all →
                      </Link>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <StarRating value={top.rating} size="sm" />
                      <span className="text-xs font-semibold text-white">{top.author}</span>
                    </div>
                    <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-strong">
                      &ldquo;{top.text}&rdquo;
                    </p>
                  </section>
                );
              })()}

              {shownApp.compatibleWith.length > 0 && (
                <section>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-wider text-muted">
                      Works well with
                    </p>
                    <p className="text-[10px] text-muted">
                      {shownApp.compatibleWith.length}
                    </p>
                  </div>
                  <ul className="mt-1.5 grid grid-cols-2 gap-1.5">
                    {shownApp.compatibleWith.map((cid) => {
                      const c = apps.find((a) => a.id === cid);
                      if (!c) return null;
                      const cm = CATEGORY_META[c.category];
                      const onCanvas = nodesOnCanvas.has(cid);
                      return (
                        <li key={cid}>
                          <button
                            type="button"
                            onClick={() => {
                              if (onCanvas) {
                                onSwitchTo(cid);
                                onPulse(cid);
                              } else {
                                onAddToCanvas(cid);
                                onSwitchTo(cid);
                              }
                            }}
                            className={clsx(
                              "press group flex w-full items-center gap-2 rounded-md border bg-bg-card/80 px-2 py-1.5 text-left text-xs transition",
                              onCanvas
                                ? "border-border hover:border-accent/50 hover:bg-bg-hover"
                                : "border-dashed border-border/60 opacity-70 hover:border-accent/50 hover:opacity-100",
                            )}
                            title={
                              onCanvas
                                ? `Highlight ${c.name} on canvas`
                                : `Add ${c.name} to canvas`
                            }
                          >
                            <span
                              aria-hidden
                              className={clsx("h-2 w-2 shrink-0 rounded-full", cm.bar)}
                            />
                            <span className="min-w-0 flex-1 truncate text-white">
                              {c.name}
                            </span>
                            {!onCanvas && (
                              <span className="shrink-0 text-[10px] text-accent transition group-hover:text-accent-hover">
                                + Add
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </div>

            {/* Footer */}
            <footer className="shrink-0 border-t border-border/60 px-5 py-3">
              <a
                href={shownApp.url}
                target="_blank"
                rel="noreferrer"
                className="press flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-accent to-cyan-400 px-4 py-2.5 text-sm font-semibold text-bg shadow-glow transition hover:from-accent-hover"
              >
                Visit {shownApp.name}
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M3 9L9 3M9 3H4M9 3V8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
