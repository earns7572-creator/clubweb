import assert from "node:assert/strict";
import { createLayoutFile, layoutToClubSpeakers, layoutToPresetData, layoutToSupportBlocks, parseLayoutFile, serializeLayout } from "../client/src/lib/layoutFile";
import type { ClubListener, ClubSpeaker } from "../client/src/hooks/useClubAudio";
import { BLOCK_HEIGHT_METERS, createBlockResolver, syncSpeakerSupportPositions, type SupportBlock } from "../client/src/lib/blockSupport";
import { createStackResolver } from "../client/src/lib/speakerStacking";

const speaker = (id: string, modelId: ClubSpeaker["modelId"], stackParentId: string | null = null): ClubSpeaker => ({ id, modelId, kind: modelId === "freeparty-mid-horn" ? "mid" : "sub", label: id, position: id === "one" ? { x: .31, y: .42, z: .13 } : { x: .31, y: .42, z: .67 }, orientation: { yaw: id === "one" ? .26 : -.26 }, stackParentId, ...(stackParentId ? { stackAlign: "right" } : {}), level: id === "one" ? .81 : .66, muted: false, responseProfileId: modelId ?? "modern-sub", activity: 0, eq: { low: { frequency: 90, gainDb: 0 }, lowMid: { frequency: 350, gainDb: 0, q: 1 }, highMid: { frequency: 2200, gainDb: 0, q: 1 }, high: { frequency: 8500, gainDb: 0 } } });
const listener: ClubListener = { name: "Listener", position: { x: .55, y: .66, z: .22 }, orientation: { yaw: .4, pitch: -.2 } };
const block = (id: string, x: number, y: number, stackParentId: string | null = null): SupportBlock => ({ id, label: "BLOCK", position: { x, y }, stackParentId, orientation: { yaw: .12 }, dimensions: { width: 1.2, height: BLOCK_HEIGHT_METERS, depth: 1.2 }, color: "#9b8d78" });
const layout = createLayoutFile({ speakers: [speaker("one", "freeparty-wbin"), speaker("two", "freeparty-mid-horn", "one")], listener, surfaceTone: "night" });
const parsed = parseLayoutFile(serializeLayout({ speakers: [speaker("one", "freeparty-wbin"), speaker("two", "freeparty-mid-horn", "one")], listener, surfaceTone: "night" }));

assert.equal(parsed.speakers.length, 2); assert.equal(parsed.speakers[1].modelId, "freeparty-mid-horn"); assert.equal(parsed.speakers[0].x, .31); assert.equal(parsed.speakers[0].y, .42); assert.equal(parsed.speakers[0].z, .13); assert.equal(parsed.speakers[0].yaw, .26); assert.equal(parsed.speakers[1].stackOn, "speaker-01"); assert.equal(parsed.speakers[1].stackAlign, "right"); assert.deepEqual(parsed.listener, { x: .55, y: .66, z: .22, yaw: .4, pitch: -.2 });
const restored = layoutToClubSpeakers(parsed, 123); assert.equal(restored[1].stackParentId, restored[0].id); assert.equal(restored[1].stackAlign, "right"); assert.equal(restored[1].orientation?.yaw, -.26);
assert.equal(layoutToPresetData(parsed)[1].stackAlign, "right", "Copy Preset Data includes stack alignment");
for (const stackAlign of ["left", "center", "right"] as const) { const value = structuredClone(layout); value.speakers[1].stackAlign = stackAlign; const roundTrip = layoutToClubSpeakers(parseLayoutFile(JSON.stringify(value)), 456); assert.equal(roundTrip[1].stackAlign, stackAlign, `${stackAlign} layout roundtrip`); }
const legacy = structuredClone(layout); delete legacy.speakers[1].stackAlign; assert.equal(layoutToClubSpeakers(parseLayoutFile(JSON.stringify(legacy)), 789)[1].stackAlign, "center", "legacy stack alignment defaults to center");

const invalid = (update: (value: any) => void) => { const value = structuredClone(layout); update(value); assert.throws(() => parseLayoutFile(JSON.stringify(value))); };
invalid((value) => { value.schema = "other"; }); invalid((value) => { value.version = 2; }); invalid((value) => { value.speakers[0].modelId = "unknown"; }); invalid((value) => { value.speakers[1].key = "speaker-01"; }); invalid((value) => { value.speakers[0].stackOn = "speaker-01"; }); invalid((value) => { value.speakers[1].stackAlign = "diagonal"; }); invalid((value) => { value.speakers[0].stackAlign = "left"; }); invalid((value) => { value.speakers[0].stackOn = "speaker-02"; value.speakers[1].stackOn = "speaker-01"; }); invalid((value) => { value.speakers = Array.from({ length: 17 }, (_, index) => ({ ...value.speakers[0], key: `speaker-${String(index + 1).padStart(2, "0")}` })); });
assert.throws(() => parseLayoutFile("not json"));

