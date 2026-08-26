const assert = require("node:assert/strict");
const { getRecipeProgress, SYSTEM_RECIPES } = require("../.tmp-system-recipes.cjs");

const recipe = { id: "test-recipe", name: "Test", ingredients: [{ modelId: "modern-sub", quantity: 4 }, { modelId: "modern-mid", quantity: 2 }] };
const speakers = ["modern-sub", "modern-sub", "modern-sub", "modern-mid", "modern-mid"].map((modelId, index) => ({ id: String(index), modelId }));
const progress = getRecipeProgress(recipe, speakers);
assert.deepEqual(progress.ingredients.map(({ modelId, required, placed, complete }) => ({ modelId, required, placed, complete })), [
  { modelId: "modern-sub", required: 4, placed: 3, complete: false },
  { modelId: "modern-mid", required: 2, placed: 2, complete: true },
]);
assert.equal(progress.complete, false, "recipe is incomplete while one ingredient is missing");
assert.equal(getRecipeProgress(recipe, [...speakers, { id: "5", modelId: "modern-sub" }]).complete, true, "recipe completes when every ingredient quantity is met");
assert.equal(getRecipeProgress(recipe, speakers.filter((speaker) => speaker.modelId !== "modern-mid")).ingredients.find((item) => item.modelId === "modern-mid").placed, 0, "deleting an ingredient decreases progress");
assert.equal(getRecipeProgress(recipe, speakers).recipeId, "test-recipe", "switching recipe state is data-only and does not mutate scene inputs");
assert.deepEqual(SYSTEM_RECIPES.map((item) => item.name), ["Reggae Sound System", "Free Party Stack", "4-Point Club", "Main Stage PA", "Listening Bar Stereo", "Steppers Stereo Stack"], "all preset recipes are restored");
assert.equal(SYSTEM_RECIPES.length, 6, "exactly six system recipes are available");
assert.equal("speakers" in SYSTEM_RECIPES[0], false, "recipes do not embed preset positions");
assert.ok(SYSTEM_RECIPES.every((item) => item.ingredients.every((ingredient) => Object.keys(ingredient).sort().join(",") === "modelId,quantity")), "recipe ingredients contain modelId and quantity only");
assert.deepEqual(SYSTEM_RECIPES.find((item) => item.id === "reggae-wall").ingredients.map((item) => item.quantity), [2, 2, 2, 2], "reggae recipe is derived from preset model counts");
console.log("system recipe tests passed");
