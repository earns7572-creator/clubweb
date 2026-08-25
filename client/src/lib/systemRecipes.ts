/* SYSTM recipe rule: a recipe lists ingredients only; it never owns finished placement. */
import type { ClubSpeaker } from "@/hooks/useClubAudio";
import { resolveModelId, type SpeakerModelId } from "@/lib/speakerModels";

export type SystemRecipeIngredient = { modelId: SpeakerModelId; quantity: number };
export type SystemRecipe = {
  id: string;
  name: string;
  description?: string;
  ingredients: SystemRecipeIngredient[];
  tags?: string[];
  suggestedLayout?: { towers?: number; notes?: string };
};

export type RecipeProgressItem = SystemRecipeIngredient & { required: number; placed: number; complete: boolean };
export type RecipeProgress = { recipeId: string; ingredients: RecipeProgressItem[]; complete: boolean };

export const SYSTEM_RECIPES: SystemRecipe[] = [
  {
    id: "reggae-sound-system",
    name: "Reggae Sound System",
    description: "Low-frequency-heavy cabinet system built from dedicated bass, kick, mid and top sections.",
    ingredients: [
      { modelId: "reggae-scoop", quantity: 4 },
      { modelId: "reggae-kick", quantity: 2 },
      { modelId: "reggae-mid-horn", quantity: 2 },
      { modelId: "reggae-top", quantity: 2 },
    ],
    tags: ["reggae", "multi-way", "wall"],
    suggestedLayout: { towers: 2, notes: "Build two vertical columns; placement remains user-defined." },
  },
  {
    id: "steppers-stack",
    name: "Steppers Stack",
    description: "A compact dub-oriented material set with dedicated bass, kick, mid and top sections.",
    ingredients: [
      { modelId: "steppers-reflex-sub", quantity: 2 },
      { modelId: "steppers-kick", quantity: 2 },
      { modelId: "steppers-mid", quantity: 2 },
      { modelId: "steppers-top", quantity: 2 },
    ],
    tags: ["steppers", "dub", "single-tower"],
    suggestedLayout: { towers: 1, notes: "Use vertical stacking as a starting point; arrangement remains user-defined." },
  },
];

export function getRecipeProgress(recipe: SystemRecipe, speakers: ReadonlyArray<Pick<ClubSpeaker, "modelId"> & Partial<Pick<ClubSpeaker, "kind">>>): RecipeProgress {
  const placedByModel = new Map<SpeakerModelId, number>();
  speakers.forEach((speaker) => { const modelId = speaker.modelId ?? (speaker.kind ? resolveModelId(undefined, speaker.kind) : undefined); if (!modelId) return; placedByModel.set(modelId, (placedByModel.get(modelId) ?? 0) + 1); });
  const ingredients = recipe.ingredients.map((ingredient) => {
    const placed = Math.min(placedByModel.get(ingredient.modelId) ?? 0, ingredient.quantity);
    return { ...ingredient, required: ingredient.quantity, placed, complete: placed >= ingredient.quantity };
  });
  return { recipeId: recipe.id, ingredients, complete: ingredients.every((ingredient) => ingredient.complete) };
}

export function getMissingRecipeIngredients(recipe: SystemRecipe, speakers: ReadonlyArray<Pick<ClubSpeaker, "modelId"> & Partial<Pick<ClubSpeaker, "kind">>>) {
  return getRecipeProgress(recipe, speakers).ingredients.flatMap((ingredient) => Array.from({ length: Math.max(0, ingredient.required - ingredient.placed) }, () => ({ modelId: ingredient.modelId })));
}
