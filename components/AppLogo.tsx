"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { CATEGORY_META, type Category } from "@/lib/types";

type Size = "sm" | "md" | "lg";

interface Props {
  logoUrl?: string | null;
  appName: string;
  category: Category;
  size?: Size;
  className?: string;
}

const SIZE_PX: Record<Size, number> = {
  sm: 32,
  md: 40,
  lg: 64,
};

/** Pull a domain out of a Clearbit-style URL like https://logo.clearbit.com/openai.com */
function clearbitDomain(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/clearbit\.com\/([^/?#]+)/i);
  return m ? m[1] : null;
}

/** Tier 2 fallback: Google's favicon API at the same domain. */
function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

export function AppLogo({
  logoUrl,
  appName,
  category,
  size = "md",
  className,
}: Props) {
  const px = SIZE_PX[size];
  // 0 = primary, 1 = google favicon, 2 = letter fallback
  const [stage, setStage] = useState<0 | 1 | 2>(logoUrl ? 0 : 2);

  // If logoUrl prop changes (e.g. switching apps in a drawer), reset.
  useEffect(() => {
    setStage(logoUrl ? 0 : 2);
  }, [logoUrl]);

  const meta = CATEGORY_META[category];
  const domain = clearbitDomain(logoUrl);

  // Decide which URL to load this render
  let src: string | null = null;
  if (stage === 0 && logoUrl) src = logoUrl;
  else if (stage === 1 && domain) src = faviconUrl(domain);

  if (src === null) {
    // Letter fallback in the category color
    return (
      <span
        aria-label={`${appName} logo`}
        role="img"
        className={clsx(
          "inline-grid shrink-0 place-items-center rounded-lg font-bold uppercase",
          meta.badge,
          className,
        )}
        style={{ width: px, height: px, fontSize: Math.round(px * 0.42) }}
      >
        {appName.charAt(0)}
      </span>
    );
  }

  return (
    <span
      className={clsx(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-lg bg-white/95",
        className,
      )}
      style={{ width: px, height: px }}
    >
      <Image
        // Force remount per stage so onError fires for each candidate URL.
        key={`${stage}:${src}`}
        src={src}
        alt={`${appName} logo`}
        width={px}
        height={px}
        unoptimized
        className="h-full w-full object-contain p-1"
        onError={() => {
          // Step to the next tier; if we're at primary and no favicon domain, jump to letter.
          setStage((s) => {
            if (s === 0) return domain ? 1 : 2;
            return 2;
          });
        }}
      />
    </span>
  );
}
