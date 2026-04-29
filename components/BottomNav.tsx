"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

interface NavItem {
  href: string;
  label: string;
  emoji: string;
  match: (path: string) => boolean;
}

const ITEMS: NavItem[] = [
  { href: "/", label: "Home", emoji: "🏠", match: (p) => p === "/" },
  { href: "/workflow", label: "Workflow", emoji: "🔀", match: (p) => p.startsWith("/workflow") },
  { href: "/compare", label: "Compare", emoji: "⚖️", match: (p) => p.startsWith("/compare") },
  { href: "/news", label: "News", emoji: "📰", match: (p) => p.startsWith("/news") },
];

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-bg/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-4">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href} className="flex">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 px-2 py-1 text-[11px] transition active:scale-95",
                  active ? "text-white" : "text-muted",
                )}
              >
                <span aria-hidden className={clsx("text-xl leading-none", active && "drop-shadow-[0_0_10px_rgba(124,92,255,0.6)]")}>
                  {item.emoji}
                </span>
                <span className={clsx(active && "font-semibold")}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
