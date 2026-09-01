import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createDefaultEq } from "../client/src/lib/speakerEq";
import {
  CABINET_COLOR_PRESETS,
  cabinetColorTargetIds,
  isGlbCabinetShellName,
  normalizeCabinetColor,
} from "../client/src/lib/speakerCabinetColor";
import {
  createLayoutFile,
  layoutToClubSpeakers,
  parseLayoutFile,
} from "../client/src/lib/layoutFile";
import { createInitialSceneStateMap } from "../client/src/lib/systmSceneState";
import { demoModeFromSearch } from "../client/src/lib/productOnboarding";
import type { ClubSpeaker } from "../client/src/hooks/useClubAudio";

const css = readFileSync(
  new URL("../client/src/product-experience.css", import.meta.url),
  "utf8"
);
const guideCss = readFileSync(
  new URL("../client/src/product-onboarding.css", import.meta.url),
  "utf8"
);
const home = readFileSync(
  new URL("../client/src/pages/Home.tsx", import.meta.url),
  "utf8"
);
const glb = readFileSync(
  new URL(
    "../client/src/components/speakers/GlbSpeakerModel.tsx",
    import.meta.url
  ),
  "utf8"
);
const procedural = readFileSync(
  new URL("../client/src/components/SpeakerMiniature.tsx", import.meta.url),
  "utf8"
);
const floor = readFileSync(
  new URL("../client/src/components/ClubFloor3D.tsx", import.meta.url),
  "utf8"
);

for (const mode of ["club", "sound-system"]) {
  assert.match(css, new RegExp(`data-systm-mode=["']${mode}["']`));
}
for (const token of [
  "--scene-bg",
  "--surface",
  "--surface-secondary",
  "--border",
  "--text",
  "--text-muted",
  "--grid",
  "--control-active",
]) {
  assert.ok(css.includes(token), `${token} is a mode theme token`);
}
assert.match(home, /data-systm-mode=\{mode\}/);
assert.match(css, /280ms ease/);
assert.match(guideCss, /pointer-events: none/);
assert.match(guideCss, /\.product-guide-skip[\s\S]*pointer-events: auto/);
assert.match(guideCss, /\.onboarding-club-listener \.listener-name-wrapper/);
assert.match(floor, /wrapperClass="listener-name-wrapper"/);
assert.match(floor, /mode === "club" \? 32 : 52/);

assert.deepEqual(
  CABINET_COLOR_PRESETS.map(preset => preset.label),
  ["GRAPHITE", "ASH", "OFF WHITE", "RAW GRAY"]
);
assert.equal(normalizeCabinetColor("#AABBCC"), "#aabbcc");
assert.equal(normalizeCabinetColor("red"), "#3f423f");
assert.equal(isGlbCabinetShellName("Cabinet"), true);
assert.equal(isGlbCabinetShellName("Cabinet_Side"), true);
assert.equal(isGlbCabinetShellName("EmitterLow"), false);
assert.equal(isGlbCabinetShellName("WooferCone"), false);
assert.match(glb, /cabinetShells/);
assert.match(glb, /namedEmitters/);
assert.match(glb, /material\.color\.copy\(color\)/);
assert.match(glb, /material\.emissive\.copy\(color\)/);
assert.match(procedural, /cabinet: new THREE\.MeshStandardMaterial\(\{ color: cabinetColor/);
assert.match(procedural, /hornEmitter: createEmitterMaterial\(\)/);
assert.match(procedural, /wooferEmitter: createEmitterMaterial\(\)/);

const eq = createDefaultEq();
const speakers: ClubSpeaker[] = [
  {
    id: "root",
    kind: "sub",
    modelId: "modern-sub",
    label: "Root",
    position: { x: 0.4, y: 0.5, z: 0 },
    orientation: { yaw: 0 },
    cabinetColor: "#3f423f",
    stackParentId: null,
    level: 0.7,
    muted: false,
    responseProfileId: "modern-sub",
    activity: 0,
    eq,
  },
  {
    id: "child",
    kind: "woofer",
    modelId: "modern-woofer",
    label: "Child",
    position: { x: 0.4, y: 0.5, z: 0 },
    orientation: { yaw: 0 },
    cabinetColor: "#777b78",
    stackParentId: "root",
    level: 0.7,
    muted: false,
    responseProfileId: "modern-woofer",
    activity: 0,
    eq,
  },
  {
    id: "other",
    kind: "high",
    modelId: "modern-high",
    label: "Other",
    position: { x: 0.6, y: 0.5, z: 0 },
    orientation: { yaw: 0 },
    cabinetColor: "#989a96",
    stackParentId: null,
    level: 0.7,
    muted: false,
    responseProfileId: "modern-high",
    activity: 0,
    eq,
  },
];

assert.deepEqual([...cabinetColorTargetIds(speakers, "child", "this")], ["child"]);
assert.deepEqual(
  [...cabinetColorTargetIds(speakers, "child", "stack")].sort(),
  ["child", "root"]
);
assert.deepEqual(
  [...cabinetColorTargetIds(speakers, "child", "all")].sort(),
  ["child", "other", "root"]
);

const layout = createLayoutFile({ speakers });
const parsed = parseLayoutFile(JSON.stringify(layout));
const restored = layoutToClubSpeakers(parsed, 1);
assert.deepEqual(
  restored.map(speaker => speaker.cabinetColor),
  speakers.map(speaker => speaker.cabinetColor),
  "cabinet colors survive layout persistence"
);

const scenes = createInitialSceneStateMap();
scenes.club.speakers = [{ ...speakers[0], cabinetColor: "#d8d6ce" }];
assert.equal(scenes["sound-system"].speakers.length, 0);
assert.equal(demoModeFromSearch("?demo=club"), "club");
assert.equal(demoModeFromSearch("?demo=sound-system"), "sound-system");
assert.match(home, /isDemo[\s\S]*\? "paper"/);

console.log("visual polish and cabinet color tests passed");
