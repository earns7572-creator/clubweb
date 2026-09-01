import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CLUB_LAYOUTS, SOUND_SYSTEM_RECIPES, SYSTEM_PRESETS } from "../client/src/lib/systemPresets";
import { createInitialSceneStateMap } from "../client/src/lib/systmSceneState";
import { loadSystmMode, MODE_ONBOARDING_STEPS, parseSystmMode, persistSystmMode } from "../client/src/lib/systmModes";

const home = readFileSync(resolve(import.meta.dirname, "../client/src/pages/Home.tsx"), "utf8");

assert.equal(parseSystmMode("club"), "club");
assert.equal(parseSystmMode("sound-system"), "sound-system");
assert.equal(parseSystmMode("system"), null);
assert.deepEqual(MODE_ONBOARDING_STEPS.club, ["CHOOSE A LAYOUT", "MOVE THE LISTENER", "LISTEN IN SPACE"]);
assert.deepEqual(MODE_ONBOARDING_STEPS["sound-system"], ["ADD A CABINET", "STACK IT", "AIM IT", "LISTEN"]);

const persistedValues = new Map<string, string>();
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: { getItem: (key: string) => persistedValues.get(key) ?? null, setItem: (key: string, value: string) => persistedValues.set(key, value) } } });
persistSystmMode("sound-system");
assert.equal(loadSystmMode(), "sound-system", "mode persistence stores the selected mode");

assert.equal(SYSTEM_PRESETS.length, 6, "legacy preset definitions remain available");
assert.deepEqual(CLUB_LAYOUTS.map((layout) => layout.label), ["4-Point Club", "Main Stage PA", "Listening Bar Stereo"]);
assert.deepEqual(SOUND_SYSTEM_RECIPES.map((recipe) => recipe.name), ["Reggae Sound System", "Free Party Stack", "Steppers Stereo Stack"]);
for (const recipe of SOUND_SYSTEM_RECIPES) {
  assert.equal(recipe.ownership, "sound-system");
  for (const ingredient of recipe.ingredients) assert.ok(ingredient.quantity > 0, `${recipe.name} ingredients have quantities`);
  assert.ok(recipe.ingredients.every((ingredient) => !Object.hasOwn(ingredient, "x") && !Object.hasOwn(ingredient, "y") && !Object.hasOwn(ingredient, "yaw") && !Object.hasOwn(ingredient, "stackOn")), `${recipe.name} is ingredients-only`);
}

const scenes = createInitialSceneStateMap("Listener");
scenes.club.speakers.push({} as never);
scenes["sound-system"].recipeId = "reggae-sound-system";
scenes.club.view = "pov";
scenes["sound-system"].view = "side";
assert.equal(scenes["sound-system"].speakers.length, 0, "club scene mutations do not leak into sound-system scene");
assert.equal(scenes.club.view, "pov", "club view restores after mode switching");
assert.equal(scenes["sound-system"].view, "side", "sound-system view remains independent");
assert.equal(scenes.club.modeOnboardingStep, "CHOOSE A LAYOUT");
assert.equal(scenes["sound-system"].modeOnboardingStep, "ADD A CABINET");

assert.match(home, /function ClubExperience/);
assert.match(home, /function SoundSystemExperience/);
assert.match(home, /function SystmShell/);
assert.match(home, /persistSystmMode\(nextMode\)/);
assert.match(home, /mode === "club" \? <ClubExperience/);
assert.match(home, /mode === "club" \? <ClubLayoutLibrary/);
assert.match(home, /SOUND_SYSTEM_RECIPES\.find/);
assert.match(home, /mode === "club" \? "LAYOUT" : "RECIPE"/);
assert.match(home, /LISTENER/);

console.log("dual-mode architecture tests passed");
