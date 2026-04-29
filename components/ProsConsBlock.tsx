"use client";

import clsx from "clsx";

interface Props {
  pros: string[];
  cons: string[];
  verdict?: string;
  notGoodFor?: string;
  /** When true, render as stacked single column (used inside narrower contexts). */
  compact?: boolean;
}

export function ProsConsBlock({ pros, cons, verdict, notGoodFor, compact = false }: Props) {
  return (
    <div className="space-y-4">
      <div
        className={clsx(
          "grid gap-3",
          compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2",
        )}
      >
        <PrCol kind="pros" items={pros} />
        <PrCol kind="cons" items={cons} />
      </div>

      {verdict && (
        <div className="rounded-xl border border-violet-400/40 bg-gradient-to-br from-violet-500/15 via-bg-card to-blue-500/10 p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-200">
            <span aria-hidden>💡</span> Verdict
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-white">{verdict}</p>
        </div>
      )}

      {notGoodFor && (
        <div className="rounded-xl border border-amber-400/40 bg-gradient-to-br from-amber-500/15 via-bg-card to-orange-500/10 p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
            <span aria-hidden>⚠️</span> Not great for
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-white">{notGoodFor}</p>
        </div>
      )}
    </div>
  );
}

function PrCol({ kind, items }: { kind: "pros" | "cons"; items: string[] }) {
  const isPros = kind === "pros";
  return (
    <section
      className={clsx(
        "rounded-xl border p-4",
        isPros
          ? "border-emerald-400/40 bg-emerald-500/10"
          : "border-rose-400/40 bg-rose-500/10",
      )}
    >
      <p
        className={clsx(
          "flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider",
          isPros ? "text-emerald-200" : "text-rose-200",
        )}
      >
        <span aria-hidden>{isPros ? "✅" : "❌"}</span>
        {isPros ? "Pros" : "Cons"}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted-strong">
            <span
              aria-hidden
              className={clsx(
                "mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full",
                isPros ? "bg-emerald-400" : "bg-rose-400",
              )}
            />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
