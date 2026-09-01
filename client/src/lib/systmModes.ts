export type SystmMode = "club" | "sound-system";

export const SYSTM_MODE_STORAGE_KEY = "systm-mode";

export const SYSTM_MODE_LABELS: Record<SystmMode, { label: string; descriptor: string }> = {
  club: { label: "CLUB", descriptor: "SPATIAL SOUND" },
  "sound-system": { label: "SOUND SYSTEM", descriptor: "CABINET BUILD" },
};

export const MODE_ONBOARDING_STEPS = {
  club: ["CHOOSE A LAYOUT", "MOVE THE LISTENER", "LISTEN IN SPACE"],
  "sound-system": ["ADD A CABINET", "STACK IT", "AIM IT", "LISTEN"],
} as const satisfies Record<SystmMode, readonly string[]>;

export function parseSystmMode(value: string | null | undefined): SystmMode | null {
  return value === "club" || value === "sound-system" ? value : null;
}

export function loadSystmMode(): SystmMode | null {
  if (typeof window === "undefined") return null;
  return parseSystmMode(window.localStorage.getItem(SYSTM_MODE_STORAGE_KEY));
}

export function persistSystmMode(mode: SystmMode): void {
  if (typeof window !== "undefined") window.localStorage.setItem(SYSTM_MODE_STORAGE_KEY, mode);
}
