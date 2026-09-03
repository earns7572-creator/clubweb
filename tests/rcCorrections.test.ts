import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SOUND_SYSTEM_RECIPES } from "../client/src/lib/systemPresets";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const home = read("client/src/pages/Home.tsx");
const guideCss = read("client/src/product-onboarding.css");
const experienceCss = read("client/src/product-experience.css");

assert.match(guideCss, /\.product-guide[\s\S]*z-index: 2/);
assert.match(guideCss, /\.product-guide[\s\S]*pointer-events: none/);
assert.match(guideCss, /\.product-guide-skip[\s\S]*pointer-events: auto/);
assert.match(home, /if \(!onboardingStep\) return/);
assert.match(home, /next === null && !isDemo/);
assert.match(home, /setOnboardingStep\(null\)/);
assert.match(home, /onboardingCompleteKey\(mode\)/);

assert.match(home, /mode === "club" \? \(\s*<>[\s\S]*<ClubLayoutLibrary/);
assert.match(home, /<FamilyLibrary[\s\S]*mode=\{mode\}[\s\S]*recipe=\{null\}/);
assert.match(home, /const soundSystemLibraryFamilies: SpeakerFamily\[\] =/);
assert.doesNotMatch(home, /recipeProgress|INGREDIENTS COMPLETE/);
assert.match(home, /return \[\.\.\.now, makeSpeaker\(id, modelId/);
assert.match(home, /recipe\.sections\[0\]\?\.recommendedModelIds\[0\]/);
assert.match(home, /aria-label=\{isPlaying \? "Pause" : "Listen"\}/);

for (const recipe of SOUND_SYSTEM_RECIPES) {
  assert.ok(recipe.sections.length > 0);
  assert.ok(recipe.sections.every(section => section.recommendedModelIds.length > 0));
  assert.ok(recipe.sections.every(section => !Object.hasOwn(section, "quantity")));
}

assert.match(experienceCss, /--surface-panel-bg/);
assert.match(experienceCss, /--surface-popover-bg/);
assert.match(experienceCss, /\.product-experience \.instrument-header[\s\S]*z-index: 20/);
assert.match(experienceCss, /\.product-experience \.mixer-trigger[\s\S]*background: var\(--surface-panel-bg\)/);

console.log("RC UX correction tests passed");
