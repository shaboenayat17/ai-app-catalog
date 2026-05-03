"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const SUGGEST_URL =
  "https://github.com/your-org/ai-app-catalog/issues/new?title=Suggest%3A%20%5BApp%20Name%5D&body=%23%20App%20Name%0A%0A**Category%3A**%20%0A**URL%3A**%20%0A**Pricing%3A**%20Free%20%2F%20Freemium%20%2F%20Paid%0A**One-line%20description%3A**%20%0A**Tags%3A**%20";

interface HeaderProps {
  adminEnabled?: boolean;
  pendingCount?: number;
}

export function Header({ adminEnabled = false, pendingCount = 0 }: HeaderProps) {
  const pathname = usePathname() ?? "/";
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2">
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 bg-[length:200%_200%] text-xs font-bold text-bg shadow-glow animate-gradient-x"
          >
            AI
          </span>
          <span className="text-sm font-semibold tracking-tight text-white sm:text-base">
            AI App Catalog
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <NavLink href="/" active={pathname === "/"}>Catalog</NavLink>
          <NavLink href="/workflow" active={pathname.startsWith("/workflow")}>
            <span className="mr-1" aria-hidden>🧬</span>Workflow
          </NavLink>
          <NavLink href="/compare" active={pathname.startsWith("/compare")}>Compare</NavLink>
          <NavLink href="/news" active={pathname.startsWith("/news")}>News</NavLink>
          {adminEnabled && (
            <NavLink href="/admin" active={pathname.startsWith("/admin")}>
              <span className="inline-flex items-center gap-1.5">
                Admin
                {pendingCount > 0 && (
                  <span
                    aria-label={`${pendingCount} pending`}
                    className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold leading-none text-white"
                  >
                    {pendingCount}
                  </span>
                )}
              </span>
            </NavLink>
          )}
          <a
            href={SUGGEST_URL}
            target="_blank"
            rel="noreferrer"
            className="press ml-2 hidden rounded-md border border-border bg-bg-card px-3 py-1.5 text-sm font-medium text-muted-strong transition hover:border-accent/50 hover:text-white sm:inline-flex"
          >
            Suggest an app
          </a>
        </nav>
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
        "press rounded-md px-3 py-1.5 transition",
        active
          ? "bg-bg-card text-white"
          : "text-muted-strong hover:bg-bg-hover hover:text-white",
      )}
    >
      {children}
    </Link>
  );
}
