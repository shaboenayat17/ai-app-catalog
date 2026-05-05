"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { storage } from "@/lib/storage";
import { haptic } from "@/lib/haptics";
import {
  CATEGORY_META,
  PRICING_COLORS,
  type AIApp,
} from "@/lib/types";
import { AppLogo } from "./AppLogo";

const ADMIN_TOKEN_KEY = "ai-catalog:admin-pwd";

interface Props {
  initialApps: AIApp[];
  /** When set, the GitHub link group resolves to this repo. */
  githubRepo?: string;
  /** Optional — passed from the server to avoid an extra round trip on first paint. */
  siteUrl?: string;
}

type TabKey = "pending" | "approved" | "catalog" | "settings";

interface Stats {
  total: number;
  addedThisMonth: number;
  pendingCount: number;
  lastRun: string | null;
  lastRunAddedCount: number;
  nextRun: string;
}

interface Toast {
  kind: "success" | "error" | "info";
  text: string;
}

export function AdminPanel({ initialApps, githubRepo, siteUrl }: Props) {
  const [authed, setAuthed] = useState(false);
  const [bootChecked, setBootChecked] = useState(false);
  const [pwd, setPwdState] = useState<string | null>(null);

  // Boot: re-check stored password against /api/admin/login.
  useEffect(() => {
    const stored = storage.get<string | null>(ADMIN_TOKEN_KEY, null);
    if (!stored) {
      setBootChecked(true);
      return;
    }
    void verify(stored).then((ok) => {
      if (ok) {
        setPwdState(stored);
        setAuthed(true);
      }
      setBootChecked(true);
    });
  }, []);

  const onLogin = useCallback((password: string) => {
    storage.set(ADMIN_TOKEN_KEY, password);
    setPwdState(password);
    setAuthed(true);
  }, []);

  const onLogout = useCallback(() => {
    storage.remove(ADMIN_TOKEN_KEY);
    setPwdState(null);
    setAuthed(false);
  }, []);

  if (!bootChecked) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-4">
        <p className="text-sm text-muted">Loading admin…</p>
      </div>
    );
  }

  if (!authed || !pwd) {
    return <LoginScreen onLogin={onLogin} />;
  }

  return (
    <Authed
      pwd={pwd}
      onLogout={onLogout}
      initialApps={initialApps}
      githubRepo={githubRepo}
      siteUrl={siteUrl}
    />
  );
}

/* -------------------- Login -------------------- */

function LoginScreen({ onLogin }: { onLogin: (p: string) => void }) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwd.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      const data = await res.json();
      if (data.ok) {
        onLogin(pwd);
      } else {
        setError(data.error || "Incorrect password");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-border bg-bg-card p-6 shadow-lift"
      >
        <div className="mb-5 text-center">
          <span aria-hidden className="text-4xl">🔒</span>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-white">
            Admin Panel
          </h1>
          <p className="mt-1 text-xs text-muted">Enter password to continue</p>
        </div>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Password
          </span>
          <input
            type="password"
            autoFocus
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="mt-1.5 min-h-[44px] w-full rounded-md border border-border bg-bg px-3 text-sm text-white outline-none focus:border-accent/60"
          />
        </label>
        {error && (
          <p className="mt-3 rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || !pwd.trim()}
          className={clsx(
            "press mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg text-sm font-semibold transition",
            pwd.trim() && !submitting
              ? "bg-gradient-to-r from-accent to-cyan-400 text-bg shadow-glow"
              : "cursor-not-allowed bg-bg text-muted",
          )}
        >
          {submitting ? "Checking…" : "Enter"}
        </button>
        <p className="mt-3 text-center text-[10px] text-muted">
          Set <code className="text-muted-strong">ADMIN_PASSWORD</code> in your env
          to change this.
        </p>
      </form>
    </div>
  );
}

async function verify(password: string): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    return Boolean(data.ok);
  } catch {
    return false;
  }
}

/* -------------------- Authed shell -------------------- */

