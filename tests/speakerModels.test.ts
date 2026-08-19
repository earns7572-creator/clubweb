import assert from "node:assert/strict";
import { createDefaultEq } from "../client/src/lib/speakerEq";
import { getSpeakerModel, modelIdsForFamily, resolveModelId, SPEAKER_MODELS } from "../client/src/lib/speakerModels";
import { REGGAE_WALL } from "../client/src/lib/systemPresets";
import { speakerFilters } from "../client/src/lib/responseCurve";
import { createStackResolver } from "../client/src/lib/speakerStacking";
import { speakerBodyForSpeaker } from "../client/src/lib/speakerDimensions";

assert.equal(resolveModelId(undefined, "full"), "modern-full", "legacy speaker without modelId falls back to modern kind");
assert.equal(getSpeakerModel("reggae-scoop", "sub").family, "reggae", "scoop remains in reggae family");
assert.equal(getSpeakerModel("reggae-scoop", "sub").kind, "sub", "scoop uses existing sub acoustic role");
assert.equal(modelIdsForFamily("modern").length, 5, "all modern models remain available");
assert.equal(modelIdsForFamily("reggae").length, 4, "all reggae models are available");
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

const modernFull = { id: "modern", kind: "full" as const, modelId: "modern-full" as const, label: "Full", position: { x: .5, y: .5, z: 0 }, level: 1, muted: false, responseProfileId: "modern-full", activity: 0, eq };
const scoop = { ...modernFull, id: "scoop", kind: "sub" as const, modelId: "reggae-scoop" as const, responseProfileId: "reggae-scoop" };
assert.equal(speakerFilters(modernFull).length, 5, "modern response uses one character filter plus four custom EQ bands");
assert.equal(speakerFilters(scoop).length, 7, "scoop response exposes its full three-filter character chain plus custom EQ");
assert.equal(speakerFilters(scoop)[0].frequency, 28, "scoop character response starts with the subsonic high-pass");

console.log("speaker model tests passed");
