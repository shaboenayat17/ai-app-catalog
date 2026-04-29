// Wraps localStorage so it can be swapped for AsyncStorage on React Native.
// All access goes through these helpers; never touch window.localStorage directly.

const isClient = typeof window !== "undefined";

export const storage = {
  get<T>(key: string, fallback: T): T {
    if (!isClient) return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    if (!isClient) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota exceeded — silently ignore for now */
    }
  },

  remove(key: string): void {
    if (!isClient) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

// Centralized keys so we never typo across the app
export const STORAGE_KEYS = {
  reviews: "ai-catalog:reviews",
  recentlyViewed: "ai-catalog:recently-viewed",
  savedStacks: "ai-catalog:saved-stacks",
  notifyEmail: "ai-catalog:notify-email",
  reviewHelpful: "ai-catalog:review-helpful",
  persona: "ai-catalog:persona",
} as const;
