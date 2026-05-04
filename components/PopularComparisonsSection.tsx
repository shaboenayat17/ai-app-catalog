"use client";

import Link from "next/link";
import { type AIApp, type Comparison } from "@/lib/types";
import { AppLogo } from "./AppLogo";

interface Props {
  comparisons: Comparison[];
  apps: AIApp[];
  limit?: number;
}

export function PopularComparisonsSection({ comparisons, apps, limit = 6 }: Props) {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-white sm:text-lg">
        Popular comparisons
      </h2>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {comparisons.slice(0, limit).map((c) => {
          const a1 = apps.find((a) => a.id === c.app1);
          const a2 = apps.find((a) => a.id === c.app2);
          if (!a1 || !a2) return null;
          return (
            <li key={c.id}>
              <Link
                href={`/compare/${c.id}`}
                className="press group flex min-h-[68px] items-center gap-3 rounded-xl border border-border bg-bg-card p-3 transition active:bg-bg-hover hover:border-accent/40"
              >
                <AppLogo logoUrl={a1.logoUrl} appName={a1.name} category={a1.category} size="sm" />
                <span aria-hidden className="text-[10px] font-bold tracking-wider text-muted">VS</span>
                <AppLogo logoUrl={a2.logoUrl} appName={a2.name} category={a2.category} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">
                    {c.title}
                  </span>
                  <span className="block truncate text-[11px] text-muted">
                    {c.subtitle}
                  </span>
                </span>
                <span aria-hidden className="text-muted transition group-hover:text-accent">→</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
