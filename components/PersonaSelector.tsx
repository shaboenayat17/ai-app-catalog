"use client";

import clsx from "clsx";
import { PERSONAS, type Persona } from "@/lib/personas";

interface Props {
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function PersonaSelector({ selected, onSelect }: Props) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
        Who are you?
      </p>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 pb-2 sm:flex-wrap">
          {PERSONAS.map((p) => (
            <PersonaChip
              key={p.id}
              persona={p}
              active={selected === p.id}
              onClick={() => onSelect(selected === p.id ? null : p.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PersonaChip({
  persona,
  active,
  onClick,
}: {
  persona: Persona;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "press inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition",
        active
          ? "border-accent bg-accent/15 text-white shadow-glow"
          : "border-border bg-bg-card text-muted-strong hover:border-accent/40 hover:text-white",
      )}
    >
      <span aria-hidden className="text-base">{persona.emoji}</span>
      {persona.short}
    </button>
  );
}
