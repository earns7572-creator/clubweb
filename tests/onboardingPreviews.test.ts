import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { modelIdsForFamily, orderedSpeakerFamilies } from "../client/src/lib/speakerModels";
import { onboardingSpeakerPreviewByModel } from "../client/src/lib/onboardingSpeakerPreviews";

for (const family of orderedSpeakerFamilies()) {
  for (const modelId of modelIdsForFamily(family.id)) {
    assert.ok(onboardingSpeakerPreviewByModel[modelId].startsWith("/manus-storage/"), `${modelId} has a deployed actual-model static preview`);
    assert.ok(onboardingSpeakerPreviewByModel[modelId].startsWith(`/manus-storage/${modelId}_`), `${modelId} preview asset is keyed by that exact modelId`);
  }
}

const onboarding = readFileSync(new URL("../client/src/components/FirstUseOnboarding.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../client/src/first-use-onboarding.css", import.meta.url), "utf8");
assert.match(onboarding, /onboardingSpeakerPreviewByModel\[modelId\]/, "speaker cards render preview by modelId");
assert.match(onboarding, /<img src=\{onboardingSpeakerPreviewByModel\[modelId\]\}/, "speaker cards use static images rather than per-card Canvas renderers");
assert.match(onboarding, /data-model-id=\{modelId\}/, "each card exposes the same exact modelId used for selection and preview lookup");
assert.doesNotMatch(onboarding, /<i aria-hidden/, "speaker cards no longer render generic CSS icon placeholders");
assert.doesNotMatch(styles, /first-use-model-card i/, "placeholder card icon CSS is removed");

console.log("onboarding preview tests passed");
