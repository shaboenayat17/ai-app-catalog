"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
};

export function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "/") {
        if (isTypingTarget(e.target)) return;
        e.preventDefault();
        const el = document.getElementById("hero-search") as HTMLInputElement | null;
        if (el) {
          el.focus();
          el.select();
        } else {
          router.push("/");
          // dispatch focus event after navigation completes
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("ai-catalog:focus-search"));
          }, 60);
        }
        return;
      }

      if (isTypingTarget(e.target)) return;

      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        router.push("/compare");
      } else if (e.key === "w" || e.key === "W") {
        e.preventDefault();
        router.push("/workflow");
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        router.push("/news");
      } else if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        router.push("/");
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return null;
}
