const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const read = (path) => readFileSync(path, "utf8");
const home = read("client/src/pages/Home.tsx");
const audio = read("client/src/hooks/useClubAudio.ts");
const layout = read("client/src/lib/layoutFile.ts");
const miniature = read("client/src/components/SpeakerMiniature.tsx");
const speakerModels = read("client/src/lib/speakerModels.ts");

assert.match(home, /const initialSpeakers: ClubSpeaker\[\] = \[\{ \.\.\.makeSpeaker\("starter-sub"/);
assert.match(home, /makeSpeaker\("starter-full"/);
assert.match(home, /mobile-tray-handle/);
assert.match(home, /speakerTrayOpen/);
assert.match(home, /cabinetColors/);
assert.match(home, /cabinetColorScope/);
assert.match(home, /LIGHT GRAPHITE/);
assert.match(home, /CHALK RED/);
assert.match(home, /POWDER BLUE/);
assert.match(home, /PALE LIME/);
assert.match(home, /MIST VIOLET/);
['#d9a09a', '#a9c7d8', '#bdd79a', '#b9b1d8', '#8c9096'].forEach((hex) => assert.match(home, new RegExp(hex), `Speaker Color palette includes ${hex}`));
assert.match(home, /applyCabinetColor/);
assert.match(home, /scope === "stack"/);
assert.match(home, /scope === "all"/);
assert.match(home, /const releaseSpeakerModelIds: readonly SpeakerModelId\[\] = \["modern-sub", "modern-woofer", "modern-full", "modern-mid", "modern-high"\]/);
assert.match(home, /const models = releaseSpeakerModelIds/);
assert.doesNotMatch(home, /family-switch scene-family-switch/);
assert.match(home, /const inspectorModels = releaseSpeakerModelIds/);
["modern-sub", "modern-woofer", "modern-full", "modern-mid", "modern-high"].forEach((modelId) => assert.match(home, new RegExp(`"${modelId}"`)));
const hiddenReleaseModelIds = ["reggae-scoop", "reggae-kick", "reggae-mid-horn", "reggae-top", "freeparty-wbin", "freeparty-kick-horn", "freeparty-mid-horn", "freeparty-top", "festival-sub", "festival-line-array", "festival-front-fill", "hifi-woofer", "hifi-mid-horn", "hifi-tweeter", "steppers-reflex-sub", "steppers-kick", "steppers-mid", "steppers-top"];
hiddenReleaseModelIds.forEach((modelId) => assert.doesNotMatch(home, new RegExp(`"${modelId}"`)));
hiddenReleaseModelIds.forEach((modelId) => assert.match(speakerModels, new RegExp(`"${modelId}"`)));
assert.match(audio, /cabinetColor\?: string/);
assert.match(layout, /cabinetColor\?: string/);
assert.match(layout, /isHexColor/);
assert.match(layout, /layoutToPresetData.*cabinetColor/);
assert.match(miniature, /materials\.cabinet\.color\.set/);

console.log("product UX static tests passed");

assert.match(home, /const releaseRecipes = SYSTEM_RECIPES.filter/);
assert.match(home, /recipe.ingredients.every\(\(item\) => releaseSpeakerModelIds.includes\(item.modelId\)\)/);
assert.match(home, /Imported cabinet/);
assert.match(home, /file-validation-error.*role="alert"/);
