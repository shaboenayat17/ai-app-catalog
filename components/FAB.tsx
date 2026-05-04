"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import clsx from "clsx";
import { apps } from "@/lib/data";
import { AppLogo } from "./AppLogo";

export function FAB() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQ("");
    }
  }, [open]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Hide on detail pages where it'd overlap the visit CTA
  if (pathname.startsWith("/app/")) return null;

  const results = q.trim()
    ? apps
        .filter((a) =>
          `${a.name} ${a.description}`.toLowerCase().includes(q.toLowerCase()),
        )
        .slice(0, 6)
    : apps.filter((a) => a.featured).slice(0, 6);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Quick search"
        className="press fixed bottom-20 right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-accent via-violet-500 to-fuchsia-500 text-2xl text-white shadow-glow transition hover:scale-105 active:scale-95 md:hidden"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <span aria-hidden>✨</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-20 backdrop-blur-sm md:items-center md:pt-0"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-lift animate-scale-in"
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <span aria-hidden className="text-lg">✨</span>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search apps…"
                className="min-h-[44px] w-full bg-transparent text-base text-white placeholder:text-muted outline-none"
              />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="press min-h-[44px] min-w-[44px] rounded-md text-muted hover:text-white"
              >
                ×
              </button>
            </div>
            <ul className="max-h-[60vh] divide-y divide-border/60 overflow-y-auto">
              {results.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-muted">
                  No matches.
                </li>
              )}
              {results.map((a) => {
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        router.push(`/app/${a.id}`);
                      }}
                      className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left transition active:bg-bg-hover"
                    >
                      <AppLogo logoUrl={a.logoUrl} appName={a.name} category={a.category} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-white">{a.name}</span>
                        <span className="block truncate text-[11px] text-muted">{a.category}</span>
                      </span>
                      <span aria-hidden className="text-muted">→</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
