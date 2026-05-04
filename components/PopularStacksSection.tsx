"use client";

import Link from "next/link";
import { type AIApp, type TrendingStack } from "@/lib/types";
import { AppLogo } from "./AppLogo";

export function PopularStacksSection({
  stacks,
  apps,
}: {
  stacks: TrendingStack[];
  apps: AIApp[];
}) {
  if (stacks.length === 0) return null;
  const byId = new Map(apps.map((a) => [a.id, a]));
  return (
    <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
      <div className="mb-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white sm:text-xl">
          <span aria-hidden>💾</span> Popular stacks
        </h2>
        <p className="text-xs text-muted">Community-saved workflows you can fork</p>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stacks.slice(0, 4).map((s) => (
          <li key={s.id}>
            <Link
              href={`/workflow?useCase=${s.useCase}`}
              className="press flex h-full flex-col rounded-xl border border-border bg-gradient-to-br from-bg-card to-bg/40 p-4 transition active:bg-bg-hover hover:border-accent/40"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-white sm:text-base">
                  {s.title}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                  💾 {s.saves.toLocaleString()}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted">{s.subtitle}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1">
                {s.apps.map((id, i) => {
                  const a = byId.get(id);
                  if (!a) return null;
                  return (
                    <span key={id} className="inline-flex items-center gap-1">
                      {i > 0 && (
                        <span aria-hidden className="text-[10px] text-muted">+</span>
                      )}
                      <AppLogo logoUrl={a.logoUrl} appName={a.name} category={a.category} size="sm" />
                    </span>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] text-accent">Open workflow →</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
