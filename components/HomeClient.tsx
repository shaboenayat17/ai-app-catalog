"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { AppCard } from "./AppCard";
import { CompareDropZone, COMPARE_DROP_ID } from "./CompareDropZone";
import {
  CATEGORIES,
  CATEGORY_META,
  PRICING_COLORS,
  PRICING_OPTIONS,
  type AIApp,
  type Category,
  type Pricing,
} from "@/lib/types";
import { useCompare } from "@/lib/compare-context";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import { detectIntent, getUseCaseById } from "@/lib/smart-search";
import { usePersona } from "@/hooks/usePersona";
import { PersonaSelector } from "./PersonaSelector";
import { NewThisWeekSection } from "./NewThisWeekSection";
import { TrendingSection } from "./TrendingSection";
import { PopularStacksSection } from "./PopularStacksSection";
import type { TrendingData } from "@/lib/types";

type SortKey = "featured" | "newest" | "alpha";

interface Props {
  apps: AIApp[];
  allTags: string[];
  lastUpdated: string;
  trending: TrendingData;
}

function parseList<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is T => (allowed as readonly string[]).includes(s));
}

export function HomeClient({ apps, allTags, lastUpdated, trending }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const compare = useCompare();
  const { persona, setPersonaId } = usePersona();

  const trendingSet = useMemo(
    () => new Set(trending.trending_apps),
    [trending.trending_apps],
  );
  const newApps = useMemo(
    () =>
      trending.new_this_week
        .map((id) => apps.find((a) => a.id === id))
        .filter((a): a is AIApp => Boolean(a)),
    [trending.new_this_week, apps],
  );
  const trendingApps = useMemo(
    () =>
      trending.trending_apps
        .map((id) => apps.find((a) => a.id === id))
        .filter((a): a is AIApp => Boolean(a)),
    [trending.trending_apps, apps],
  );
  const { ids: recentIds, push: pushRecent } = useRecentlyViewed();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [categories, setCategories] = useState<Category[]>(
    parseList(searchParams.get("cat"), CATEGORIES),
  );
  const [pricing, setPricing] = useState<Pricing[]>(
    parseList(searchParams.get("price"), PRICING_OPTIONS),
  );
  const [tags, setTags] = useState<string[]>(
    parseList(searchParams.get("tags"), allTags),
  );
  const [sort, setSort] = useState<SortKey>(
    (searchParams.get("sort") as SortKey) || "featured",
  );
  const [copied, setCopied] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (categories.length) params.set("cat", categories.join(","));
    if (pricing.length) params.set("price", pricing.join(","));
    if (tags.length) params.set("tags", tags.join(","));
    if (sort !== "featured") params.set("sort", sort);
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }, [query, categories, pricing, tags, sort, router]);

  // Smart search detection
  const intent = useMemo(() => detectIntent(query), [query]);
  const suggestedUseCase = getUseCaseById(intent.useCaseId);

  // Filtered apps
  const personaSet = useMemo(
    () => (persona ? new Set(persona.appIds) : null),
    [persona],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = apps.filter((app) => {
      if (personaSet && !personaSet.has(app.id)) return false;
      if (q) {
        const hay = `${app.name} ${app.description} ${app.tags.join(" ")} ${app.bestFor.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) {
          if (!intent.categories.includes(app.category)) return false;
        }
      }
      if (categories.length && !categories.includes(app.category)) return false;
      if (pricing.length && !pricing.includes(app.pricing)) return false;
      if (tags.length && !tags.some((t) => app.tags.includes(t))) return false;
      return true;
    });
    out = [...out].sort((a, b) => {
      if (sort === "alpha") return a.name.localeCompare(b.name);
      if (sort === "newest") return b.addedDate.localeCompare(a.addedDate);
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return out;
  }, [apps, query, categories, pricing, tags, sort, intent.categories, personaSet]);

  const personaStack = useMemo(
    () =>
      persona
        ? persona.appIds
            .map((id) => apps.find((a) => a.id === id))
            .filter((a): a is AIApp => Boolean(a))
            .slice(0, 4)
        : [],
    [persona, apps],
  );

  const featured = useMemo(
    () => apps.filter((a) => a.featured).slice(0, 8),
    [apps],
  );

  const recentApps = useMemo(
    () =>
      recentIds
        .map((id) => apps.find((a) => a.id === id))
        .filter((a): a is AIApp => Boolean(a)),
    [recentIds, apps],
  );

  const toggle = useCallback(
    <T extends string>(value: T, list: T[], setList: (next: T[]) => void) => {
      setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
    },
    [],
  );

  const clearAll = () => {
    setQuery("");
    setCategories([]);
    setPricing([]);
    setTags([]);
    setSort("featured");
  };

  const hasActiveFilters =
    query !== "" ||
    categories.length > 0 ||
    pricing.length > 0 ||
    tags.length > 0;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  // Focus search on '/' shortcut event
  useEffect(() => {
    const handler = (e: Event) => {
      const el = document.getElementById("hero-search") as HTMLInputElement | null;
      el?.focus();
      el?.select();
    };
    window.addEventListener("ai-catalog:focus-search", handler);
    return () => window.removeEventListener("ai-catalog:focus-search", handler);
  }, []);

  // DnD setup
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const onDragStart = (e: DragStartEvent) => setActiveDragId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveDragId(null);
    if (e.over?.id === COMPARE_DROP_ID) {
      compare.add(String(e.active.id));
    }
  };

  const draggingApp = activeDragId
    ? apps.find((a) => a.id === activeDragId) ?? null
    : null;

  const onView = (id: string) => pushRecent(id);

  const populateUseCase = () => {
    if (!suggestedUseCase) return;
    compare.clear();
    suggestedUseCase.appIds.slice(0, compare.max).forEach((id) => compare.add(id));
  };

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <FloatingIcons />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-card/80 px-3 py-1 text-xs text-muted backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent" />
              {apps.length} apps · {CATEGORIES.length} categories · updated {lastUpdated}
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Discover &amp; compare{" "}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-[length:200%_100%] bg-clip-text text-transparent animate-gradient-x">
                AI apps
              </span>{" "}
              that work together.
            </h1>
            <p className="mt-4 text-xl font-medium text-muted-strong">
              Find your perfect AI stack.
            </p>
            <p className="mt-4 max-w-2xl text-base text-muted">
              Pick a use case, drag tools into a workspace, and see which apps
              actually pair well — across writing, image, video, audio, code,
              and more.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder='Try "make a podcast" or "voiceover for video"…'
              />
              <Link
                href="/workflow"
                className="press inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-accent to-cyan-400 px-5 py-3 text-sm font-semibold text-bg shadow-glow transition hover:from-accent-hover"
              >
                <span aria-hidden>🧬</span>
                Build a stack
              </Link>
            </div>
            <div className="mt-3 hidden items-center gap-3 text-xs text-muted sm:flex">
              <kbd className="rounded border border-border bg-bg-card px-1.5 py-0.5 font-mono text-[10px]">/</kbd>
              search
              <kbd className="rounded border border-border bg-bg-card px-1.5 py-0.5 font-mono text-[10px]">C</kbd>
              compare
              <kbd className="rounded border border-border bg-bg-card px-1.5 py-0.5 font-mono text-[10px]">W</kbd>
              workflow
            </div>

            <div className="mt-7">
              <PersonaSelector
                selected={persona?.id ?? null}
                onSelect={(id) => setPersonaId(id)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Persona banner + your stack */}
      {persona && (
        <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-accent/40 bg-gradient-to-r from-accent/15 via-bg-card to-cyan-500/10 p-4 animate-fade-in-up">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span aria-hidden className="grid h-10 w-10 place-items-center rounded-lg bg-bg-card text-2xl">
                  {persona.emoji}
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted">
                    Showing recommended apps for
                  </p>
                  <p className="text-base font-semibold text-white">
                    {persona.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-strong">{persona.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/workflow?useCase=${persona.defaultUseCase}`}
                  className="press inline-flex min-h-[40px] items-center rounded-md bg-gradient-to-r from-accent to-cyan-400 px-3 text-xs font-semibold text-bg shadow-glow"
                >
                  Open in workflow →
                </Link>
                <button
                  type="button"
                  onClick={() => setPersonaId(null)}
                  className="press inline-flex min-h-[40px] items-center rounded-md border border-border bg-bg-card px-3 text-xs text-muted-strong hover:border-accent/40 hover:text-white"
                >
                  Clear persona
                </button>
              </div>
            </div>
            {personaStack.length > 0 && (
              <>
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Your stack
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {personaStack.map((a) => {
                    const m = CATEGORY_META[a.category];
                    return (
                      <Link
                        key={a.id}
                        href={`/app/${a.id}`}
                        className="press flex min-h-[64px] items-center gap-2 rounded-lg border border-border bg-bg-card p-2 transition active:bg-bg-hover hover:border-accent/40"
                      >
                        <span aria-hidden className={clsx("grid h-8 w-8 shrink-0 place-items-center rounded-md text-base", m.badge)}>
                          {m.emoji}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-white">{a.name}</span>
                          <span className="block truncate text-[10px] text-muted">{a.category}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {newApps.length > 0 && <NewThisWeekSection apps={newApps} />}
      {trendingApps.length > 0 && <TrendingSection apps={trendingApps} />}
      <PopularStacksSection
        stacks={trending.trending_stacks}
        apps={apps}
      />

      {/* Smart suggestion */}
      {suggestedUseCase && (
        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-accent/40 bg-gradient-to-r from-accent/15 via-bg-card to-cyan-500/10 p-4 sm:p-5 animate-fade-in-up">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted">
                  Suggested stack
                </p>
                <p className="mt-1 text-base font-semibold text-white">
                  <span className="mr-2" aria-hidden>{suggestedUseCase.emoji}</span>
                  {suggestedUseCase.label}
                </p>
                <p className="mt-1 text-sm text-muted-strong">
                  {suggestedUseCase.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={populateUseCase}
                  className="press rounded-md bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/15"
                >
                  Add to compare
                </button>
                <Link
                  href={`/workflow?useCase=${suggestedUseCase.id}`}
                  className="press rounded-md bg-gradient-to-r from-accent to-cyan-400 px-3 py-1.5 text-xs font-semibold text-bg shadow-glow"
                >
                  Open in workflow →
                </Link>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {suggestedUseCase.appIds.map((id) => {
                const app = apps.find((a) => a.id === id);
                if (!app) return null;
                const m = CATEGORY_META[app.category];
                return (
                  <span
                    key={id}
                    className={clsx(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
                      m.badge,
                    )}
                  >
                    <span aria-hidden>{m.emoji}</span> {app.name}
                  </span>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Stats bar */}
      <section className="border-b border-border/60 bg-bg/60 mt-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 divide-x divide-border/60">
            <Stat label="Apps" value={apps.length.toString()} />
            <Stat label="Categories" value={CATEGORIES.length.toString()} />
            <Stat label="Last updated" value={lastUpdated} />
          </div>
          <p className="border-t border-border/60 py-2 text-center text-[11px] text-muted">
            <span aria-hidden>🤖</span> Auto-updated every 2 days
          </p>
        </div>
      </section>

      {/* Recently viewed */}
      {recentApps.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <h2 className="mb-3 text-sm font-semibold text-white">Recently viewed</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentApps.map((app) => {
              const m = CATEGORY_META[app.category];
              return (
                <a
                  key={app.id}
                  href={app.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => pushRecent(app.id)}
                  className={clsx(
                    "press flex shrink-0 items-center gap-2 rounded-lg border bg-bg-card px-3 py-2 text-sm text-white transition hover:border-accent/40",
                    "border-border",
                  )}
                >
                  <span aria-hidden className={clsx("grid h-7 w-7 place-items-center rounded-md", m.badge)}>{m.emoji}</span>
                  <span className="font-medium">{app.name}</span>
                  <span className="text-[10px] text-muted">{app.category}</span>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Featured</h2>
              <p className="text-sm text-muted">Hand-picked apps worth knowing.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((app) => (
              <AppCard key={app.id} app={app} apps={apps} onView={onView} isTrending={trendingSet.has(app.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Catalog */}
      <section
        id="catalog"
        className="mx-auto max-w-7xl px-4 pb-32 sm:px-6 lg:px-8"
      >
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">All apps</h2>
            <p className="text-sm text-muted">
              {filtered.length} of {apps.length} match.
            </p>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-white outline-none transition hover:border-accent/50 focus:border-accent/70"
          >
            <option value="featured">Featured first</option>
            <option value="newest">Newest</option>
            <option value="alpha">A–Z</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
            <FilterGroup title="Category">
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => {
                  const m = CATEGORY_META[cat];
                  const active = categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggle(cat, categories, setCategories)}
                      className={clsx(
                        "press inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition",
                        active ? m.pillActive : m.pillIdle,
                      )}
                    >
                      <span aria-hidden>{m.emoji}</span>
                      {cat}
                    </button>
                  );
                })}
              </div>
            </FilterGroup>

            <FilterGroup title="Pricing">
              <div className="flex gap-1.5">
                {PRICING_OPTIONS.map((p) => {
                  const active = pricing.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggle(p, pricing, setPricing)}
                      className={clsx(
                        "press flex-1 rounded-md border px-2 py-1.5 text-xs transition",
                        active
                          ? clsx(PRICING_COLORS[p], "ring-1 ring-white/20")
                          : "border-border bg-bg-card text-muted hover:border-accent/40 hover:text-white",
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </FilterGroup>

            <FilterGroup title="Tags">
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => {
                  const active = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggle(tag, tags, setTags)}
                      className={clsx(
                        "press rounded-md border px-2 py-1 text-[11px] transition",
                        active
                          ? "border-accent/60 bg-accent/15 text-white"
                          : "border-border bg-bg-card text-muted hover:border-accent/40 hover:text-white",
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </FilterGroup>

            {hasActiveFilters && (
              <button
                onClick={clearAll}
                className="press mt-2 w-full rounded-md border border-border bg-bg-card px-3 py-2 text-xs font-medium text-muted-strong transition hover:border-accent/40 hover:text-white"
              >
                Clear all filters
              </button>
            )}
          </aside>

          <div>
            {hasActiveFilters && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {query && <Chip onRemove={() => setQuery("")} label={`“${query}”`} />}
                {categories.map((c) => (
                  <Chip key={c} label={c} onRemove={() => toggle(c, categories, setCategories)} />
                ))}
                {pricing.map((p) => (
                  <Chip key={p} label={p} onRemove={() => toggle(p, pricing, setPricing)} />
                ))}
                {tags.map((t) => (
                  <Chip key={t} label={`#${t}`} onRemove={() => toggle(t, tags, setTags)} />
                ))}
                <button
                  onClick={copyLink}
                  className="press ml-auto rounded-md border border-border bg-bg-card px-2.5 py-1 text-xs text-muted-strong transition hover:border-accent/40 hover:text-white"
                >
                  {copied ? "Link copied!" : "Copy link to filters"}
                </button>
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-bg-card/50 px-6 py-16 text-center">
                <p className="text-white">No apps match your filters.</p>
                <button
                  onClick={clearAll}
                  className="mt-3 text-sm text-accent hover:text-accent-hover"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((app) => (
                  <AppCard key={app.id} app={app} apps={apps} onView={onView} isTrending={trendingSet.has(app.id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <CompareDropZone visible={activeDragId !== null} />
      <DragOverlay dropAnimation={null}>
        {draggingApp ? <DragGhost app={draggingApp} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function DragGhost({ app }: { app: AIApp }) {
  const m = CATEGORY_META[app.category];
  return (
    <div className={clsx("flex items-center gap-2 rounded-xl border bg-bg-elevated px-3 py-2 shadow-lift", m.badge)}>
      <span aria-hidden>{m.emoji}</span>
      <span className="text-sm font-medium text-white">{app.name}</span>
    </div>
  );
}

function FloatingIcons() {
  const items = [
    { e: "✍️", x: "8%", y: "20%", a: "animate-float-slow" },
    { e: "🎨", x: "82%", y: "18%", a: "animate-float-medium" },
    { e: "🎬", x: "12%", y: "70%", a: "animate-float-fast" },
    { e: "🎵", x: "70%", y: "65%", a: "animate-float-slow" },
    { e: "💻", x: "55%", y: "12%", a: "animate-float-medium" },
    { e: "🔬", x: "30%", y: "45%", a: "animate-float-fast" },
    { e: "📊", x: "88%", y: "45%", a: "animate-float-medium" },
    { e: "🧊", x: "45%", y: "78%", a: "animate-float-slow" },
    { e: "⚡", x: "62%", y: "40%", a: "animate-float-fast" },
  ];
  return (
    <div aria-hidden className="absolute inset-0 -z-0 overflow-hidden bg-hero-mesh">
      {items.map((it, i) => (
        <span
          key={i}
          className={clsx(
            "absolute text-3xl opacity-40 sm:text-4xl",
            it.a,
          )}
          style={{ left: it.x, top: it.y }}
        >
          {it.e}
        </span>
      ))}
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative flex-1">
      <svg
        aria-hidden
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
      >
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        id="hero-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search…"}
        className="w-full rounded-lg border border-border bg-bg-card py-3 pl-10 pr-4 text-sm text-white placeholder:text-muted outline-none transition focus:border-accent/60 focus:shadow-glow"
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-5 text-center sm:py-6">
      <div className="text-xl font-semibold text-white sm:text-2xl">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 rounded-xl border border-border bg-bg-card/60 p-4">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</h3>
      {children}
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs text-white animate-scale-in">
      {label}
      <button onClick={onRemove} aria-label={`Remove ${label}`} className="text-muted hover:text-white">
        ×
      </button>
    </span>
  );
}
