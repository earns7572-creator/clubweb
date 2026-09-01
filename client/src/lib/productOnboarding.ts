import type { SystmMode } from "@/lib/systmModes";

export const PRODUCT_ONBOARDING_STEPS = {
  club: [
    "club-layout",
    "club-build",
    "club-listener",
    "club-aim",
    "club-play",
    "club-field",
    "club-pov",
    "club-move",
    "club-listen",
  ],
  "sound-system": [
    "sound-recipe",
    "sound-pick",
    "sound-low",
    "sound-snap",
    "sound-stack",
    "sound-build",
    "sound-aim",
    "sound-play",
    "sound-field",
    "sound-listener",
    "sound-listen",
  ],
} as const;

export type ProductOnboardingStep =
  (typeof PRODUCT_ONBOARDING_STEPS)[SystmMode][number];

export type ProductOnboardingEvent =
  | "layout-selected"
  | "listener-moved"
  | "speaker-rotated"
  | "playback-started"
  | "view-pov"
  | "listener-looked"
  | "recipe-selected"
  | "cabinet-added"
  | "cabinet-moved"
  | "cabinet-stacked";

export const PRODUCT_ONBOARDING_COPY: Record<
  ProductOnboardingStep,
  { verb: string; hint: string }
> = {
  "club-layout": { verb: "CHOOSE A LAYOUT", hint: "START WITH THE SPACE" },
  "club-build": {
    verb: "BUILD THE SPACE",
    hint: "THE ROOM IS YOUR INSTRUMENT",
  },
  "club-listener": {
    verb: "MOVE THE LISTENER",
    hint: "DRAG THE LISTENING POINT",
  },
  "club-aim": { verb: "AIM THE FIELD", hint: "SELECT A SPEAKER · DRAG TURN" },
  "club-play": { verb: "PLAY SOUND", hint: "START THE SIGNAL" },
  "club-field": { verb: "SEE THE FIELD", hint: "RGB SHOWS LIVE ENERGY" },
  "club-pov": { verb: "ENTER POV", hint: "LISTEN FROM THE FLOOR" },
  "club-move": { verb: "MOVE THROUGH SPACE", hint: "DRAG TO LOOK AROUND" },
  "club-listen": { verb: "LISTEN", hint: "THE SPACE IS LIVE" },
  "sound-recipe": { verb: "CHOOSE A RECIPE", hint: "A GUIDE · NOT A LIMIT" },
  "sound-pick": { verb: "PICK A CABINET", hint: "ADD ONE FROM THE LIBRARY" },
  "sound-low": { verb: "BUILD LOW END", hint: "ADD ANOTHER LOW CABINET" },
  "sound-snap": { verb: "SIDE SNAP", hint: "DRAG IT BESIDE THE FIRST" },
  "sound-stack": { verb: "STACK THE KICK", hint: "DRAG A CABINET ON TOP" },
  "sound-build": { verb: "ADD MID / HIGH", hint: "KEEP BUILDING THE STACK" },
  "sound-aim": { verb: "AIM THE STACK", hint: "SELECT A CABINET · DRAG TURN" },
  "sound-play": { verb: "PLAY SOUND", hint: "START THE SIGNAL" },
  "sound-field": { verb: "SEE THE BANDS", hint: "RGB SHOWS LIVE ENERGY" },
  "sound-listener": {
    verb: "MOVE THE LISTENER",
    hint: "DRAG THE LISTENING POINT",
  },
  "sound-listen": { verb: "LISTEN", hint: "THE STACK IS LIVE" },
};

export const firstProductOnboardingStep = (mode: SystmMode) =>
  PRODUCT_ONBOARDING_STEPS[mode][0];

export function productOnboardingIndex(
  mode: SystmMode,
  step: ProductOnboardingStep
) {
  return PRODUCT_ONBOARDING_STEPS[mode].indexOf(step as never);
}

export function advanceProductOnboarding(
  mode: SystmMode,
  step: ProductOnboardingStep | null,
  event: ProductOnboardingEvent
): ProductOnboardingStep | null {
  if (!step) return null;
  const transitions: Partial<
    Record<
      ProductOnboardingStep,
      Partial<Record<ProductOnboardingEvent, ProductOnboardingStep>>
    >
  > = {
    "club-layout": { "layout-selected": "club-build" },
    "club-listener": { "listener-moved": "club-aim" },
    "club-aim": { "speaker-rotated": "club-play" },
    "club-play": { "playback-started": "club-field" },
    "club-pov": { "view-pov": "club-move" },
    "club-move": { "listener-looked": "club-listen" },
    "sound-recipe": { "recipe-selected": "sound-pick" },
    "sound-pick": { "cabinet-added": "sound-low" },
    "sound-low": { "cabinet-added": "sound-snap" },
    "sound-snap": { "cabinet-moved": "sound-stack" },
    "sound-stack": { "cabinet-stacked": "sound-build" },
    "sound-build": { "cabinet-added": "sound-aim" },
    "sound-aim": { "speaker-rotated": "sound-play" },
    "sound-play": { "playback-started": "sound-field" },
    "sound-listener": { "listener-moved": "sound-listen" },
  };
  return transitions[step]?.[event] ?? step;
}

export function autoAdvanceProductOnboarding(
  step: ProductOnboardingStep
): ProductOnboardingStep | null | undefined {
  if (step === "club-build") return "club-listener";
  if (step === "club-field") return "club-pov";
  if (step === "club-listen") return null;
  if (step === "sound-field") return "sound-listener";
  if (step === "sound-listen") return null;
  return undefined;
}

export function demoModeFromSearch(search: string): SystmMode | null {
  const demo = new URLSearchParams(search).get("demo");
  if (demo === "club") return "club";
  if (demo === "sound-system") return "sound-system";
  return null;
}
