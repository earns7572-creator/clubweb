/* SYSTM recipe rule: a recipe is an architecture and palette guide, never a BOM. */
import type { ClubSpeaker } from "@/hooks/useClubAudio";
import { resolveModelId, type SpeakerModelId } from "@/lib/speakerModels";

export type SystemRecipeSection = {
  band: string;
  role: string;
  recommendedModelIds: SpeakerModelId[];
};
export type SystemRecipe = {
  id: string;
  name: string;
  description?: string;
  sections: SystemRecipeSection[];
  tags?: string[];
  suggestedLayout?: { towers?: number; notes?: string };
};

// Kept only as a compatibility adapter for older imported recipe data. The new
// UI never reads counts or progress and the built-in recipes do not contain it.
export type LegacySystemRecipe = {
  id: string;
  name: string;
  ingredients: Array<{ modelId: SpeakerModelId; quantity: number }>;
};
export type RecipeProgressItem = {
  modelId: SpeakerModelId;
  required: number;
  placed: number;
  complete: boolean;
};
export type RecipeProgress = {
  recipeId: string;
  ingredients: RecipeProgressItem[];
  complete: boolean;
};

export const SYSTEM_RECIPES: SystemRecipe[] = [
  {
    id: "reggae-sound-system",
    name: "Reggae Sound System",
    description: "Low-frequency-heavy cabinet system built from dedicated bass, kick, mid and top sections.",
    sections: [
      { band: "LOW", role: "SCOOP / BASS BIN", recommendedModelIds: ["reggae-scoop"] },
      { band: "LOW MID", role: "KICK BIN", recommendedModelIds: ["reggae-kick"] },
      { band: "MID", role: "MID HORN", recommendedModelIds: ["reggae-mid-horn"] },
      { band: "HIGH", role: "TOP / TWEETER", recommendedModelIds: ["reggae-top"] },
    ],
    tags: ["reggae", "multi-way", "wall"],
    suggestedLayout: { towers: 2, notes: "Build two vertical columns; placement remains user-defined." },
  },
  {
    id: "steppers-stack",
    name: "Steppers Stereo Stack",
    description: "A compact dub-oriented material set with dedicated bass, kick, mid and top sections.",
    sections: [
      { band: "LOW", role: "REFLEX BASS", recommendedModelIds: ["steppers-reflex-sub"] },
      { band: "LOW MID", role: "KICK", recommendedModelIds: ["steppers-kick"] },
      { band: "MID", role: "MID TOP", recommendedModelIds: ["steppers-mid"] },
      { band: "HIGH", role: "HF TOP", recommendedModelIds: ["steppers-top"] },
    ],
    tags: ["steppers", "dub", "single-tower"],
    suggestedLayout: { towers: 1, notes: "Use vertical stacking as a starting point; arrangement remains user-defined." },
  },
  {
    id: "freeparty-wall",
    name: "Free Party Stack",
    description: "A three-column free-party material set with W-bin, kick, mid and high cabinets.",
    sections: [
      { band: "LOW", role: "W-BIN BASS", recommendedModelIds: ["freeparty-wbin"] },
      { band: "LOW MID", role: "KICK HORN", recommendedModelIds: ["freeparty-kick-horn"] },
      { band: "MID", role: "MID HORN", recommendedModelIds: ["freeparty-mid-horn"] },
      { band: "HIGH", role: "HF HORN", recommendedModelIds: ["freeparty-top"] },
    ],
    tags: ["freeparty", "multi-way", "stack"],
    suggestedLayout: { towers: 3, notes: "Build columns manually; placement and stack relationships remain user-defined." },
  },
];

export function getRecipeProgress(recipe: LegacySystemRecipe, speakers: ReadonlyArray<Pick<ClubSpeaker, "modelId"> & Partial<Pick<ClubSpeaker, "kind">>>): RecipeProgress {
  const placedByModel = new Map<SpeakerModelId, number>();
  speakers.forEach((speaker) => { const modelId = speaker.modelId ?? (speaker.kind ? resolveModelId(undefined, speaker.kind) : undefined); if (!modelId) return; placedByModel.set(modelId, (placedByModel.get(modelId) ?? 0) + 1); });
  const ingredients = recipe.ingredients.map((ingredient) => {
    const placed = Math.min(placedByModel.get(ingredient.modelId) ?? 0, ingredient.quantity);
    return { ...ingredient, required: ingredient.quantity, placed, complete: placed >= ingredient.quantity };
  });
  return { recipeId: recipe.id, ingredients, complete: ingredients.every((ingredient) => ingredient.complete) };
}

export function getMissingRecipeIngredients(recipe: LegacySystemRecipe, speakers: ReadonlyArray<Pick<ClubSpeaker, "modelId"> & Partial<Pick<ClubSpeaker, "kind">>>) {
  return getRecipeProgress(recipe, speakers).ingredients.flatMap((ingredient) => Array.from({ length: Math.max(0, ingredient.required - ingredient.placed) }, () => ({ modelId: ingredient.modelId })));
}