const floorBlock = block("floor-block", .28, .34);
const floorRoundTrip = parseLayoutFile(serializeLayout({ speakers: [speaker("one", "freeparty-wbin")], blocks: [floorBlock] }));
const restoredFloorBlocks = layoutToSupportBlocks(floorRoundTrip, 100);
assert.equal(restoredFloorBlocks.length, 1, "BLOCK on floor roundtrips");
assert.deepEqual(restoredFloorBlocks[0].position, floorBlock.position, "floor BLOCK position roundtrips");
assert.equal(restoredFloorBlocks[0].orientation?.yaw, floorBlock.orientation?.yaw, "BLOCK rotation roundtrips");
assert.deepEqual(restoredFloorBlocks[0].dimensions, floorBlock.dimensions, "BLOCK dimensions roundtrip");

const upperBlock = block("upper-block", .28, .34, "floor-block");
const stackedBlocksLayout = parseLayoutFile(serializeLayout({ speakers: [speaker("one", "freeparty-wbin")], blocks: [floorBlock, upperBlock] }));
const restoredStackBlocks = layoutToSupportBlocks(stackedBlocksLayout, 101);
const restoredBlockResolver = createBlockResolver(restoredStackBlocks);
assert.equal(restoredBlockResolver.getBottomMeters(restoredStackBlocks[1]), BLOCK_HEIGHT_METERS, "BLOCK on BLOCK support relationship roundtrips");

const supportedSpeaker = { ...speaker("one", "freeparty-wbin"), supportBlockId: floorBlock.id };
const speakerOnBlockLayout = parseLayoutFile(serializeLayout({ speakers: [supportedSpeaker], blocks: [floorBlock] }));
const restoredSupportedSpeaker = syncSpeakerSupportPositions(layoutToClubSpeakers(speakerOnBlockLayout, 102), layoutToSupportBlocks(speakerOnBlockLayout, 102))[0];
assert.equal(restoredSupportedSpeaker.supportBlockId, "block-102-0", "speaker support relationship roundtrips");
assert.equal(restoredSupportedSpeaker.position.z, BLOCK_HEIGHT_METERS / 6, "speaker height is restored from BLOCK support");

const stackedSpeaker = { ...speaker("two", "freeparty-mid-horn", "one"), supportBlockId: floorBlock.id };
const speakerStackOnBlockLayout = parseLayoutFile(serializeLayout({ speakers: [supportedSpeaker, stackedSpeaker], blocks: [floorBlock] }));
const restoredStackOnBlockBlocks = layoutToSupportBlocks(speakerStackOnBlockLayout, 103);
const restoredStackOnBlockSpeakers = syncSpeakerSupportPositions(layoutToClubSpeakers(speakerStackOnBlockLayout, 103), restoredStackOnBlockBlocks);
const restoredSpeakerStack = createStackResolver(restoredStackOnBlockSpeakers);
assert.equal(restoredSpeakerStack.getBottomMeters(restoredStackOnBlockSpeakers[1]), restoredSpeakerStack.getBottomMeters(restoredStackOnBlockSpeakers[0]) + .9, "speaker stack on BLOCK restores physical height");

const oldLayout = parseLayoutFile(serializeLayout({ speakers: [speaker("one", "freeparty-wbin")], listener }));
assert.equal(oldLayout.blocks, undefined, "old layout without BLOCK data remains valid");
assert.deepEqual(layoutToSupportBlocks(oldLayout, 104), [], "old layout restores with no BLOCKs");
assert.equal(layoutToClubSpeakers(oldLayout, 104)[0].position.z, .13, "old layout speaker elevation remains intact");

const hiddenReleaseModelIds = ["reggae-scoop", "reggae-kick", "reggae-mid-horn", "reggae-top", "freeparty-wbin", "freeparty-kick-horn", "freeparty-mid-horn", "freeparty-top", "festival-sub", "festival-line-array", "festival-front-fill", "hifi-woofer", "hifi-mid-horn", "hifi-tweeter", "steppers-reflex-sub", "steppers-kick", "steppers-mid", "steppers-top"] as const;
hiddenReleaseModelIds.forEach((modelId, index) => {
  const hiddenLayout = parseLayoutFile(serializeLayout({ speakers: [speaker(`hidden-${index}`, modelId)], listener }));
  const restoredHiddenSpeaker = layoutToClubSpeakers(hiddenLayout, 200 + index)[0];
  assert.equal(restoredHiddenSpeaker.modelId, modelId, `${modelId} remains loadable from a legacy layout`);
});
console.log("layout file tests passed");
