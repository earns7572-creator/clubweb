import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { modelIdsForFamily, orderedSpeakerFamilies } from "../client/src/lib/speakerModels";
import { onboardingSpeakerPreviewByModel } from "../client/src/lib/onboardingSpeakerPreviews";

for (const family of orderedSpeakerFamilies()) {
  for (const modelId of modelIdsForFamily(family.id)) {
    const preview = onboardingSpeakerPreviewByModel[modelId];
    assert.ok(preview.startsWith("/assets/onboarding/"), `${modelId} keeps its repo-owned preview asset`);
    assert.ok(preview.endsWith(`/${modelId}.webp`), `${modelId} preview remains keyed by its exact modelId`);
    assert.ok(existsSync(new URL(`../client/public${preview}`, import.meta.url)), `${modelId} preview remains committed for future non-onboarding use`);
  }
}

const onboarding = readFileSync(new URL("../client/src/components/FirstUseOnboarding.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../client/src/first-use-onboarding.css", import.meta.url), "utf8");
const home = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
assert.doesNotMatch(onboarding, /onboardingSpeakerPreviewByModel|first-use-model-grid|first-use-model-card/, "onboarding no longer renders a parallel thumbnail chooser");
assert.doesNotMatch(onboarding, /first-use-play|SINE SWEEP\s*<\/strong>/, "onboarding has no giant play or card CTA");
assert.doesNotMatch(onboarding, /onPointerDown=\{/, "onboarding does not place through a full-stage React overlay capture");
assert.match(onboarding, /PICK A CABINET/, "step 01 is a concise library instruction");
assert.match(onboarding, /PLACE IT/, "step 02 keeps floor placement guidance");
assert.match(onboarding, /CHOOSE A SOUND/, "step 03 uses compact sound commands");
assert.match(onboarding, /BUILD YOUR SYSTEM/, "completion is an in-scene transient label");
assert.match(onboarding, /club-floor-3d canvas/, "placement listens to the actual scene canvas rather than an overlay");
assert.match(styles, /first-use-onboarding\{[^}]*pointer-events:none/, "guidance does not block normal scene controls");
assert.doesNotMatch(styles, /first-use-place\{pointer-events:auto|background:rgba\(0,0,0/, "no placement blocker or dark modal styling remains");
assert.match(home, /setTimeout\(\(\) => setOnboardingStep\(null\), 1750\)/, "completion fades for the required 1.5–2 second window");
assert.match(home, /onboardingStep === "speaker"/, "SYSTEM LIBRARY routes first onboarding cabinet choice through the existing interaction");

console.log("scene-first onboarding tests passed");
