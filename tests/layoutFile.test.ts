import assert from "node:assert/strict";
import { createLayoutFile, layoutToClubSpeakers, layoutToPresetData, parseLayoutFile, serializeLayout } from "../client/src/lib/layoutFile";
import type { ClubListener, ClubSpeaker } from "../client/src/hooks/useClubAudio";

const speaker = (id: string, modelId: ClubSpeaker["modelId"], stackParentId: string | null = null): ClubSpeaker => ({ id, modelId, kind: modelId === "freeparty-mid-horn" ? "mid" : "sub", label: id, position: id === "one" ? { x: .31, y: .42, z: .13 } : { x: .31, y: .42, z: .67 }, orientation: { yaw: id === "one" ? .26 : -.26 }, stackParentId, ...(stackParentId ? { stackAlign: "right" } : {}), level: id === "one" ? .81 : .66, muted: false, responseProfileId: modelId ?? "modern-sub", activity: 0, eq: { low: { frequency: 90, gainDb: 0 }, lowMid: { frequency: 350, gainDb: 0, q: 1 }, highMid: { frequency: 2200, gainDb: 0, q: 1 }, high: { frequency: 8500, gainDb: 0 } } });
const listener: ClubListener = { name: "Listener", position: { x: .55, y: .66, z: .22 }, orientation: { yaw: .4, pitch: -.2 } };
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
console.log("layout file tests passed");
