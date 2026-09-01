import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CLUB_LAYOUTS,
  SOUND_SYSTEM_RECIPES,
  SYSTEM_PRESETS,
} from "../client/src/lib/systemPresets";
import { createInitialSceneStateMap } from "../client/src/lib/systmSceneState";
import { PRODUCT_ONBOARDING_STEPS } from "../client/src/lib/productOnboarding";
import {
  loadSystmMode,
  parseSystmMode,
  persistSystmMode,
} from "../client/src/lib/systmModes";

const home = readFileSync(
  resolve(import.meta.dirname, "../client/src/pages/Home.tsx"),
  "utf8"
);

assert.equal(parseSystmMode("club"), "club");
assert.equal(parseSystmMode("sound-system"), "sound-system");
assert.equal(parseSystmMode("system"), null);
assert.equal(PRODUCT_ONBOARDING_STEPS.club[0], "club-layout");
assert.equal(PRODUCT_ONBOARDING_STEPS["sound-system"][0], "sound-recipe");

const persistedValues = new Map<string, string>();
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: {
    localStorage: {
      getItem: (key: string) => persistedValues.get(key) ?? null,
      setItem: (key: string, value: string) => persistedValues.set(key, value),
    },
  },
});
persistSystmMode("sound-system");
assert.equal(loadSystmMode(), "sound-system");

assert.equal(SYSTEM_PRESETS.length, 6, "engine preset data remains available");
assert.deepEqual(
  CLUB_LAYOUTS.map(layout => layout.label),
  ["4-Point Club", "Main Stage PA", "Listening Bar Stereo"]
);
assert.deepEqual(
  SOUND_SYSTEM_RECIPES.map(recipe => recipe.name),
  ["Reggae Sound System", "Free Party Stack", "Steppers Stereo Stack"]
);
for (const recipe of SOUND_SYSTEM_RECIPES) {
  assert.equal(recipe.ownership, "sound-system");
  assert.ok(
    recipe.ingredients.every(
      item =>
        !Object.hasOwn(item, "x") &&
        !Object.hasOwn(item, "yaw") &&
        !Object.hasOwn(item, "stackOn")
    ),
    `${recipe.name} remains ingredients-only`
  );
}

const scenes = createInitialSceneStateMap("Listener");
scenes.club.speakers.push({} as never);
scenes.club.view = "pov";
scenes.club.modeOnboardingStep = null;
assert.equal(
  scenes["sound-system"].speakers.length,
  0,
  "mode scenes remain independent"
);
assert.equal(
  scenes["sound-system"].view,
  "top",
  "switching modes does not mutate the other scene"
);
assert.equal(
  scenes["sound-system"].modeOnboardingStep,
  "sound-recipe",
  "onboarding completion is mode-specific"
);

assert.match(home, /function ClubExperience/);
assert.match(home, /function SoundSystemExperience/);
assert.match(home, /demoModeFromSearch\(window\.location\.search\)/);
assert.match(home, /mode === "club" \? \(/);

console.log("dual-mode architecture tests passed");
