"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useMenu } from "@/lib/menu-context";

interface Tab {
  href?: string;
  label: string;
  Icon: () => JSX.Element;
  match?: (path: string) => boolean;
  action?: "open-menu";
}

const TABS: Tab[] = [
  { href: "/", label: "Home", Icon: HomeIcon, match: (p) => p === "/" },
  { href: "/workflow", label: "Workflow", Icon: ShuffleIcon, match: (p) => p.startsWith("/workflow") },
  { href: "/compare", label: "Compare", Icon: BalanceIcon, match: (p) => p.startsWith("/compare") },
  { href: "/news", label: "News", Icon: NewspaperIcon, match: (p) => p.startsWith("/news") },
  { label: "More", Icon: MoreIcon, action: "open-menu" },
];

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  const { setOpen, open } = useMenu();

  return (
    <nav
      aria-label="Bottom navigation"
      className="bottom-nav fixed inset-x-0 bottom-0 z-30 border-t md:hidden"
      style={{
        backgroundColor: "rgba(15, 17, 23, 0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "rgba(255, 255, 255, 0.08)",
      }}
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-5">
        {TABS.map((tab) => {
          const active =
            tab.action === "open-menu"
              ? open
              : tab.match
              ? tab.match(pathname)
              : false;
          const Icon = tab.Icon;
          const inner = (
            <>
              {/* Active 2px top indicator */}
              <span
                aria-hidden
                className={clsx(
                  "absolute inset-x-4 top-0 h-[2px] rounded-b-full transition-opacity duration-150",
                  active ? "bg-accent opacity-100" : "opacity-0",
                )}
              />
              <span
                aria-hidden
                className={clsx(
                  "transition-colors duration-150",
                  active ? "text-accent" : "text-muted",
                )}
              >
                <Icon />
              </span>
              <span
                className={clsx(
                  "text-[10px] font-medium leading-none transition-colors duration-150",
                  active ? "text-accent" : "text-muted",
                )}
              >
                {tab.label}
              </span>
            </>
          );

          if (tab.action === "open-menu") {
            return (
              <li key={tab.label} className="flex">
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  aria-label="Open menu"
                  aria-haspopup="dialog"
                  aria-expanded={open}
                  className="press relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 px-2 pb-1 pt-1.5"
                >
                  {inner}
                </button>
              </li>
            );
          }

          return (
            <li key={tab.href} className="flex">
              <Link
                href={tab.href!}
                aria-current={active ? "page" : undefined}
                className="press relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 px-2 pb-1 pt-1.5"
              >
                {inner}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* -------------------- Icons -------------------- */

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 11l9-8 9 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ShuffleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M16 3h5v5M4 20l17-17M21 16v5h-5M15 15l6 6M4 4l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BalanceIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3v18M5 21h14M6 7l-3 6h6l-3-6zm12 0l-3 6h6l-3-6z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function NewspaperIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M17 9h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3M6 9h8M6 13h8M6 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function MoreIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="5" cy="6" r="1.6" fill="currentColor" />
      <circle cx="12" cy="6" r="1.6" fill="currentColor" />
      <circle cx="19" cy="6" r="1.6" fill="currentColor" />
      <circle cx="5" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" />
      <circle cx="5" cy="18" r="1.6" fill="currentColor" />
      <circle cx="12" cy="18" r="1.6" fill="currentColor" />
      <circle cx="19" cy="18" r="1.6" fill="currentColor" />
    </svg>
  );
}