function Authed({
  pwd,
  onLogout,
  initialApps,
  githubRepo,
  siteUrl,
}: {
  pwd: string;
  onLogout: () => void;
  initialApps: AIApp[];
  githubRepo?: string;
  siteUrl?: string;
}) {
  const [tab, setTab] = useState<TabKey>("pending");
  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<AIApp[]>([]);
  const [apps, setApps] = useState<AIApp[]>(initialApps);
  const [toast, setToast] = useState<Toast | null>(null);
  const [loading, setLoading] = useState(true);

  const showToast = useCallback((t: Toast) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes] = await Promise.all([
        fetch("/api/admin/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pwd }),
        }),
        fetch("/api/admin/pending", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pwd }),
        }),
      ]);
      const statsData = await statsRes.json();
      const pendingData = await pendingRes.json();
      if (statsData.ok) setStats(statsData);
      if (pendingData.ok) setPending(pendingData.apps);
    } catch (err) {
      showToast({ kind: "error", text: "Failed to load admin data" });
    } finally {
      setLoading(false);
    }
  }, [pwd, showToast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const approve = useCallback(
    async (id: string) => {
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd, id }),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.app) setApps((prev) => [...prev, data.app]);
        setPending((prev) => prev.filter((p) => p.id !== id));
        haptic("success");
        showToast({
          kind: "success",
          text: data.warning ? data.warning : "Added to catalog!",
        });
      } else {
        haptic("error");
        showToast({ kind: "error", text: data.error || "Failed" });
      }
    },
    [pwd, showToast],
  );

  const reject = useCallback(
    async (id: string) => {
      const res = await fetch("/api/admin/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd, id }),
      });
      const data = await res.json();
      if (data.ok) {
        setPending((prev) => prev.filter((p) => p.id !== id));
        haptic("error");
        showToast({ kind: "info", text: "Suggestion rejected" });
      } else {
        haptic("error");
        showToast({ kind: "error", text: data.error || "Failed" });
      }
    },
    [pwd, showToast],
  );

  const remove = useCallback(
    async (id: string) => {
      const res = await fetch("/api/admin/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd, id }),
      });
      const data = await res.json();
      if (data.ok) {
        setApps((prev) => prev.filter((a) => a.id !== id));
        showToast({ kind: "success", text: "Removed from catalog" });
      } else {
        showToast({ kind: "error", text: data.error || "Failed" });
      }
    },
    [pwd, showToast],
  );

  const lastUpdated = stats?.lastRun
    ? formatDate(stats.lastRun)
    : "never";

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pb-16 lg:px-8">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            <span aria-hidden>🤖</span> AI Catalog Admin
          </h1>
          <p className="mt-1 text-xs text-muted">Last updated {lastUpdated}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="press inline-flex min-h-[40px] items-center gap-1 rounded-md border border-border bg-bg-card px-3 text-xs text-muted-strong hover:border-accent/40 hover:text-white"
          >
            View Live Site →
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="press inline-flex min-h-[40px] items-center rounded-md border border-border bg-bg-card px-3 text-xs text-muted-strong hover:border-rose-400/40 hover:text-white"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total apps" value={String(stats?.total ?? apps.length)} />
        <StatCard label="Added this month" value={String(stats?.addedThisMonth ?? 0)} accent />
        <StatCard label="Last robot run" value={stats?.lastRun ? formatDate(stats.lastRun) : "—"} />
        <StatCard label="Next scheduled run" value={stats?.nextRun ? formatDate(stats.nextRun) : "—"} />
      </div>

      {/* Tabs */}
      <nav
        role="tablist"
        className="-mx-4 flex gap-1 overflow-x-auto border-b border-border/60 px-4 pb-px sm:mx-0 sm:px-0"
      >
        <TabButton k="pending" active={tab} onClick={setTab} count={pending.length}>
          📬 Pending Review
        </TabButton>
        <TabButton k="approved" active={tab} onClick={setTab}>
          ✅ Recently Approved
        </TabButton>
        <TabButton k="catalog" active={tab} onClick={setTab}>
          📊 Catalog
        </TabButton>
        <TabButton k="settings" active={tab} onClick={setTab}>
          ⚙️ Settings
        </TabButton>
      </nav>

      <div className="mt-6">
        {tab === "pending" && (
          <PendingTab
            pending={pending}
            loading={loading}
            onApprove={approve}
            onReject={reject}
            nextRun={stats?.nextRun ?? null}
            githubRepo={githubRepo}
          />
        )}
        {tab === "approved" && <ApprovedTab apps={apps} />}
        {tab === "catalog" && (
          <CatalogTab apps={apps} onRemove={remove} />
        )}
        {tab === "settings" && (
          <SettingsTab
            stats={stats}
            githubRepo={githubRepo}
            siteUrl={siteUrl}
          />
        )}
      </div>

      {toast && (
        <div
          role="status"
          className={clsx(
            "fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border px-4 py-2 text-sm shadow-lift animate-fade-in-up md:bottom-8",
            toast.kind === "success" &&
              "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
            toast.kind === "error" &&
              "border-rose-400/40 bg-rose-500/15 text-rose-100",
            toast.kind === "info" && "border-border bg-bg-elevated text-white",
          )}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

/* -------------------- Tabs -------------------- */

function TabButton({
  k,
  active,
  onClick,
  count,
  children,
}: {
  k: TabKey;
  active: TabKey;
  onClick: (k: TabKey) => void;
  count?: number;
  children: React.ReactNode;
}) {
  const isActive = active === k;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => onClick(k)}
      className={clsx(
        "press relative inline-flex min-h-[44px] shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm font-medium transition",
        isActive
          ? "border-accent text-white"
          : "border-transparent text-muted hover:text-white",
      )}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}

function PendingTab({
  pending,
  loading,
  onApprove,
  onReject,
  nextRun,
  githubRepo,
}: {
  pending: AIApp[];
  loading: boolean;
  onApprove: (id: string) => void | Promise<void>;
  onReject: (id: string) => void | Promise<void>;
  nextRun: string | null;
  githubRepo?: string;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (loading) {
    return <p className="py-8 text-center text-sm text-muted">Loading suggestions…</p>;
  }

  if (pending.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-bg-card/40 p-8 text-center">
        <p className="text-2xl" aria-hidden>✨</p>
        <p className="mt-2 text-base font-semibold text-white">All caught up!</p>
        <p className="mt-1 text-sm text-muted-strong">
          No apps waiting for review. The robot will suggest new apps on{" "}
          <span className="text-white">{nextRun ? formatDate(nextRun) : "the next run"}</span>.
        </p>
        {githubRepo && (
          <a
            href={`https://github.com/${githubRepo}/actions/workflows/update-catalog.yml`}
            target="_blank"
            rel="noreferrer"
            className="press mt-4 inline-flex min-h-[40px] items-center gap-1 rounded-md bg-accent/15 px-3 text-xs font-medium text-accent hover:bg-accent/25"
          >
            🤖 Run robot now ↗
          </a>
        )}
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {pending.map((app) => {
        const m = CATEGORY_META[app.category];
        const isConfirming = confirmId === app.id;
        const isBusy = busyId === app.id;
        return (
          <li
            key={app.id}
            className="rounded-2xl border border-border bg-bg-card p-4 sm:p-5"
          >
            <div className="flex items-start gap-3">
              <AppLogo logoUrl={app.logoUrl} appName={app.name} category={app.category} size="md" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold text-white">
                  {app.name}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className={clsx("inline-flex rounded-md border px-1.5 py-0.5 text-[10px]", m.badge)}>
                    {app.category}
                  </span>
                  <span
                    className={clsx(
                      "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                      PRICING_COLORS[app.pricing],
                    )}
                  >
                    {app.pricing}
                  </span>
                  <span className="text-[10px] text-muted">
                    Suggested {app.addedDate}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-muted-strong">
              {app.description}
            </p>

            <a
              href={app.url}
              target="_blank"
              rel="noreferrer"
              className="press mt-2 inline-flex min-h-[36px] items-center gap-1 text-xs text-accent hover:text-accent-hover"
            >
              {app.url} ↗
            </a>

            {(app.pros?.length || app.cons?.length) ? (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200">
                    ✅ Pros
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {(app.pros ?? []).slice(0, 3).map((p, i) => (
                      <li key={i} className="flex gap-1.5 text-xs text-emerald-100/90">
                        <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-200">
                    ❌ Cons
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {(app.cons ?? []).slice(0, 3).map((p, i) => (
                      <li key={i} className="flex gap-1.5 text-xs text-rose-100/90">
                        <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={async () => {
                  setBusyId(app.id);
                  await onApprove(app.id);
                  setBusyId(null);
                }}
                disabled={isBusy}
                className="press flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-500/20 px-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30 disabled:opacity-50"
              >
                ✅ Approve &amp; add to catalog
              </button>
              {isConfirming ? (
                <div className="flex flex-1 gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setBusyId(app.id);
                      await onReject(app.id);
                      setConfirmId(null);
                      setBusyId(null);
                    }}
                    disabled={isBusy}
                    className="press flex min-h-[44px] flex-1 items-center justify-center rounded-md bg-rose-500/30 px-3 text-sm font-semibold text-rose-100 disabled:opacity-50"
                  >
                    Confirm reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    className="press min-h-[44px] rounded-md border border-border bg-bg-card px-3 text-sm text-muted-strong"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(app.id)}
                  className="press flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-md border border-rose-400/40 bg-rose-500/10 px-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
                >
                  ❌ Reject
                </button>
              )}
            </div>
            {isConfirming && (
              <p className="mt-2 text-[11px] text-rose-200">
                Are you sure? This will permanently remove this suggestion.
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ApprovedTab({ apps }: { apps: AIApp[] }) {
  const recent = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return [...apps]
      .filter((a) => {
        const d = new Date(`${a.addedDate}T00:00:00Z`).getTime();
        return Number.isFinite(d) && d >= cutoff;
      })
      .sort((a, b) => b.addedDate.localeCompare(a.addedDate))
      .slice(0, 10);
  }, [apps]);

  if (recent.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-bg-card/40 p-8 text-center">
        <p className="text-base font-semibold text-white">No approvals in the last 30 days.</p>
        <p className="mt-1 text-sm text-muted-strong">
          When you approve robot suggestions they'll show up here.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {recent.map((app) => {
        return (
          <li key={app.id}>
            <Link
              href={`/app/${app.id}`}
              className="press flex min-h-[60px] items-center gap-3 rounded-xl border border-border bg-bg-card p-3 text-sm text-white transition active:bg-bg-hover hover:border-accent/40"
            >
              <AppLogo logoUrl={app.logoUrl} appName={app.name} category={app.category} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{app.name}</span>
                <span className="block truncate text-[11px] text-muted">
                  {app.category} · approved {app.addedDate}
                </span>
              </span>
              <span aria-hidden className="text-muted">→</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function CatalogTab({
  apps,
  onRemove,
}: {
  apps: AIApp[];
  onRemove: (id: string) => void | Promise<void>;
}) {
  const [q, setQ] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = needle
      ? apps.filter((a) => a.name.toLowerCase().includes(needle))
      : apps;
    return [...out].sort((a, b) => a.name.localeCompare(b.name));
  }, [apps, q]);

  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search apps by name…"
        className="mb-3 min-h-[44px] w-full rounded-md border border-border bg-bg px-3 text-sm text-white placeholder:text-muted outline-none focus:border-accent/60"
      />
      <p className="mb-3 text-[11px] text-muted">
        {filtered.length} of {apps.length} apps
      </p>
      <div className="overflow-x-auto rounded-xl border border-border bg-bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border bg-bg/40">
            <tr>
              <Th>Name</Th>
              <Th>Category</Th>
              <Th>Pricing</Th>
              <Th>Added</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.map((app) => (
              <tr key={app.id}>
                <td className="px-3 py-2">
                  <Link
                    href={`/app/${app.id}`}
                    className="text-white hover:text-accent"
                  >
                    {app.name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-xs text-muted-strong">
                  {app.category}
                </td>
                <td className="px-3 py-2 text-xs text-muted-strong">
                  {app.pricing}
                </td>
                <td className="px-3 py-2 text-xs text-muted">{app.addedDate}</td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled
                      title="Coming soon"
                      className="cursor-not-allowed rounded-md border border-border bg-bg px-2 py-1 text-[11px] text-muted opacity-50"
                    >
                      Edit
                    </button>
                    {confirmId === app.id ? (
                      <span className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={async () => {
                            await onRemove(app.id);
                            setConfirmId(null);
                          }}
                          className="press rounded-md bg-rose-500/30 px-2 py-1 text-[11px] font-semibold text-rose-100"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="press rounded-md border border-border bg-bg px-2 py-1 text-[11px] text-muted"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(app.id)}
                        className="press rounded-md border border-rose-400/40 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-200 hover:bg-rose-500/20"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsTab({
  stats,
  githubRepo,
  siteUrl,
}: {
  stats: Stats | null;
  githubRepo?: string;
  siteUrl?: string;
}) {
  const ghBase = githubRepo ? `https://github.com/${githubRepo}` : null;
  return (
    <div className="space-y-6">
      <SettingsCard title="🤖 Robot settings">
        <Row label="Schedule">
          <span className="text-white">Every 2 days at 09:00 UTC</span>
        </Row>
        <Row label="Next run">
          <span className="text-white">{stats?.nextRun ? formatDate(stats.nextRun) : "—"}</span>
        </Row>
        <Row label="Last run">
          <span className="text-white">
            {stats?.lastRun ? formatDate(stats.lastRun) : "never"}
            {stats && stats.lastRunAddedCount > 0 && (
              <span className="ml-2 text-xs text-muted">
                added {stats.lastRunAddedCount} app
                {stats.lastRunAddedCount === 1 ? "" : "s"}
              </span>
            )}
          </span>
        </Row>
        {ghBase && (
          <a
            href={`${ghBase}/actions/workflows/update-catalog.yml`}
            target="_blank"
            rel="noreferrer"
            className="press mt-2 inline-flex min-h-[40px] items-center gap-1 rounded-md bg-accent/15 px-3 text-xs font-medium text-accent hover:bg-accent/25"
          >
            🤖 Run robot now ↗
          </a>
        )}
      </SettingsCard>

      <SettingsCard title="🔑 Admin settings">
        <Row label="Site URL">
          <span className="break-all text-white">{siteUrl ?? "—"}</span>
        </Row>
        <Row label="Password">
          <span className="text-muted-strong">
            Set the <code>ADMIN_PASSWORD</code> environment variable in Vercel
            (Settings → Environment Variables) and redeploy. Falls back to{" "}
            <code>admin123</code> in local dev.
          </span>
        </Row>
      </SettingsCard>

      {ghBase && (
        <SettingsCard title="🐙 GitHub">
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href={`${ghBase}/pulls`}
                target="_blank"
                rel="noreferrer"
                className="press inline-flex min-h-[40px] items-center text-accent hover:text-accent-hover"
              >
                View Pull Requests on GitHub →
              </a>
            </li>
            <li>
              <a
                href={`${ghBase}/actions`}
                target="_blank"
                rel="noreferrer"
                className="press inline-flex min-h-[40px] items-center text-accent hover:text-accent-hover"
              >
                View Actions on GitHub →
              </a>
            </li>
            <li>
              <a
                href={ghBase}
                target="_blank"
                rel="noreferrer"
                className="press inline-flex min-h-[40px] items-center text-accent hover:text-accent-hover"
              >
                View Repository on GitHub →
              </a>
            </li>
          </ul>
        </SettingsCard>
      )}
    </div>
  );
}

/* -------------------- Tiny UI helpers -------------------- */

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border p-3",
        accent
          ? "border-accent/40 bg-accent/10"
          : "border-border bg-bg-card",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold leading-tight text-white sm:text-lg">
        {value}
      </p>
    </div>
  );
}

function SettingsCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-bg-card p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-white sm:text-base">{title}</h3>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[140px_1fr] sm:gap-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={clsx(
        "px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted",
        className,
      )}
    >
      {children}
    </th>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}
