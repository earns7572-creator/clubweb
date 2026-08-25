import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createDefaultEq } from "../client/src/lib/speakerEq";
import { getSpeakerModel, modelIdsForFamily, orderedSpeakerFamilies, resolveModelId, SPEAKER_FAMILIES, SPEAKER_MODELS } from "../client/src/lib/speakerModels";
import { FREEPARTY_WALL, REGGAE_WALL, SYSTEM_PRESETS } from "../client/src/lib/systemPresets";
import { speakerFilters } from "../client/src/lib/responseCurve";
import { createStackResolver, STACK_ROOM_METERS } from "../client/src/lib/speakerStacking";
import { speakerBodyForSpeaker } from "../client/src/lib/speakerDimensions";

assert.equal(resolveModelId(undefined, "full"), "modern-full", "legacy speaker without modelId falls back to modern kind");
assert.equal(getSpeakerModel("reggae-scoop", "sub").family, "reggae", "scoop remains in reggae family");
assert.equal(getSpeakerModel("reggae-scoop", "sub").kind, "sub", "scoop uses existing sub acoustic role");
assert.equal(modelIdsForFamily("modern").length, 5, "all modern models remain available");
assert.equal(modelIdsForFamily("reggae").length, 4, "all reggae models are available");
assert.equal(modelIdsForFamily("freeparty").length, 4, "all Free Party models are available");
assert.equal(modelIdsForFamily("festival").length, 3, "all Festival models are available");
assert.equal(modelIdsForFamily("hifi").length, 3, "all Hi-Fi models are available");
assert.equal(modelIdsForFamily("steppers").length, 4, "all Steppers models are available");
assert.deepEqual(orderedSpeakerFamilies().map((family) => family.id), ["reggae", "freeparty", "modern", "festival", "hifi", "steppers"], "the six scene registry order is stable");
assert.equal(Object.keys(SPEAKER_FAMILIES).length, 6, "six sound system families are registered");
const glbManifest = JSON.parse(readFileSync(new URL("../client/public/models/speakers/manifest.json", import.meta.url), "utf8"));
for (const family of orderedSpeakerFamilies()) {
  const models = modelIdsForFamily(family.id);
  assert.ok(models.length > 0, `${family.label} has at least one speaker model`);
  models.forEach((id) => {
    const model = SPEAKER_MODELS[id];
    assert.equal(model.family, family.id, `${id} belongs to its registered family`);
    assert.ok(model.body.width > 0 && model.body.height > 0 && model.body.depth > 0, `${id} has physical dimensions`);
    assert.ok(model.directivity.innerAngle > 0 && model.directivity.innerAngle <= 360, `${id} has a valid inner directivity angle`);
    assert.ok(model.directivity.outerAngle >= model.directivity.innerAngle && model.directivity.outerAngle <= 360, `${id} has a valid outer directivity angle`);
    assert.ok(model.directivity.outerGain >= 0 && model.directivity.outerGain <= 1, `${id} has a valid outside gain`);
    assert.ok(model.directivity.visualRangeMeters > 0, `${id} has a positive visual range`);
    assert.ok(model.visual.plannedGlbPath.endsWith(".glb"), `${id} declares its future GLB contract path`);
    if (family.id === "modern" || family.id === "reggae") {
      assert.equal(model.visual.renderer, "procedural", `${id} preserves its approved procedural visual`);
    } else {
      assert.equal(model.visual.renderer, "glb", `${id} uses the repaired local GLB library`);
    }
    if (model.visual.renderer === "glb") {
      assert.ok(model.visual.src.startsWith("/models/speakers/"), `${id} uses a repository-owned GLB URL`);
      assert.ok(Object.values(model.visual.emitterMeshes ?? {}).flat().length > 0, `${id} maps one or more activity emitters`);
      assert.deepEqual(glbManifest[model.visual.plannedGlbPath]?.body, model.body, `${id} GLB target mirrors SpeakerModelDefinition.body`);
      assert.equal(glbManifest[model.visual.plannedGlbPath]?.validation, "pass", `${id} GLB passed post-export reload validation`);
      Object.values(model.visual.emitterMeshes ?? {}).flat().forEach((emitter) => assert.ok(glbManifest[model.visual.plannedGlbPath]?.emitters.includes(emitter), `${id} GLB contains mapped ${emitter}`));
    }
  });
}
assert.ok(SPEAKER_MODELS["modern-sub"].directivity.innerAngle > SPEAKER_MODELS["modern-high"].directivity.innerAngle, "Modern Sub is wider than Modern High");
assert.ok(SPEAKER_MODELS["reggae-scoop"].directivity.innerAngle > SPEAKER_MODELS["reggae-mid-horn"].directivity.innerAngle, "Reggae Scoop is wider than Reggae Mid Horn");
assert.ok(SPEAKER_MODELS["freeparty-wbin"].directivity.innerAngle > SPEAKER_MODELS["freeparty-top"].directivity.innerAngle, "Free Party W-Bin is wider than Free Party Top");
assert.deepEqual(SPEAKER_MODELS["modern-full"].fieldComponents.map((component) => component.band), ["low", "mid", "high"], "Modern Full Range has nested low, mid and high field components");
assert.deepEqual(SPEAKER_MODELS["festival-line-array"].fieldComponents.map((component) => component.band), ["mid", "high"], "Festival Line Array has mid and high field components");
assert.deepEqual(SPEAKER_MODELS["festival-front-fill"].fieldComponents.map((component) => component.band), ["mid", "high"], "Festival Front Fill has mid and high field components");
assert.ok(SPEAKER_MODELS["reggae-scoop"].body.height > SPEAKER_MODELS["reggae-kick"].body.height, "scoop physical body is taller than kick");
assert.equal(REGGAE_WALL.speakers.length, 8, "Reggae Sound System preset has two four-way stacks");
assert.equal(REGGAE_WALL.speakers.filter((speaker) => !speaker.stackOn).length, 2, "preset has two floor roots");
assert.equal(REGGAE_WALL.speakers.filter((speaker) => speaker.stackOn).length, 6, "preset defines six stacked cabinets");
const eq = createDefaultEq();
const frontPlane = (speaker: typeof presetScene[number], referenceYaw: number, resolver: ReturnType<typeof createStackResolver>) => {
  const point = resolver.getXY(speaker); const yaw = speaker.orientation?.yaw ?? 0; const body = speakerBodyForSpeaker(speaker);
  return point.x * STACK_ROOM_METERS.width * Math.sin(referenceYaw) + point.y * STACK_ROOM_METERS.depth * Math.cos(referenceYaw) + body.depth / 2 * Math.cos(yaw - referenceYaw);
};
const presetIds = new Map(REGGAE_WALL.speakers.map((item) => [item.key, `preset-${item.key}`]));
const presetScene = REGGAE_WALL.speakers.map((item) => ({ id: presetIds.get(item.key)!, kind: SPEAKER_MODELS[item.modelId].kind, modelId: item.modelId, label: item.key, position: { x: item.x, y: item.y, z: 0 }, stackParentId: item.stackOn ? presetIds.get(item.stackOn) : null, level: item.level, muted: false, responseProfileId: item.modelId, activity: 0, eq }));
const presetResolver = createStackResolver(presetScene);
const leftScoop = presetScene.find((speaker) => speaker.id === presetIds.get("left-scoop"))!;
const leftKick = presetScene.find((speaker) => speaker.id === presetIds.get("left-kick"))!;
const leftTop = presetScene.find((speaker) => speaker.id === presetIds.get("left-top"))!;
assert.equal(presetResolver.getBottomMeters(leftKick), speakerBodyForSpeaker(leftScoop).height, "kick rests on scoop model height");
assert.equal(presetResolver.getBottomMeters(leftTop), speakerBodyForSpeaker(leftScoop).height + speakerBodyForSpeaker(leftKick).height + speakerBodyForSpeaker(presetScene.find((speaker) => speaker.id === presetIds.get("left-mid"))!).height, "top inherits full physical reggae stack height");
assert.equal(presetResolver.getXY(leftTop).x, .36, "top keeps its centered horizontal column coordinate");
assert.ok(presetResolver.getXY(leftTop).y > .36, "top derives its front-flush depth from the stack chain");
for (const child of [leftKick, presetScene.find((speaker) => speaker.id === presetIds.get("left-mid"))!, leftTop]) {
  const parent = presetResolver.byId.get(child.stackParentId!)!;
  assert.ok(Math.abs(frontPlane(child, parent.orientation?.yaw ?? 0, presetResolver) - frontPlane(parent, parent.orientation?.yaw ?? 0, presetResolver)) < 1e-9, `Reggae ${child.label} front plane flushes with its parent`);
}

