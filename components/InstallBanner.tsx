"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { storage } from "@/lib/storage";

const VISIT_KEY = "ai-catalog:visit_count";
const DISMISSED_KEY = "ai-catalog:install_dismissed";
const SHOW_AFTER_VISITS = 2;
const SHOW_DELAY_MS = 3000;

// Minimal type for the BeforeInstallPromptEvent we listen for on Android.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type Platform = "android" | "ios" | "other";

export function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const [iosOpen, setIosOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const promptEvent = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already installed → never show.
    const installed = window.matchMedia("(display-mode: standalone)").matches;
    if (installed) return;

    // Already dismissed → never show.
    if (storage.get<boolean>(DISMISSED_KEY, false)) return;

    // Increment visit count.
    const count = storage.get<number>(VISIT_KEY, 0) + 1;
    storage.set(VISIT_KEY, count);
    if (count < SHOW_AFTER_VISITS) return;

    // Detect iOS up front (no beforeinstallprompt there).
    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    setPlatform(isIos ? "ios" : isAndroid ? "android" : "other");

    // Capture the Android install prompt when the browser fires it.
    const onPrompt = (e: Event) => {
      e.preventDefault();
      promptEvent.current = e as BeforeInstallPromptEvent;
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // Once installed via the browser UI, hide.
    const onInstalled = () => setVisible(false);
    window.addEventListener("appinstalled", onInstalled);

    // Slide up after the delay so it doesn't feel intrusive on landing.
    const t = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    storage.set(DISMISSED_KEY, true);
    setVisible(false);
  };

  const install = async () => {
    if (platform === "ios") {
      setIosOpen(true);
      return;
    }
    const ev = promptEvent.current;
    if (!ev) {
      // No install event yet — likely not supported in this browser.
      setToast("Your browser doesn't support one-tap install.");
      window.setTimeout(() => setToast(null), 2200);
      return;
    }
    await ev.prompt();
    const choice = await ev.userChoice;
    if (choice.outcome === "accepted") {
      setToast("Installed! Look for the icon on your home screen.");
      window.setTimeout(() => setToast(null), 2200);
      setVisible(false);
    } else {
      dismiss();
    }
  };

  if (!visible && !iosOpen && !toast) return null;

  return (
    <>
      {visible && (
        <div
          role="dialog"
          aria-label="Install AI Catalog"
          className={clsx(
            "fixed inset-x-0 bottom-0 z-[9999] border-t border-border/80 bg-bg-elevated/95 px-4 py-3 backdrop-blur-md transition-transform duration-300 ease-out",
            "translate-y-0 animate-slide-up",
          )}
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
        >
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            {/* Icon */}
            <span
              aria-hidden
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent to-cyan-400 text-base font-bold text-bg shadow-glow"
            >
              AI
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">
                Add AI Catalog to Home Screen
              </p>
              <p className="text-xs text-muted">
                Access 100+ AI apps instantly, even offline.
              </p>
            </div>
            <button
              type="button"
              onClick={install}
              className="press inline-flex min-h-[44px] shrink-0 items-center rounded-lg bg-gradient-to-r from-accent to-cyan-400 px-3 text-xs font-semibold text-bg shadow-glow"
            >
              {platform === "ios" ? "How to install" : "Install app"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
              className="press min-h-[44px] min-w-[44px] shrink-0 rounded-md text-muted transition hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* iOS step-by-step sheet */}
      {iosOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          onClick={() => setIosOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-t-2xl border border-border bg-bg-elevated p-5 sm:rounded-2xl"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}
          >
            <div className="mb-3 flex items-start justify-between">
              <h2 className="text-base font-semibold text-white">
                Install on iOS
              </h2>
              <button
                type="button"
                onClick={() => setIosOpen(false)}
                aria-label="Close"
                className="press min-h-[44px] min-w-[44px] -mr-2 -mt-2 rounded-md text-muted hover:text-white"
              >
                ×
              </button>
            </div>
            <ol className="space-y-3">
              <Step
                num={1}
                icon={<ShareIcon />}
                text={
                  <>
                    Tap the <strong className="text-white">Share</strong> button
                    in Safari's toolbar.
                  </>
                }
              />
              <Step
                num={2}
                icon={<AddIcon />}
                text={
                  <>
                    Scroll and tap{" "}
                    <strong className="text-white">Add to Home Screen</strong>.
                  </>
                }
              />
              <Step
                num={3}
                icon={<CheckIcon />}
                text={
                  <>
                    Tap <strong className="text-white">Add</strong> in the top
                    right corner.
                  </>
                }
              />
            </ol>
            <button
              type="button"
              onClick={() => {
                setIosOpen(false);
                dismiss();
              }}
              className="press mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-bg-card px-3 text-xs font-medium text-muted-strong hover:text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[10001] -translate-x-1/2 rounded-full border border-border bg-bg-elevated px-4 py-2 text-sm text-white shadow-lift animate-fade-in-up"
        >
          {toast}
        </div>
      )}
    </>
  );
}

function Step({
  num,
  icon,
  text,
}: {
  num: number;
  icon: React.ReactNode;
  text: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-border bg-bg-card p-3">
      <span
        aria-hidden
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent/20 text-xs font-bold text-accent"
      >
        {num}
      </span>
      <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-bg/80 text-muted">
        {icon}
      </span>
      <p className="pt-1 text-sm text-muted-strong">{text}</p>
    </li>
  );
}

function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function AddIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M5 12l5 5 9-11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
