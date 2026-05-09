"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useMenu } from "@/lib/menu-context";

const SUGGEST_URL =
  "https://github.com/your-org/ai-app-catalog/issues/new?title=Suggest%3A%20%5BApp%20Name%5D&body=%23%20App%20Name%0A%0A**Category%3A**%20%0A**URL%3A**%20%0A**Pricing%3A**%20Free%20%2F%20Freemium%20%2F%20Paid%0A**One-line%20description%3A**%20%0A**Tags%3A**%20";

interface HeaderProps {
  adminEnabled?: boolean;
  pendingCount?: number;
}

export function Header({ adminEnabled = false, pendingCount = 0 }: HeaderProps) {
  const pathname = usePathname() ?? "/";
  const { setOpen } = useMenu();
  return (
    <header className="header sticky top-0 z-30 border-b border-border/60 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2">
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 bg-[length:200%_200%] text-xs font-bold text-bg shadow-glow animate-gradient-x"
          >
            AI
          </span>
          <span className="whitespace-nowrap text-[15px] font-semibold tracking-tight text-white sm:text-base">
            AI App Catalog
          </span>
        </Link>

        {/* Desktop nav — hidden on mobile */}
        <nav className="hidden items-center gap-1 text-sm md:flex">
          <NavLink href="/" active={pathname === "/"}>
            <span>Catalog</span>
          </NavLink>
          <NavLink href="/workflow" active={pathname.startsWith("/workflow")}>
            <span aria-hidden>🧬</span>
            <span>Workflow</span>
          </NavLink>
          <NavLink href="/compare" active={pathname.startsWith("/compare")}>
            <span>Compare</span>
          </NavLink>
          <NavLink href="/news" active={pathname.startsWith("/news")}>
            <span>News</span>
          </NavLink>
          {adminEnabled && (
            <NavLink href="/admin" active={pathname.startsWith("/admin")}>
              <span>Admin</span>
              {pendingCount > 0 && (
                <span
                  aria-label={`${pendingCount} pending`}
                  className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold leading-none text-white"
                >
                  {pendingCount}
                </span>
              )}
            </NavLink>
          )}
          <a
            href={SUGGEST_URL}
            target="_blank"
            rel="noreferrer"
            className="press ml-2 inline-flex h-10 items-center gap-1 whitespace-nowrap rounded-md border border-border bg-bg-card px-3 text-sm font-medium text-muted-strong transition hover:border-accent/50 hover:text-white"
          >
            Suggest an app
          </a>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-haspopup="dialog"
          className="press relative inline-flex h-11 w-11 items-center justify-center rounded-md text-white transition hover:bg-bg-hover md:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {adminEnabled && pendingCount > 0 && (
            <span
              aria-hidden
              className="absolute right-1.5 top-1.5 inline-flex min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white"
            >
              {pendingCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        // Each nav link: 40px tall, gap 4px, vertically centered, no wrap.
        "press inline-flex h-10 items-center justify-center gap-1 whitespace-nowrap rounded-md px-3 leading-none transition",
        active
          ? "bg-bg-card text-white"
          : "text-muted-strong hover:bg-bg-hover hover:text-white",
      )}
    >
      {children}
    </Link>
  );
}
