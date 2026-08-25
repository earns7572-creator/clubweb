const assert = require("node:assert/strict");
const { getMissingRecipeIngredients, getRecipeProgress, SYSTEM_RECIPES } = require("../.tmp-system-recipes.cjs");

const recipe = { id: "test-recipe", name: "Test", ingredients: [{ modelId: "modern-sub", quantity: 4 }, { modelId: "modern-mid", quantity: 2 }] };
const speakers = ["modern-sub", "modern-sub", "modern-sub", "modern-mid", "modern-mid"].map((modelId, index) => ({ id: String(index), modelId }));
const progress = getRecipeProgress(recipe, speakers);
assert.deepEqual(progress.ingredients.map(({ modelId, required, placed, complete }) => ({ modelId, required, placed, complete })), [
  { modelId: "modern-sub", required: 4, placed: 3, complete: false },
  { modelId: "modern-mid", required: 2, placed: 2, complete: true },
]);
assert.equal(progress.complete, false, "recipe is incomplete while one ingredient is missing");
assert.equal(getRecipeProgress(recipe, [...speakers, { id: "5", modelId: "modern-sub" }]).complete, true, "recipe completes when every ingredient quantity is met");
assert.equal(getMissingRecipeIngredients(recipe, []).length, 6, "prepare starts at zero ingredients");
assert.equal(getMissingRecipeIngredients(recipe, speakers).filter((item) => item.modelId === "modern-sub").length, 1, "prepare adds only the missing sub");
assert.equal(getMissingRecipeIngredients(recipe, [...speakers, { id: "6", modelId: "modern-sub" }]).length, 0, "prepare does not duplicate a complete recipe");
assert.equal(getRecipeProgress(recipe, speakers.filter((speaker) => speaker.modelId !== "modern-mid")).ingredients.find((item) => item.modelId === "modern-mid").placed, 0, "deleting an ingredient decreases progress");
assert.equal(getRecipeProgress(recipe, speakers).recipeId, "test-recipe", "switching recipe state is data-only and does not mutate scene inputs");
assert.ok(SYSTEM_RECIPES.some((item) => item.id === "reggae-sound-system"), "initial recipes include the reggae example");
assert.ok(SYSTEM_RECIPES.some((item) => item.id === "steppers-stack"), "initial recipes include the steppers example");
assert.equal("speakers" in SYSTEM_RECIPES[0], false, "recipes do not embed preset positions");
assert.deepEqual(SYSTEM_RECIPES.find((item) => item.id === "reggae-sound-system").ingredients.map((item) => item.quantity), [4, 2, 2, 2], "reggae recipe exposes the ten-cabinet material set");
console.log("system recipe tests passed");
