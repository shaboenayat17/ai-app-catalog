"use client";

import { useState } from "react";
import clsx from "clsx";
import type { AIApp } from "@/lib/types";

export function PricingCard({ app }: { app: AIApp }) {
  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");
  const p = app.pricing_details;
  const discount = p.annual_discount && p.annual_discount !== "0%" ? p.annual_discount : null;
  return (
    <section className="rounded-xl border border-border bg-bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white sm:text-lg">Pricing</h2>
        <div className="flex rounded-full border border-border bg-bg p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setPeriod("monthly")}
            className={clsx(
              "min-h-[32px] rounded-full px-3 transition",
              period === "monthly"
                ? "bg-accent/20 text-white"
                : "text-muted hover:text-white",
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setPeriod("annual")}
            className={clsx(
              "min-h-[32px] rounded-full px-3 transition",
              period === "annual"
                ? "bg-accent/20 text-white"
                : "text-muted hover:text-white",
            )}
          >
            Annual{discount && <span className="ml-1 text-emerald-300">{discount}</span>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-bg p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted">
            Free tier
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {p.free_tier ? "Available" : "Not available"}
          </p>
          {p.free_tier && p.free_tier_limits && (
            <p className="mt-1 text-xs text-muted-strong">{p.free_tier_limits}</p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-bg p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted">
            Starts at
          </p>
          <p className="mt-1 text-sm font-semibold text-white">{p.starting_price}</p>
          <p className="mt-1 text-xs text-muted-strong">
            Most popular: {p.most_popular_plan}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <Estimate label="Light" value={p.estimated_monthly_cost.light_user} />
        <Estimate label="Regular" value={p.estimated_monthly_cost.regular_user} accent />
        <Estimate label="Power" value={p.estimated_monthly_cost.power_user} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        {p.free_trial !== "none" && (
          <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-emerald-200">
            🎁 Free trial: {p.free_trial}
          </span>
        )}
        {p.has_student_discount && (
          <span className="rounded-full border border-blue-400/40 bg-blue-500/10 px-2 py-0.5 text-blue-200">
            🎓 Student discount
          </span>
        )}
        <a
          href={app.url}
          target="_blank"
          rel="noreferrer"
          className="press ml-auto inline-flex min-h-[36px] items-center gap-1 rounded-md bg-accent/15 px-3 text-xs font-medium text-accent hover:bg-accent/25"
        >
          See plans ↗
        </a>
      </div>
    </section>
  );
}

function Estimate({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-lg border p-2",
        accent
          ? "border-accent/40 bg-accent/10"
          : "border-border bg-bg",
      )}
    >
      <p className="text-[10px] uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className={clsx("mt-0.5 text-sm font-semibold", accent ? "text-white" : "text-muted-strong")}>
        {value}
      </p>
    </div>
  );
}
