import type { ClubListener, ClubSpeaker } from "@/hooks/useClubAudio";
import type { SystmMode } from "@/lib/systmModes";
import {
  firstProductOnboardingStep,
  type ProductOnboardingStep,
} from "@/lib/productOnboarding";
import type { SpeakerFamily } from "@/lib/speakerModels";

export type SceneView = "top" | "side" | "pov";
export type SystmSceneState = {
  speakers: ClubSpeaker[];
  listener: ClubListener;
  selectedSpeakerId: string;
  view: SceneView;
  speakerFamily: SpeakerFamily;
  recipeId: string | null;
  modeOnboardingStep: ProductOnboardingStep | null;
};

export type SystmSceneStateMap = Record<SystmMode, SystmSceneState>;

export function createInitialSceneState(
  mode: SystmMode,
  listenerName = "Listener"
): SystmSceneState {
  return {
    speakers: [],
    listener: {
      name: listenerName,
      position: { x: 0.5, y: 0.72, z: 0.5 },
      orientation: { yaw: 0, pitch: 0 },
    },
    selectedSpeakerId: "",
    view: "top",
    speakerFamily: "modern",
    recipeId: null,
    modeOnboardingStep: firstProductOnboardingStep(mode),
  };
}

export function createInitialSceneStateMap(
  listenerName = "Listener"
): SystmSceneStateMap {
  return {
    club: createInitialSceneState("club", listenerName),
    "sound-system": createInitialSceneState("sound-system", listenerName),
  };
}
