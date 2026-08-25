import type { SpeakerModelId } from "@/lib/speakerModels";

export type RecipeMaterialPlanItem = { modelId: SpeakerModelId; x: number; y: number; index: number };

// The plan is only a camera-aware staging suggestion. It has no stack or final-layout semantics.
export function createMaterialStagingPlan(ingredients: readonly { modelId: SpeakerModelId }[], columns = 4): RecipeMaterialPlanItem[] {
  const safeColumns = Math.max(1, Math.min(columns, ingredients.length || 1));
  return ingredients.map((ingredient, index) => ({
    ...ingredient,
    index,
    x: Number((.17 + (index % safeColumns) * .22).toFixed(2)),
    y: Number((.18 + Math.floor(index / safeColumns) * .18).toFixed(2)),
  }));
}