assert.equal(SYSTEM_PRESETS.length, 6, "one preset is available for every sound system scene");
SYSTEM_PRESETS.forEach((preset) => {
  assert.ok(preset.speakers.length <= 16, `${preset.name} respects the 16-speaker preset limit`);
  assert.ok(SPEAKER_FAMILIES[preset.family], `${preset.name} refers to a registered family`);
  const byKey = new Map(preset.speakers.map((speaker) => [speaker.key, speaker]));
  preset.speakers.forEach((speaker) => {
    const model = SPEAKER_MODELS[speaker.modelId];
    assert.ok(model, `${preset.name}: ${speaker.modelId} is a valid model id`);
    assert.equal(model.family, preset.family, `${preset.name}: ${speaker.modelId} belongs to preset family`);
    const visited = new Set<string>();
    let current = speaker;
    while (current.stackOn) {
      assert.ok(!visited.has(current.key), `${preset.name}: ${speaker.key} does not participate in a stack cycle`);
      visited.add(current.key);
      const parent = byKey.get(current.stackOn);
      assert.ok(parent, `${preset.name}: ${current.key} only stacks on a preset speaker`);
      current = parent;
    }
  });
  const ids = new Map(preset.speakers.map((speaker) => [speaker.key, `${preset.id}-${speaker.key}`]));
  const scene = preset.speakers.map((speaker) => ({ id: ids.get(speaker.key)!, kind: SPEAKER_MODELS[speaker.modelId].kind, modelId: speaker.modelId, label: speaker.key, position: { x: speaker.x ?? .5, y: speaker.y ?? .5, z: speaker.z ?? 0 }, stackParentId: speaker.stackOn ? ids.get(speaker.stackOn) : null, ...(speaker.stackOn ? { stackAlign: speaker.stackAlign ?? "center" } : {}), level: speaker.level, muted: false, responseProfileId: speaker.modelId, activity: 0, eq }));
  const resolver = createStackResolver(scene);
  scene.forEach((speaker) => {
    if (!speaker.stackParentId) return;
    const parent = resolver.byId.get(speaker.stackParentId)!;
    const gap = resolver.getBottomMeters(speaker) - (resolver.getBottomMeters(parent) + speakerBodyForSpeaker(parent).height);
    assert.ok(Math.abs(gap) < 1e-9, `${preset.label}: ${speaker.label} rests directly on its parent`);
    assert.ok(Math.abs(frontPlane(speaker, parent.orientation?.yaw ?? 0, resolver) - frontPlane(parent, parent.orientation?.yaw ?? 0, resolver)) < 1e-9, `${preset.label}: ${speaker.label} front flushes with its parent`);
  });
});
assert.equal(FREEPARTY_WALL.speakers.length, 12, "Free Party Stack has three four-way columns");
assert.equal(FREEPARTY_WALL.speakers.filter((speaker) => !speaker.stackOn).length, 3, "Free Party Stack has three floor roots");
assert.equal(FREEPARTY_WALL.speakers.filter((speaker) => Boolean(speaker.stackOn)).length, 9, "Free Party Stack keeps nine resolver-positioned children");
assert.ok(FREEPARTY_WALL.speakers.filter((speaker) => speaker.stackOn).every((speaker) => speaker.x === undefined && speaker.y === undefined), "Free Party child coordinates remain resolver-derived");
assert.deepEqual(FREEPARTY_WALL.speakers.filter((speaker) => !speaker.stackOn).map(({ key, x, y, level }) => ({ key, x, y, level })), [
  { key: "left-wbin", x: .4090999702785325, y: .21316313088870198, level: .68 },
  { key: "center-wbin", x: .5, y: .21316313088870198, level: .88 },
  { key: "right-wbin", x: .5909000297214675, y: .21316313088870198, level: .88 },
], "Free Party floor roots preserve the user-exported baseline coordinates and levels");
assert.deepEqual(FREEPARTY_WALL.speakers.filter((speaker) => speaker.stackOn).map(({ key, stackOn, stackAlign }) => ({ key, stackOn, stackAlign })), [
  { key: "left-kick", stackOn: "left-wbin", stackAlign: "right" }, { key: "left-mid", stackOn: "left-kick", stackAlign: "right" }, { key: "left-top", stackOn: "left-mid", stackAlign: "center" },
  { key: "center-kick", stackOn: "center-wbin", stackAlign: "center" }, { key: "center-mid", stackOn: "center-kick", stackAlign: "center" }, { key: "center-top", stackOn: "center-mid", stackAlign: "center" },
  { key: "right-kick", stackOn: "right-wbin", stackAlign: "left" }, { key: "right-mid", stackOn: "right-kick", stackAlign: "left" }, { key: "right-top", stackOn: "right-mid", stackAlign: "center" },
], "Free Party Stack preserves the exported left, center and right alignment chains");

const modernFull = { id: "modern", kind: "full" as const, modelId: "modern-full" as const, label: "Full", position: { x: .5, y: .5, z: 0 }, level: 1, muted: false, responseProfileId: "modern-full", activity: 0, eq };
const scoop = { ...modernFull, id: "scoop", kind: "sub" as const, modelId: "reggae-scoop" as const, responseProfileId: "reggae-scoop" };
assert.equal(speakerFilters(modernFull).length, 5, "modern response uses one character filter plus four custom EQ bands");
assert.equal(speakerFilters(scoop).length, 7, "scoop response exposes its full three-filter character chain plus custom EQ");
assert.equal(speakerFilters(scoop)[0].frequency, 28, "scoop character response starts with the subsonic high-pass");

console.log("speaker model tests passed");
