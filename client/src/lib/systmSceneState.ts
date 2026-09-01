import type { ClubListener, ClubSpeaker } from "@/hooks/useClubAudio";
import { MODE_ONBOARDING_STEPS, type SystmMode } from "@/lib/systmModes";
import type { SpeakerFamily } from "@/lib/speakerModels";

export type SceneView = "top" | "side" | "pov";
export type ModeOnboardingStep = (typeof MODE_ONBOARDING_STEPS)[SystmMode][number];

export type SystmSceneState = {
  speakers: ClubSpeaker[];
  listener: ClubListener;
  selectedSpeakerId: string;
  view: SceneView;
  speakerFamily: SpeakerFamily;
  recipeId: string | null;
  modeOnboardingStep: ModeOnboardingStep | null;
};

export type SystmSceneStateMap = Record<SystmMode, SystmSceneState>;

export function createInitialSceneState(mode: SystmMode, listenerName = "Listener"): SystmSceneState {
  return {
    speakers: [],
    listener: { name: listenerName, position: { x: .5, y: .72, z: .5 }, orientation: { yaw: 0, pitch: 0 } },
    selectedSpeakerId: "",
    view: "top",
    speakerFamily: "modern",
    recipeId: null,
    modeOnboardingStep: mode === "club" ? "CHOOSE A LAYOUT" : "ADD A CABINET",
  };
}

export function createInitialSceneStateMap(listenerName = "Listener"): SystmSceneStateMap {
  return { club: createInitialSceneState("club", listenerName), "sound-system": createInitialSceneState("sound-system", listenerName) };
}
