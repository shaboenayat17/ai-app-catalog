"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { StarRating } from "./StarRating";
import { USE_CASES } from "@/lib/usecases";
import type { Review } from "@/lib/types";

interface Props {
  appName: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (r: Review) => void;
}

export function WriteReviewSheet({ appName, open, onClose, onSubmit }: Props) {
  const [stars, setStars] = useState(5);
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [useCase, setUseCase] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setStars(5);
      setAuthor("");
      setText("");
      setUseCase("");
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const valid = author.trim() && text.trim() && stars > 0;

  const submit = () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    const today = new Date().toISOString().slice(0, 10);
    onSubmit({
      author: author.trim(),
      rating: stars,
      text: text.trim(),
      date: today,
      useCase: useCase || "General",
    });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden
        className={clsx(
          "fixed inset-0 z-40 bg-black/55 transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        role="dialog"
        aria-label="Write a review"
        aria-hidden={!open}
        onClick={(e) => e.stopPropagation()}
        className={clsx(
          "fixed z-50 flex flex-col bg-bg-elevated shadow-lift transition-transform duration-300 ease-out",
          // Mobile: bottom sheet
          "inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t-2 border-accent/40",
          // Desktop: centered modal
          "sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:max-h-none sm:w-[460px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border-2",
          open ? "translate-y-0" : "translate-y-full sm:translate-y-[calc(-50%+20px)] sm:opacity-0",
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border/60 px-5 pb-3 pt-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">Review</p>
            <h2 className="mt-0.5 text-lg font-semibold text-white">{appName}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="press min-h-[44px] min-w-[44px] rounded-md text-muted hover:bg-bg-hover hover:text-white"
          >
            ×
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted">
              Your rating
            </label>
            <div className="mt-1.5">
              <StarRating value={stars} size="lg" onChange={setStars} />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted">
              Your name
            </label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Alex"
              maxLength={40}
              className="mt-1.5 min-h-[44px] w-full rounded-md border border-border bg-bg px-3 text-sm text-white placeholder:text-muted outline-none focus:border-accent/60"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted">
              Your review
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What worked, what didn't, who is it for?"
              rows={4}
              maxLength={600}
              className="mt-1.5 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-white placeholder:text-muted outline-none focus:border-accent/60"
            />
            <p className="mt-1 text-right text-[10px] text-muted">
              {text.length}/600
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted">
              Used it for
            </label>
            <select
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              className="mt-1.5 min-h-[44px] w-full rounded-md border border-border bg-bg px-3 text-sm text-white outline-none focus:border-accent/60"
            >
              <option value="">General use</option>
              {USE_CASES.map((u) => (
                <option key={u.id} value={u.label}>
                  {u.emoji} {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <footer className="border-t border-border/60 px-5 py-3" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}>
          <button
            type="button"
            onClick={submit}
            disabled={!valid || submitting}
            className={clsx(
              "press flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition",
              valid
                ? "bg-gradient-to-r from-accent to-cyan-400 text-bg shadow-glow hover:from-accent-hover"
                : "cursor-not-allowed bg-bg-card text-muted",
            )}
          >
            {submitting ? "Saving…" : "Submit review"}
          </button>
          <p className="mt-2 text-center text-[10px] text-muted">
            Saved locally on this device.
          </p>
        </footer>
      </aside>
    </>
  );
}
