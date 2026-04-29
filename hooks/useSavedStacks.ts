"use client";

import { useCallback, useEffect, useState } from "react";
import { storage, STORAGE_KEYS } from "@/lib/storage";

export interface SavedStack {
  id: string;
  title: string;
  appIds: string[];
  useCaseId: string | null;
  minMode: boolean;
  savedAt: string;
}

export function useSavedStacks() {
  const [stacks, setStacks] = useState<SavedStack[]>([]);

  useEffect(() => {
    setStacks(storage.get<SavedStack[]>(STORAGE_KEYS.savedStacks, []));
  }, []);

  const save = useCallback((stack: Omit<SavedStack, "id" | "savedAt">) => {
    const next: SavedStack = {
      ...stack,
      id: `stack-${Date.now()}`,
      savedAt: new Date().toISOString(),
    };
    setStacks((prev) => {
      const out = [next, ...prev].slice(0, 30);
      storage.set(STORAGE_KEYS.savedStacks, out);
      return out;
    });
    return next;
  }, []);

  const remove = useCallback((id: string) => {
    setStacks((prev) => {
      const out = prev.filter((s) => s.id !== id);
      storage.set(STORAGE_KEYS.savedStacks, out);
      return out;
    });
  }, []);

  return { stacks, save, remove };
}
