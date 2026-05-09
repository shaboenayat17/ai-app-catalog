"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useMenu } from "@/lib/menu-context";

const SUGGEST_URL =
  "https://github.com/your-org/ai-app-catalog/issues/new?title=Suggest%3A%20%5BApp%20Name%5D&body=%23%20App%20Name%0A%0A**Category%3A**%20%0A**URL%3A**%20%0A**Pricing%3A**%20Free%20%2F%20Freemium%20%2F%20Paid%0A**One-line%20description%3A**%20%0A**Tags%3A**%20";

interface Item {
  label: string;
  href: string;
  iconColor: string;
  external?: boolean;
  match?: (path: string) => boolean;
  Icon: () => JSX.Element;
}

interface Props {
  appCount: number;
  categoryCount: number;
  adminEnabled: boolean;
}

export function HamburgerMenu({ appCount, categoryCount, adminEnabled }: Props) {
  const { open, setOpen } = useMenu();
  const pathname = usePathname() ?? "/";

  // Close on Escape and on hardware-back navigation.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPop = () => setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
    };
  }, [open, setOpen]);

  const items: Item[] = [
    { label: "Home", href: "/", iconColor: "text-blue-300", match: (p) => p === "/", Icon: HomeIcon },
    { label: "Catalog", href: "/?source=menu", iconColor: "text-cyan-300", match: (p) => p === "/", Icon: GridIcon },
    { label: "Workflow Builder", href: "/workflow", iconColor: "text-violet-300", match: (p) => p.startsWith("/workflow"), Icon: ShuffleIcon },
    { label: "Compare Apps", href: "/compare", iconColor: "text-amber-300", match: (p) => p.startsWith("/compare"), Icon: BalanceIcon },
    { label: "News", href: "/news", iconColor: "text-rose-300", match: (p) => p.startsWith("/news"), Icon: NewspaperIcon },
  ];
  if (adminEnabled) {
    items.push({
      label: "Admin",
      href: "/admin",
      iconColor: "text-emerald-300",
      match: (p) => p.startsWith("/admin"),
      Icon: LockIcon,
    });
  }
  items.push({
    label: "Suggest an App",
    href: SUGGEST_URL,
    iconColor: "text-pink-300",
    external: true,
    Icon: BulbIcon,
  });

  // Tap → small delay so the highlight feedback reads, then close.
  const handleTap = () => {
    window.setTimeout(() => setOpen(false), 150);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Navigation menu"
      aria-modal="true"
      className="fixed inset-0 z-[10000] flex flex-col bg-bg backdrop-blur-md animate-menu-in"
      onClick={() => setOpen(false)}
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Header row */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-between border-b border-border/60 px-4 py-3"
      >
        <span className="text-lg font-bold text-white">Menu</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="press inline-flex h-11 w-11 items-center justify-center rounded-md text-muted hover:bg-bg-hover hover:text-white"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Menu items */}
      <nav
        onClick={(e) => e.stopPropagation()}
        className="flex-1 overflow-y-auto"
      >
        <ul>
          {items.map((item) => {
            const active = item.match ? item.match(pathname) : false;
            const ItemIcon = item.Icon;
            const linkProps = item.external
              ? {
                  href: item.href,
                  target: "_blank",
                  rel: "noreferrer",
                  onClick: handleTap,
                }
              : {
                  href: item.href,
                  onClick: handleTap,
                };
            const Tag: React.ElementType = item.external ? "a" : Link;
            return (
              <li key={item.label}>
                <Tag
                  {...linkProps}
                  className={clsx(
                    "flex min-h-[64px] items-center gap-4 border-b border-white/[0.06] px-5 transition",
                    active
                      ? "bg-accent/10 text-white"
                      : "text-muted-strong hover:bg-bg-hover hover:text-white",
                  )}
                >
                  <span aria-hidden className={clsx("shrink-0", item.iconColor)}>
                    <ItemIcon />
                  </span>
                  <span className="flex-1 text-base font-medium">{item.label}</span>
                  <span aria-hidden className="text-muted">
                    <ChevronIcon />
                  </span>
                </Tag>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="border-t border-border/60 px-5 py-3 text-center text-xs text-muted"
      >
        {appCount} apps · {categoryCount} categories
      </div>
    </div>
  );
}

/* -------------------- Icons -------------------- */

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 11l9-8 9 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ShuffleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M16 3h5v5M4 20l17-17M21 16v5h-5M15 15l6 6M4 4l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BalanceIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v18M5 21h14M6 7l-3 6h6l-3-6zm12 0l-3 6h6l-3-6z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function NewspaperIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M17 9h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3M6 9h8M6 13h8M6 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="11" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function BulbIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.5.4.8 1 .8 1.7V17h5.6v-1.5c0-.7.3-1.3.8-1.7A6 6 0 0 0 12 3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
