"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { CATEGORY_META, type AIApp } from "@/lib/types";
import { pairSlug } from "@/lib/build-comparison";

export function PairBuilder({ apps }: { apps: AIApp[] }) {
  const router = useRouter();
  const [a1, setA1] = useState<string | null>(null);
  const [a2, setA2] = useState<string | null>(null);

  const canCompare = a1 && a2 && a1 !== a2;

  const go = () => {
    if (!canCompare) return;
    router.push(`/compare/${pairSlug(a1!, a2!)}`);
  };

  return (
    <section className="rounded-xl border border-border bg-bg-card p-4 sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        Compare any two apps
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:grid sm:grid-cols-[1fr_auto_1fr_auto] sm:items-stretch sm:gap-2">
        <AppPicker
          apps={apps}
          value={a1}
          onChange={setA1}
          excludeId={a2}
          placeholder="First app"
        />
        <span
          aria-hidden
          className="hidden self-center text-xs font-bold tracking-wider text-muted sm:inline"
        >
          VS
        </span>
        <AppPicker
          apps={apps}
          value={a2}
          onChange={setA2}
          excludeId={a1}
          placeholder="Second app"
        />
        <button
          type="button"
          onClick={go}
          disabled={!canCompare}
          className={clsx(
            "press inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition",
            canCompare
              ? "bg-gradient-to-r from-accent to-cyan-400 text-bg shadow-glow hover:from-accent-hover"
              : "cursor-not-allowed bg-bg text-muted",
          )}
        >
          Compare these apps
          <span aria-hidden>→</span>
        </button>
      </div>
      <p className="mt-2 text-[11px] text-muted">
        Works for any pair — pre-built deep dives or auto-generated from app data.
      </p>
    </section>
  );
}

function AppPicker({
  apps,
  value,
  onChange,
  excludeId,
  placeholder,
}: {
  apps: AIApp[];
  value: string | null;
  onChange: (id: string | null) => void;
  excludeId: string | null;
  placeholder: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const selected = apps.find((a) => a.id === value);
  const meta = selected ? CATEGORY_META[selected.category] : null;

  const matches = useMemo(() => {
    const query = q.trim().toLowerCase();
    return apps
      .filter((a) => a.id !== excludeId)
      .filter((a) => {
        if (!query) return true;
        return (
          a.name.toLowerCase().includes(query) ||
          a.category.toLowerCase().includes(query)
        );
      })
      .slice(0, 8);
  }, [apps, q, excludeId]);

  return (
    <div className="relative">
      {selected ? (
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setQ("");
            setOpen(true);
          }}
          className="press flex min-h-[44px] w-full items-center gap-2 rounded-md border border-border bg-bg px-3 text-left text-sm text-white"
        >
          <span aria-hidden className={clsx("grid h-7 w-7 shrink-0 place-items-center rounded text-base", meta!.badge)}>
            {meta!.emoji}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{selected.name}</span>
            <span className="block truncate text-[10px] text-muted">{selected.category}</span>
          </span>
          <span aria-hidden className="text-muted">×</span>
        </button>
      ) : (
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="min-h-[44px] w-full rounded-md border border-border bg-bg px-3 text-sm text-white placeholder:text-muted outline-none focus:border-accent/60"
        />
      )}
      {open && !selected && matches.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-bg-elevated shadow-lift"
        >
          {matches.map((a) => {
            const m = CATEGORY_META[a.category];
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(a.id);
                    setOpen(false);
                    setQ("");
                  }}
                  className="flex min-h-[44px] w-full items-center gap-2 px-3 text-left text-sm text-white transition hover:bg-bg-hover"
                >
                  <span aria-hidden className={clsx("grid h-7 w-7 shrink-0 place-items-center rounded text-base", m.badge)}>
                    {m.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{a.name}</span>
                    <span className="block truncate text-[10px] text-muted">{a.category}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
