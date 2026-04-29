"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { CATEGORY_META, PRICING_COLORS, type AIApp } from "@/lib/types";
import { storage, STORAGE_KEYS } from "@/lib/storage";

export function NewThisWeekSection({ apps }: { apps: AIApp[] }) {
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  if (apps.length === 0) return null;

  const subscribe = () => {
    if (!email.trim()) return;
    storage.set(STORAGE_KEYS.notifyEmail, email.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setEmail("");
    }, 2200);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white sm:text-xl">
            <span aria-hidden>✨</span> New this week
          </h2>
          <p className="text-xs text-muted">{apps.length} fresh tools added</p>
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex gap-3 pb-2">
          {apps.map((a) => {
            const m = CATEGORY_META[a.category];
            return (
              <li key={a.id} className="w-[260px] shrink-0 sm:w-[280px]">
                <Link
                  href={`/app/${a.id}`}
                  className="press relative flex h-full flex-col rounded-xl border border-border bg-bg-card p-4 transition active:bg-bg-hover hover:border-accent/40"
                >
                  <span className="absolute right-3 top-3 inline-flex items-center rounded-full border border-emerald-400/50 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-200">
                    NEW
                  </span>
                  <span aria-hidden className={clsx("grid h-11 w-11 place-items-center rounded-lg text-xl", m.badge, m.glow)}>
                    {m.emoji}
                  </span>
                  <h3 className="mt-3 truncate text-base font-semibold text-white">
                    {a.name}
                  </h3>
                  <p className="text-[11px] text-muted">{a.category}</p>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-strong">
                    {a.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={clsx("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide", PRICING_COLORS[a.pricing])}>
                      {a.pricing}
                    </span>
                    <span className="text-xs text-accent">View →</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-3 flex flex-col gap-2 rounded-xl border border-border bg-bg-card/60 p-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-xs text-muted-strong">
          📬 Want to know when new apps land? Drop your email — we'll add notifications soon.
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="min-h-[40px] flex-1 rounded-md border border-border bg-bg px-3 text-sm text-white placeholder:text-muted outline-none focus:border-accent/60"
          />
          <button
            type="button"
            onClick={subscribe}
            className="press min-h-[40px] rounded-md bg-accent/20 px-3 text-xs font-semibold text-accent transition hover:bg-accent/30"
          >
            {saved ? "Saved!" : "Notify me"}
          </button>
        </div>
      </div>
    </section>
  );
}
