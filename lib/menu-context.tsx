"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface MenuCtx {
  open: boolean;
  setOpen: (next: boolean) => void;
  toggle: () => void;
}

const Ctx = createContext<MenuCtx | null>(null);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpenState] = useState(false);

  const setOpen = useCallback((next: boolean) => setOpenState(next), []);
  const toggle = useCallback(() => setOpenState((v) => !v), []);

  // Lock body scroll while the menu is up.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : prev || "";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <Ctx.Provider value={{ open, setOpen, toggle }}>{children}</Ctx.Provider>
  );
}

export function useMenu(): MenuCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMenu must be used within MenuProvider");
  return ctx;
}
