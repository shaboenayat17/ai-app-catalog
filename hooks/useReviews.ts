"use client";

import { useCallback, useEffect, useState } from "react";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import type { Review } from "@/lib/types";

type LocalReviewMap = Record<string, Review[]>;

export function useReviews(appId: string, seedReviews: Review[]) {
  const [local, setLocal] = useState<Review[]>([]);

  useEffect(() => {
    const all = storage.get<LocalReviewMap>(STORAGE_KEYS.reviews, {});
    setLocal(all[appId] ?? []);
  }, [appId]);

  const addReview = useCallback(
    (r: Review) => {
      const all = storage.get<LocalReviewMap>(STORAGE_KEYS.reviews, {});
      const next = [r, ...(all[appId] ?? [])];
      all[appId] = next;
      storage.set(STORAGE_KEYS.reviews, all);
      setLocal(next);
    },
    [appId],
  );

  const allReviews: Review[] = [...local, ...seedReviews];

  return { localReviews: local, allReviews, addReview };
}
