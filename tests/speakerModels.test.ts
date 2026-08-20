import assert from "node:assert/strict";
import { createDefaultEq } from "../client/src/lib/speakerEq";
import { getSpeakerModel, modelIdsForFamily, orderedSpeakerFamilies, resolveModelId, SPEAKER_FAMILIES, SPEAKER_MODELS } from "../client/src/lib/speakerModels";
import { REGGAE_WALL, SYSTEM_PRESETS } from "../client/src/lib/systemPresets";
import { speakerFilters } from "../client/src/lib/responseCurve";
import { createStackResolver } from "../client/src/lib/speakerStacking";
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
for (const family of orderedSpeakerFamilies()) {
  const models = modelIdsForFamily(family.id);
  assert.ok(models.length > 0, `${family.label} has at least one speaker model`);
  models.forEach((id) => {
    const model = SPEAKER_MODELS[id];
    assert.equal(model.family, family.id, `${id} belongs to its registered family`);
    assert.ok(model.body.width > 0 && model.body.height > 0 && model.body.depth > 0, `${id} has physical dimensions`);
    assert.ok(model.visual.plannedGlbPath.endsWith(".glb"), `${id} declares its future GLB contract path`);
    assert.equal(model.visual.renderer, "glb", `${id} uses a real GLB visual when the asset library is available`);
    if (model.visual.renderer === "glb") {
      assert.ok(model.visual.src.startsWith("/manus-storage/"), `${id} uses a deployment-safe GLB URL`);
      assert.ok(Object.values(model.visual.emitterMeshes ?? {}).flat().length > 0, `${id} maps one or more activity emitters`);
    }
  });
}
assert.ok(SPEAKER_MODELS["reggae-scoop"].body.height > SPEAKER_MODELS["reggae-kick"].body.height, "scoop physical body is taller than kick");
assert.equal(REGGAE_WALL.speakers.length, 8, "Reggae Sound System preset has two four-way stacks");
assert.equal(REGGAE_WALL.speakers.filter((speaker) => !speaker.stackOn).length, 2, "preset has two floor roots");
assert.equal(REGGAE_WALL.speakers.filter((speaker) => speaker.stackOn).length, 6, "preset defines six stacked cabinets");
const eq = createDefaultEq();
const presetIds = new Map(REGGAE_WALL.speakers.map((item) => [item.key, `preset-${item.key}`]));
const presetScene = REGGAE_WALL.speakers.map((item) => ({ id: presetIds.get(item.key)!, kind: SPEAKER_MODELS[item.modelId].kind, modelId: item.modelId, label: item.key, position: { x: item.x, y: item.y, z: 0 }, stackParentId: item.stackOn ? presetIds.get(item.stackOn) : null, level: item.level, muted: false, responseProfileId: item.modelId, activity: 0, eq }));
const presetResolver = createStackResolver(presetScene);
const leftScoop = presetScene.find((speaker) => speaker.id === presetIds.get("left-scoop"))!;
const leftKick = presetScene.find((speaker) => speaker.id === presetIds.get("left-kick"))!;
const leftTop = presetScene.find((speaker) => speaker.id === presetIds.get("left-top"))!;
assert.equal(presetResolver.getBottomMeters(leftKick), speakerBodyForSpeaker(leftScoop).height, "kick rests on scoop model height");
assert.equal(presetResolver.getBottomMeters(leftTop), speakerBodyForSpeaker(leftScoop).height + speakerBodyForSpeaker(leftKick).height + speakerBodyForSpeaker(presetScene.find((speaker) => speaker.id === presetIds.get("left-mid"))!).height, "top inherits full physical reggae stack height");
assert.deepEqual(presetResolver.getXY(leftTop), { x: .36, y: .36 }, "top inherits root column XY");

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
});

const modernFull = { id: "modern", kind: "full" as const, modelId: "modern-full" as const, label: "Full", position: { x: .5, y: .5, z: 0 }, level: 1, muted: false, responseProfileId: "modern-full", activity: 0, eq };
const scoop = { ...modernFull, id: "scoop", kind: "sub" as const, modelId: "reggae-scoop" as const, responseProfileId: "reggae-scoop" };
assert.equal(speakerFilters(modernFull).length, 5, "modern response uses one character filter plus four custom EQ bands");
assert.equal(speakerFilters(scoop).length, 7, "scoop response exposes its full three-filter character chain plus custom EQ");
assert.equal(speakerFilters(scoop)[0].frequency, 28, "scoop character response starts with the subsonic high-pass");

console.log("speaker model tests passed");
