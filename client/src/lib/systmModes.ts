export type SystmMode = "club" | "sound-system";

export const SYSTM_MODE_STORAGE_KEY = "systm-mode";

export const SYSTM_MODE_LABELS: Record<
  SystmMode,
  { label: string; descriptor: string }
> = {
  club: { label: "CLUB", descriptor: "BUILD THE SPACE" },
  "sound-system": { label: "SOUND SYSTEM", descriptor: "BUILD THE STACK" },
};

export function parseSystmMode(
  value: string | null | undefined
): SystmMode | null {
  return value === "club" || value === "sound-system" ? value : null;
}

export function loadSystmMode(): SystmMode | null {
  if (typeof window === "undefined") return null;
  return parseSystmMode(window.localStorage.getItem(SYSTM_MODE_STORAGE_KEY));
}

export function persistSystmMode(mode: SystmMode): void {
  if (typeof window !== "undefined")
    window.localStorage.setItem(SYSTM_MODE_STORAGE_KEY, mode);
}
