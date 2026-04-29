"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import {
  CATEGORY_META,
  PRICING_COLORS,
  type AIApp,
} from "@/lib/types";
import { useCompare } from "@/lib/compare-context";

const SLOTS = 3;

export function CompareClient({ apps }: { apps: AIApp[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const compare = useCompare();
  const initial = useMemo(() => {
    const raw = params.get("apps");
    if (!raw) return ["", "", ""];
    const arr = raw.split(",").slice(0, SLOTS);
    while (arr.length < SLOTS) arr.push("");
    return arr;
  }, [params]);

  const [selected, setSelected] = useState<string[]>(initial);

  // Sync URL on change
  useEffect(() => {
    const ids = selected.filter(Boolean);
    const qs = ids.length ? `?apps=${ids.join(",")}` : "";
    router.replace(`/compare${qs}`, { scroll: false });
  }, [selected, router]);

  // Sync compare context on first mount only
  useEffect(() => {
    const ids = selected.filter(Boolean);
    if (ids.length === 0) return;
    compare.clear();
    ids.forEach((id) => compare.add(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSlot = (i: number, id: string) => {
    setSelected((prev) => {
      const next = [...prev];
      next[i] = id;
      return next;
    });
  };

  const reset = () => setSelected(["", "", ""]);

  const chosen = selected.map((id) => apps.find((a) => a.id === id) ?? null);
  const activeCount = chosen.filter(Boolean).length;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: SLOTS }).map((_, i) => {
          const app = chosen[i];
          const m = app ? CATEGORY_META[app.category] : null;
          return (
            <div
              key={i}
              className={clsx(
                "rounded-xl border bg-bg-card p-4 transition",
                m ? `${m.badge} border` : "border-border",
              )}
            >
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted">
                Slot {i + 1}
              </label>
              <select
                value={selected[i] ?? ""}
                onChange={(e) => setSlot(i, e.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-white outline-none transition hover:border-accent/40 focus:border-accent/60"
              >
                <option value="">— Select —</option>
                {apps.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {a.category}
                  </option>
                ))}
              </select>
              {app && m && (
                <div className="mt-3 flex items-center gap-2 text-xs text-white">
                  <span aria-hidden className="text-lg">{m.emoji}</span>
                  <span className="font-medium">{app.name}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={reset}
          className="press rounded-md border border-border bg-bg-card px-3 py-1.5 text-xs text-muted-strong hover:border-accent/40 hover:text-white"
        >
          Clear and start over
        </button>
        <p className="text-xs text-muted">Tip: drag cards from the catalog into the bottom dock to compare.</p>
      </div>

      {activeCount < 2 ? (
        <div className="rounded-xl border border-dashed border-border bg-bg-card/40 px-6 py-16 text-center">
          <p className="text-white">Pick at least two apps to compare.</p>
          <p className="mt-1 text-sm text-muted">
            Useful for picking between similar tools — e.g. Suno vs Udio, or Cursor vs Copilot.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-bg-card animate-fade-in-up">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="w-32 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Field
                </th>
                {chosen.map((app, i) => {
                  const m = app ? CATEGORY_META[app.category] : null;
                  return (
                    <th
                      key={i}
                      className={clsx(
                        "px-4 py-3 text-left text-sm font-semibold text-white",
                        m?.headerBg,
                      )}
                    >
                      {app ? (
                        <span className="inline-flex items-center gap-2">
                          <span aria-hidden>{m!.emoji}</span>
                          {app.name}
                        </span>
                      ) : (
                        "—"
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <Row label="Category">
                {chosen.map((app, i) => (
                  <td key={i} className="px-4 py-3">
                    {app ? (
                      <span
                        className={clsx(
                          "inline-flex rounded-md border px-2 py-0.5 text-xs",
                          CATEGORY_META[app.category].badge,
                        )}
                      >
                        {app.category}
                      </span>
                    ) : (
                      <Empty />
                    )}
                  </td>
                ))}
              </Row>
              <Row label="Pricing">
                {chosen.map((app, i) => (
                  <td key={i} className="px-4 py-3">
                    {app ? (
                      <span
                        className={clsx(
                          "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                          PRICING_COLORS[app.pricing],
                        )}
                      >
                        {app.pricing}
                      </span>
                    ) : (
                      <Empty />
                    )}
                  </td>
                ))}
              </Row>
              <Row label="Best for">
                {chosen.map((app, i) => (
                  <td key={i} className="px-4 py-3 align-top">
                    {app && app.bestFor.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {app.bestFor.map((b) => (
                          <span
                            key={b}
                            className="rounded-md border border-border bg-bg/60 px-1.5 py-0.5 text-[11px] text-muted-strong"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted text-xs">general</span>
                    )}
                  </td>
                ))}
              </Row>
              <Row label="Compatible with">
                {chosen.map((app, i) => (
                  <td key={i} className="px-4 py-3 align-top">
                    {app && app.compatibleWith.length > 0 ? (
                      <ul className="flex flex-wrap gap-1.5">
                        {app.compatibleWith.slice(0, 6).map((cid) => {
                          const c = apps.find((a) => a.id === cid);
                          if (!c) return null;
                          const m = CATEGORY_META[c.category];
                          return (
                            <li
                              key={cid}
                              className="inline-flex items-center gap-1 rounded-full border border-border bg-bg/60 px-2 py-0.5 text-xs text-white"
                            >
                              <span aria-hidden className={clsx("h-1.5 w-1.5 rounded-full", m.bar)} />
                              {c.name}
                            </li>
                          );
                        })}
                        {app.compatibleWith.length > 6 && (
                          <li className="text-[11px] text-muted">+{app.compatibleWith.length - 6}</li>
                        )}
                      </ul>
                    ) : (
                      <Empty />
                    )}
                  </td>
                ))}
              </Row>
              <Row label="Tags">
                {chosen.map((app, i) => (
                  <td key={i} className="px-4 py-3 align-top">
                    {app ? (
                      <div className="flex flex-wrap gap-1">
                        {app.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-md border border-border bg-bg/60 px-1.5 py-0.5 text-[10px] text-muted"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <Empty />
                    )}
                  </td>
                ))}
              </Row>
              <Row label="Description">
                {chosen.map((app, i) => (
                  <td key={i} className="px-4 py-3 align-top text-muted-strong">
                    {app?.description ?? <Empty />}
                  </td>
                ))}
              </Row>
              <Row label="✅ Pros">
                {chosen.map((app, i) => (
                  <td key={i} className="px-4 py-3 align-top">
                    {app ? (
                      <ul className="space-y-1.5">
                        {app.pros.slice(0, 4).map((p, idx) => (
                          <li key={idx} className="flex gap-1.5 text-xs leading-relaxed text-emerald-100/90">
                            <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Empty />
                    )}
                  </td>
                ))}
              </Row>
              <Row label="❌ Cons">
                {chosen.map((app, i) => (
                  <td key={i} className="px-4 py-3 align-top">
                    {app ? (
                      <ul className="space-y-1.5">
                        {app.cons.slice(0, 4).map((c, idx) => (
                          <li key={idx} className="flex gap-1.5 text-xs leading-relaxed text-rose-100/90">
                            <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Empty />
                    )}
                  </td>
                ))}
              </Row>
              <Row label="💡 Verdict">
                {chosen.map((app, i) => (
                  <td key={i} className="px-4 py-3 align-top">
                    {app ? (
                      <p className="text-xs leading-relaxed text-violet-100">{app.verdict}</p>
                    ) : (
                      <Empty />
                    )}
                  </td>
                ))}
              </Row>
              <Row label="Visit">
                {chosen.map((app, i) => (
                  <td key={i} className="px-4 py-3">
                    {app ? (
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noreferrer"
                        className="press inline-flex items-center gap-1 rounded-md bg-accent/15 px-3 py-1.5 text-xs font-medium text-accent transition hover:bg-accent/25"
                      >
                        Visit ↗
                      </a>
                    ) : (
                      <Empty />
                    )}
                  </td>
                ))}
              </Row>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="bg-bg/30 px-4 py-3 align-top text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </td>
      {children}
    </tr>
  );
}

function Empty() {
  return <span className="text-muted">—</span>;
}
