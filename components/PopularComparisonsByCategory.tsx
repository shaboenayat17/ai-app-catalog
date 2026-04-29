"use client";

import Link from "next/link";
import clsx from "clsx";
import { CATEGORY_META, type AIApp } from "@/lib/types";
import { pairSlug } from "@/lib/build-comparison";

interface CategorySection {
  label: string;
  emoji: string;
  pairs: Array<[string, string]>;
}

const CATEGORIES: CategorySection[] = [
  {
    label: "AI Assistants",
    emoji: "🤖",
    pairs: [
      ["chatgpt", "claude"],
      ["chatgpt", "gemini"],
      ["claude", "gemini"],
      ["perplexity", "chatgpt"],
    ],
  },
  {
    label: "Image Generation",
    emoji: "🎨",
    pairs: [
      ["midjourney", "dalle"],
      ["midjourney", "stable-diffusion"],
      ["dalle", "adobe-firefly"],
      ["canva-ai", "adobe-firefly"],
    ],
  },
  {
    label: "Video",
    emoji: "🎬",
    pairs: [
      ["runway", "pika"],
      ["runway", "kling"],
      ["pika", "kling"],
      ["luma-dream-machine", "runway"],
    ],
  },
  {
    label: "Coding",
    emoji: "💻",
    pairs: [
      ["cursor", "github-copilot"],
      ["replit", "cursor"],
      ["github-copilot", "claude"],
      ["v0", "bolt"],
    ],
  },
  {
    label: "Writing",
    emoji: "✍️",
    pairs: [
      ["jasper", "copy-ai"],
      ["grammarly", "notion-ai"],
      ["claude", "jasper"],
      ["chatgpt", "grammarly"],
    ],
  },
  {
    label: "Audio",
    emoji: "🎵",
    pairs: [
      ["elevenlabs", "descript"],
      ["suno", "elevenlabs"],
      ["suno", "udio"],
      ["whisper", "assemblyai"],
    ],
  },
];

export function PopularComparisonsByCategory({ apps }: { apps: AIApp[] }) {
  const byId = new Map(apps.map((a) => [a.id, a]));
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-white sm:text-lg">
          Popular comparisons by category
        </h2>
        <p className="text-xs text-muted">Tap any pair to see the full breakdown.</p>
      </div>
      {CATEGORIES.map((cat) => (
        <div key={cat.label}>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
            <span aria-hidden>{cat.emoji}</span>
            {cat.label}
          </p>
          <ul className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {cat.pairs.map(([id1, id2]) => {
              const a1 = byId.get(id1);
              const a2 = byId.get(id2);
              if (!a1 || !a2) return null;
              const m1 = CATEGORY_META[a1.category];
              const m2 = CATEGORY_META[a2.category];
              return (
                <li key={`${id1}-${id2}`}>
                  <Link
                    href={`/compare/${pairSlug(id1, id2)}`}
                    className="press group flex h-full min-h-[64px] items-center gap-2 rounded-xl border border-border bg-bg-card p-2.5 transition active:bg-bg-hover hover:border-accent/40"
                  >
                    <span aria-hidden className={clsx("grid h-7 w-7 shrink-0 place-items-center rounded text-sm", m1.badge)}>
                      {m1.emoji}
                    </span>
                    <span aria-hidden className="text-[9px] font-bold tracking-wider text-muted">VS</span>
                    <span aria-hidden className={clsx("grid h-7 w-7 shrink-0 place-items-center rounded text-sm", m2.badge)}>
                      {m2.emoji}
                    </span>
                    <span className="min-w-0 flex-1 text-[12px] font-medium leading-tight text-white">
                      <span className="block truncate">{a1.name}</span>
                      <span className="block truncate text-muted">vs {a2.name}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
