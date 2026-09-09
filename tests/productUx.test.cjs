const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const read = (path) => readFileSync(path, "utf8");
const home = read("client/src/pages/Home.tsx");
const audio = read("client/src/hooks/useClubAudio.ts");
const layout = read("client/src/lib/layoutFile.ts");
const miniature = read("client/src/components/SpeakerMiniature.tsx");

assert.match(home, /const initialSpeakers: ClubSpeaker\[\] = \[makeSpeaker\("starter-sub"/);
assert.match(home, /makeSpeaker\("starter-full"/);
assert.match(home, /mobile-tray-handle/);
assert.match(home, /speakerTrayOpen/);
assert.match(home, /cabinetColors/);
assert.match(home, /cabinetColorScope/);
assert.match(home, /GRAPHITE/);
assert.match(home, /OFF WHITE/);
assert.match(home, /RAW GRAY/);
assert.match(home, /applyCabinetColor/);
assert.match(home, /scope === "stack"/);
assert.match(home, /scope === "all"/);
assert.match(home, /const soundSystemLibraryFamilies: readonly SpeakerFamily\[\] = \["reggae", "freeparty", "festival", "hifi", "steppers"\]/);
assert.match(home, /orderedSpeakerFamilies\(\)\.filter\(\(definition\) => soundSystemLibraryFamilies\.includes\(definition\.id\)\)/);
assert.match(home, /const inspectorModels = orderedSpeakerFamilies\(\)\.flatMap\(\(family\) => modelIdsForFamily\(family\.id\)\)/);
assert.match(home, /const visibleFamily = soundSystemLibraryFamilies\.includes\(family\) \? family : soundSystemLibraryFamilies\[0\]/);
assert.doesNotMatch(home, /speakerModels\.ts.*delete|delete.*SPEAKER_MODELS/);
assert.match(audio, /cabinetColor\?: string/);
assert.match(layout, /cabinetColor\?: string/);
assert.match(layout, /isHexColor/);
assert.match(layout, /layoutToPresetData.*cabinetColor/);
assert.match(miniature, /materials\.cabinet\.color\.set/);

console.log("product UX static tests passed");
