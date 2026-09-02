import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SOUND_SYSTEM_RECIPES } from "../client/src/lib/systemPresets";
import { createInitialSceneStateMap } from "../client/src/lib/systmSceneState";
import {
  snappedYawFromScreenPointer,
  yawToDegrees,
} from "../client/src/lib/speakerOrientation";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const home = read("client/src/pages/Home.tsx");
const floor = read("client/src/components/ClubFloor3D.tsx");
const css = read("client/src/product-experience.css");

assert.match(
  home,
  /product-mode-\$\{mode\}/,
  "CLUB and SOUND SYSTEM render from explicit product mode state"
);
for (const control of [
  "MODE",
  "LAYOUT",
  "RECIPE",
  "SOUND",
  "LISTENER",
  "LISTEN",
])
  assert.ok(home.includes(control), `${control} remains a product control`);
assert.match(home, /showModePicker/);
assert.match(home, /onModeChange\(item\)/);

const reggae = SOUND_SYSTEM_RECIPES.find(
  recipe => recipe.name === "Reggae Sound System"
);
assert.ok(reggae);
assert.deepEqual(
  reggae.sections.flatMap(section => section.recommendedModelIds),
  ["reggae-scoop", "reggae-kick", "reggae-mid-horn", "reggae-top"]
);
assert.ok(
  home.indexOf("RECIPE GUIDE") < home.indexOf("OTHER CABINETS"),
  "recipe guide renders before other cabinets"
);
assert.doesNotMatch(
  home,
  /PREPARE MATERIALS|createMaterialStagingPlan/,
  "recipe UI adds one cabinet at a time"
);

assert.match(css, /min-height: 48px/);
assert.match(css, /pointer-events: auto/);
assert.match(css, /touch-action: manipulation/);
assert.match(home, /aria-label="Mobile speaker rotation"/);
assert.match(home, /Math\.PI \/ 12/);
assert.match(floor, /onPointerMove/);
assert.match(floor, /turnFromPointer/);
assert.equal(
  yawToDegrees(snappedYawFromScreenPointer({ x: 0, y: 0 }, { x: 100, y: 0 })),
  90
);
assert.equal(
  yawToDegrees(snappedYawFromScreenPointer({ x: 0, y: 0 }, { x: 0, y: 100 })),
  0
);

const scenes = createInitialSceneStateMap();
scenes.club.speakers.push({ id: "club-speaker" } as never);
scenes.club.modeOnboardingStep = null;
assert.equal(
  scenes["sound-system"].speakers.length,
  0,
  "mode switching preserves independent scenes"
);
assert.equal(
  scenes["sound-system"].modeOnboardingStep,
  "sound-recipe",
  "skipping CLUB onboarding does not skip SOUND SYSTEM onboarding"
);
assert.match(home, /mode-empty-state/);
assert.match(home, /CHOOSE A LAYOUT/);
assert.match(home, /ADD A CABINET/);
assert.match(home, /CHOOSE A RECIPE/);

console.log("product experience tests passed");
