"use client";

import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import { useCompare } from "@/lib/compare-context";

export const COMPARE_DROP_ID = "compare-zone";

export function CompareDropZone({ visible }: { visible: boolean }) {
  const { ids, max } = useCompare();
  const { setNodeRef, isOver } = useDroppable({ id: COMPARE_DROP_ID });

  if (!visible) return null;

  const full = ids.length >= max;

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "pointer-events-auto fixed inset-x-0 bottom-24 z-30 mx-auto flex max-w-3xl items-center justify-center px-3",
      )}
    >
      <div
        className={clsx(
          "flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-5 text-sm font-medium transition animate-fade-in-up",
          full
            ? "border-amber-400/60 bg-amber-500/10 text-amber-200"
            : isOver
            ? "border-accent bg-accent/15 text-white shadow-glow"
            : "border-border bg-bg-elevated/80 text-muted-strong backdrop-blur",
        )}
      >
        <span aria-hidden>{isOver ? "⤵" : "🧪"}</span>
        {full
          ? `Compare tray is full (${max}). Drop to swap or remove one first.`
          : isOver
          ? "Release to add to compare"
          : "Drag here to add to compare"}
      </div>
    </div>
  );
}
