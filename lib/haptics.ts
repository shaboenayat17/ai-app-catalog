// Tiny wrapper around the Vibration API. Silently no-ops on unsupported browsers
// (notably iOS Safari, which still ignores navigator.vibrate as of 2026).

export type HapticType = "light" | "medium" | "success" | "error";

const PATTERNS: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 20,
  success: [10, 50, 10],
  error: [50, 30, 50],
};

export function haptic(type: HapticType): void {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(PATTERNS[type]);
  } catch {
    // some browsers throw on background tabs; ignore
  }
}
