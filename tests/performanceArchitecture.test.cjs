const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const read = (path) => readFileSync(path, "utf8");
const audio = read("client/src/hooks/useClubAudio.ts");
const home = read("client/src/pages/Home.tsx");
const top = read("client/src/components/ClubFloor3D.tsx");
const pov = read("client/src/components/PovPreview.tsx");
const side = read("client/src/components/SideScene.tsx");
const app = read("client/src/App.tsx");
const miniature = read("client/src/components/SpeakerMiniature.tsx");

assert.match(audio, /syncTopology/);
assert.match(audio, /syncSpeakerDsp/);
assert.match(audio, /syncSpeakerPositions/);
assert.match(audio, /syncListenerPosition/);
assert.match(audio, /syncListenerOrientation/);
assert.match(audio, /cache: SpeakerCache/);
assert.doesNotMatch(audio, /setActivityBySpeaker/);
assert.doesNotMatch(audio, /speakers\.find\(/);
assert.match(audio, /isPlaying \|\| hasResidual/);
assert.match(home, /useSpeakerActivity\(activityStore\)/);
assert.doesNotMatch(home, /activityBySpeaker, togglePlayback/);
assert.match(top, /frameloop="demand"/);
assert.match(top, /requestAnimationFrame\(applyPending\)/);
assert.match(pov, /frameloop="demand"/);
assert.match(pov, /requestAnimationFrame\(flushLook\)/);
assert.match(side, /getBoundingClientRect\(\)/);
assert.match(side, /requestAnimationFrame\(flush\)/);
assert.match(app, /lazy\(\(\) => import\("\.\/components\/SpeakerModelValidation"\)\)/);
assert.match(miniature, /const cabinet = makeChamferCabinet/);

console.log("performance architecture tests passed");
