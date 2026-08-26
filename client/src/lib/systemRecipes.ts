/* SYSTM recipe rule: a recipe lists ingredients only; it never owns finished placement. */
import type { ClubSpeaker } from "@/hooks/useClubAudio";
import { resolveModelId, type SpeakerModelId } from "@/lib/speakerModels";
import { SYSTEM_PRESETS } from "@/lib/systemPresets";

export type SystemRecipeIngredient = { modelId: SpeakerModelId; quantity: number };
export type SystemRecipe = {
  id: string;
  name: string;
  description?: string;
  ingredients: SystemRecipeIngredient[];
  tags?: string[];
};

export type RecipeProgressItem = SystemRecipeIngredient & { required: number; placed: number; complete: boolean };
export type RecipeProgress = { recipeId: string; ingredients: RecipeProgressItem[]; complete: boolean };

const recipeFromPreset = (preset: (typeof SYSTEM_PRESETS)[number]): SystemRecipe => {
  const quantities = new Map<SpeakerModelId, number>();
  preset.speakers.forEach(({ modelId }) => quantities.set(modelId, (quantities.get(modelId) ?? 0) + 1));
  return {
    id: preset.id,
    name: preset.label,
    description: preset.description,
    ingredients: Array.from(quantities, ([modelId, quantity]) => ({ modelId, quantity })),
    tags: [preset.family],
  };
};

export const SYSTEM_RECIPES: SystemRecipe[] = SYSTEM_PRESETS.map(recipeFromPreset);

export function getRecipeProgress(recipe: SystemRecipe, speakers: ReadonlyArray<Pick<ClubSpeaker, "modelId"> & Partial<Pick<ClubSpeaker, "kind">>>): RecipeProgress {
  const placedByModel = new Map<SpeakerModelId, number>();
  speakers.forEach((speaker) => { const modelId = speaker.modelId ?? (speaker.kind ? resolveModelId(undefined, speaker.kind) : undefined); if (!modelId) return; placedByModel.set(modelId, (placedByModel.get(modelId) ?? 0) + 1); });
  const ingredients = recipe.ingredients.map((ingredient) => {
    const placed = Math.min(placedByModel.get(ingredient.modelId) ?? 0, ingredient.quantity);
    return { ...ingredient, required: ingredient.quantity, placed, complete: placed >= ingredient.quantity };
  });
  return { recipeId: recipe.id, ingredients, complete: ingredients.every((ingredient) => ingredient.complete) };
}
