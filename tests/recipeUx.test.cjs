const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const home = readFileSync("client/src/pages/Home.tsx", "utf8");
const floor = readFileSync("client/src/components/ClubFloor3D.tsx", "utf8");
const recipes = readFileSync("client/src/lib/systemRecipes.ts", "utf8");

assert.match(recipes, /SYSTEM_PRESETS\.map\(recipeFromPreset\)/, "recipes are converted from existing preset definitions");
assert.match(home, /SYSTEM_RECIPES\.map/, "all converted recipes appear in the SYSTEM browser");
assert.match(home, /FREE BUILD/, "FREE BUILD remains available");
assert.match(home, /setCurrentRecipeId\(recipe\.id\); setRecipeDetailId\(recipe\.id\)/, "recipe selection only changes recipe state");
assert.doesNotMatch(home, /prepareRecipeMaterials|getMissingRecipeIngredients|createMaterialStagingPlan|resolvePhysicalCollisions/, "recipe selection has no batch material staging path");
assert.doesNotMatch(home, /materialStaging/, "Home does not pass recipe-only staging state to the scene");
assert.doesNotMatch(floor, /materialStaging|recipe-material-label/, "the 3D scene has no recipe material staging overlay");
assert.match(home, /recipeProgress\.ingredients\.map/, "required recipe models are rendered first in the Library");
assert.match(home, /OTHER CABINETS/, "unrelated cabinets remain available below recipe materials");
assert.match(home, /model\.label/, "the actual model name is rendered");
assert.match(home, /model\.band\.toUpperCase\(\).*model\.kind\.toUpperCase\(\)/, "band and role are rendered for identification");
assert.match(home, /ingredient\.placed.*ingredient\.required/, "Library progress is tied to getRecipeProgress data");
assert.match(home, /onAdd\(modelId\)/, "each Library item adds one selected model");
assert.match(home, /getRecipeProgress\(recipeDetail, speakers\)/, "Recipe detail shows live progress");
assert.match(home, /recipeProgress\.complete.*MATERIALS READY/, "MATERIALS READY remains a material state only");

console.log("recipe UX tests passed");
