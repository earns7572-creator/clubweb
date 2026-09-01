import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  PRODUCT_ONBOARDING_COPY,
  PRODUCT_ONBOARDING_STEPS,
  advanceProductOnboarding,
  autoAdvanceProductOnboarding,
  demoModeFromSearch,
} from "../client/src/lib/productOnboarding";

const guide = readFileSync(
  new URL(
    "../client/src/components/ProductOnboardingGuide.tsx",
    import.meta.url
  ),
  "utf8"
);
const styles = readFileSync(
  new URL("../client/src/product-onboarding.css", import.meta.url),
  "utf8"
);

assert.equal(PRODUCT_ONBOARDING_STEPS.club.length, 9);
assert.equal(PRODUCT_ONBOARDING_STEPS["sound-system"].length, 11);
assert.equal(
  advanceProductOnboarding("club", "club-layout", "layout-selected"),
  "club-build"
);
assert.equal(autoAdvanceProductOnboarding("club-build"), "club-listener");
assert.equal(
  advanceProductOnboarding("club", "club-aim", "speaker-rotated"),
  "club-play"
);
assert.equal(
  advanceProductOnboarding("sound-system", "sound-recipe", "recipe-selected"),
  "sound-pick"
);
assert.equal(
  advanceProductOnboarding("sound-system", "sound-stack", "cabinet-stacked"),
  "sound-build"
);
assert.equal(autoAdvanceProductOnboarding("sound-listen"), null);
assert.equal(demoModeFromSearch("?demo=club"), "club");
assert.equal(demoModeFromSearch("?demo=sound-system"), "sound-system");
assert.equal(demoModeFromSearch("?demo=unknown"), null);
assert.equal(PRODUCT_ONBOARDING_COPY["club-pov"].verb, "ENTER POV");
assert.equal(PRODUCT_ONBOARDING_COPY["sound-snap"].verb, "SIDE SNAP");
assert.match(guide, /SKIP INTRO/);
assert.doesNotMatch(guide, /WELCOME|SUCCESS|READY|BUILD YOUR SYSTEM/);
assert.match(styles, /pointer-events: none/);
assert.match(styles, /pointer-events: auto/);
assert.match(styles, /420ms/);

console.log("mode-specific scene-first onboarding tests passed");
