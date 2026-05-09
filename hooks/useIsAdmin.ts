"use client";

import { useEffect, useState } from "react";

const KEY = "admin_authenticated";

/**
 * Returns true if the visitor has logged into the admin panel on this device.
 * Reads localStorage on mount; updates when the AdminPanel dispatches an
 * "admin-auth-change" event so the stats bar (or any caller) reacts to
 * login/logout instantly.
 */
export function useIsAdmin(): boolean {
  // Always false on the server / initial render to avoid hydration mismatch.
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        setIsAdmin(window.localStorage.getItem(KEY) === "true");
      } catch {
        setIsAdmin(false);
      }
    };
    read();
    const onAuthChange = () => read();
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) read();
    };
    window.addEventListener("admin-auth-change", onAuthChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("admin-auth-change", onAuthChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return isAdmin;
}

/** Sets or clears the public-facing admin flag and notifies subscribers. */
export function setAdminAuthenticated(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(KEY, "true");
    else window.localStorage.removeItem(KEY);
  } catch {
    /* quota or private mode — ignore */
  }
  window.dispatchEvent(new CustomEvent("admin-auth-change"));
}
