"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import type { AIApp } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";
import { AppLogo } from "./AppLogo";

export function OfflineClient({ apps }: { apps: AIApp[] }) {
  const [recentApps, setRecentApps] = useState<AIApp[]>([]);

  useEffect(() => {
    const ids = storage.get<string[]>(STORAGE_KEYS.recentlyViewed, []);
    const byId = new Map(apps.map((a) => [a.id, a]));
    setRecentApps(
      ids
        .map((id) => byId.get(id))
        .filter((a): a is AIApp => Boolean(a))
        .slice(0, 5),
    );
  }, [apps]);

  const retry = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

  return (
    <div className="grid min-h-[80vh] place-items-center px-4">
      <div className="w-full max-w-md text-center">
        <span aria-hidden className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-bg-card text-muted">
          <WifiOffIcon />
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          You're offline
        </h1>
        <p className="mt-3 text-sm text-muted-strong">
          Connect to the internet to discover new AI apps.
        </p>
        <button
          type="button"
          onClick={retry}
          className="press mt-6 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-gradient-to-r from-accent to-cyan-400 px-5 text-sm font-semibold text-bg shadow-glow"
        >
          ↻ Try again
        </button>

        {recentApps.length > 0 && (
          <>
            <hr className="my-8 border-border/60" />
            <div className="text-left">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Recently viewed
              </p>
              <div className="-mx-4 mt-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <ul className="flex gap-3 pb-2">
                  {recentApps.map((app) => {
                    const m = CATEGORY_META[app.category];
                    return (
                      <li key={app.id} className="w-[180px] shrink-0">
                        <Link
                          href={`/app/${app.id}`}
                          className="press flex h-full flex-col rounded-xl border border-border bg-bg-card p-3 transition active:bg-bg-hover"
                        >
                          <AppLogo
                            logoUrl={app.logoUrl}
                            appName={app.name}
                            category={app.category}
                            size="sm"
                          />
                          <span className="mt-2 truncate text-sm font-semibold text-white">
                            {app.name}
                          </span>
                          <span
                            className={`mt-1 inline-flex w-fit rounded-md border px-1.5 py-0.5 text-[10px] ${m.badge}`}
                          >
                            {app.category}
                          </span>
                          <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-emerald-300">
                            <span aria-hidden>●</span> Saved offline
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WifiOffIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <path d="M2 8.82a15 15 0 0 1 20 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 12.86a10 10 0 0 1 5.17-2.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14 10.16a10 10 0 0 1 5 2.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 16a5 5 0 0 1 6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="20" r="1" fill="currentColor" />
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
