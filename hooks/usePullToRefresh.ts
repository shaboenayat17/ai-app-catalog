"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import { haptic } from "@/lib/haptics";

const TRIGGER_PX = 80;
const MAX_PX = 140;
const COOLDOWN_MS = 30_000;

interface Options {
  /** Called when the user pulls past the threshold and releases. */
  onRefresh: () => Promise<void> | void;
  /** Set to false to disable globally (e.g. on desktop). */
  enabled?: boolean;
}

interface State {
  pulling: boolean;
  distance: number;
  refreshing: boolean;
}

/**
 * Native-feeling pull-to-refresh that only activates at scrollTop === 0.
 * Cooldown via localStorage so back-to-back pulls don't hammer.
 */
export function usePullToRefresh({ onRefresh, enabled = true }: Options): State {
  const [pulling, setPulling] = useState(false);
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const triggered = useRef(false);

  const triggerRefresh = useCallback(async () => {
    const last = storage.get<number>(STORAGE_KEYS.lastRefresh, 0);
    if (Date.now() - last < COOLDOWN_MS) return;
    storage.set(STORAGE_KEYS.lastRefresh, Date.now());
    setRefreshing(true);
    haptic("medium");
    try {
      await onRefresh();
    } finally {
      window.setTimeout(() => setRefreshing(false), 600);
    }
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      triggered.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) return;
      if (window.scrollY > 0) {
        startY.current = null;
        setPulling(false);
        setDistance(0);
        return;
      }
      // Damp the pull so it feels resistant near the cap.
      const damped = Math.min(MAX_PX, dy * 0.5);
      setPulling(true);
      setDistance(damped);
      // Light haptic the moment we cross the threshold.
      if (damped >= TRIGGER_PX && !triggered.current) {
        triggered.current = true;
        haptic("light");
      }
      if (damped > 10 && e.cancelable) e.preventDefault();
    };

    const onTouchEnd = () => {
      if (startY.current === null) return;
      const shouldRefresh = distance >= TRIGGER_PX;
      startY.current = null;
      setPulling(false);
      setDistance(0);
      triggered.current = false;
      if (shouldRefresh) void triggerRefresh();
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [enabled, distance, triggerRefresh]);

  return { pulling, distance, refreshing };
}
