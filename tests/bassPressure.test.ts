import assert from "node:assert/strict";
import type { ClubListener, ClubSpeaker, SpeakerKind } from "../client/src/hooks/useClubAudio";
import { bassDistanceWeight, bassEnergy, calculateBassPressure, getBandEnergy, LOW_ACTIVITY_GATE, SUB_BAND_HZ, UPPER_BASS_BAND_HZ, UPPER_BASS_WEIGHT, VIBRATION_THRESHOLD, vibrationFromPressure } from "../client/src/lib/bassPressure";

const listener: ClubListener = { position: { x: .5, y: .5, z: 0 }, orientation: { yaw: 0, pitch: 0 } };
const speaker = (id: string, kind: SpeakerKind, x: number, y: number, muted = false) => ({ id, kind, muted, position: { x, y, z: 0 }, level: 1 } as ClubSpeaker);
const closeSub = speaker("sub-close", "sub", .5, .53);
const farSub = speaker("sub-far", "sub", .08, .08);
const highOnly = speaker("high", "high", .5, .53);
const midOnly = speaker("mid", "mid", .5, .53);
const fullOnly = speaker("full", "full", .5, .53);
const wooferOnly = speaker("woofer", "woofer", .5, .53);

const analyserFor = (data: Uint8Array) => ({ getByteFrequencyData: (target: Uint8Array) => target.set(data) } as unknown as AnalyserNode);
const subFrequencyData = new Uint8Array(512); subFrequencyData[1] = 255;
const upperFrequencyData = new Uint8Array(512); upperFrequencyData[3] = 255;
const quietFrequencyData = new Uint8Array(512); quietFrequencyData[1] = 4;
assert.ok(getBandEnergy(analyserFor(subFrequencyData), new Uint8Array(512), 48_000, SUB_BAND_HZ.low, SUB_BAND_HZ.high) > .5, "25–90 Hz source should register as sub pressure");
assert.ok(getBandEnergy(analyserFor(upperFrequencyData), new Uint8Array(512), 48_000, UPPER_BASS_BAND_HZ.low, UPPER_BASS_BAND_HZ.high) > .3, "90–160 Hz source should register as upper bass");
assert.ok(bassEnergy(analyserFor(subFrequencyData), new Uint8Array(512), 48_000) > bassEnergy(analyserFor(upperFrequencyData), new Uint8Array(512), 48_000), `upper bass must be weighted by ${UPPER_BASS_WEIGHT}`);
assert.equal(bassEnergy(analyserFor(quietFrequencyData), new Uint8Array(512), 48_000), 0, `energy under ${LOW_ACTIVITY_GATE} must gate to zero`);

const nearPressure = calculateBassPressure([closeSub], { "sub-close": .8 }, listener);
const farPressure = calculateBassPressure([farSub], { "sub-far": .8 }, listener);
const fourPressure = calculateBassPressure([0, 1, 2, 3].map((index) => speaker(`sub-${index}`, "sub", .5 + index * .012, .53)), { "sub-0": .8, "sub-1": .8, "sub-2": .8, "sub-3": .8 }, listener);
assert.ok(nearPressure > farPressure, "near sub should generate more pressure than distant sub");
assert.ok(fourPressure > nearPressure && fourPressure < 1, "multiple nearby subs should rise but saturate safely");
assert.equal(calculateBassPressure([highOnly], { high: 1 }, listener), 0, "high-only playback must not vibrate POV");
assert.equal(calculateBassPressure([midOnly], { mid: 1 }, listener), 0, "mid-only playback must not vibrate POV");
assert.ok(calculateBassPressure([wooferOnly], { woofer: .8 }, listener) > calculateBassPressure([fullOnly], { full: .8 }, listener), "woofer must contribute more pressure than full range");
assert.equal(calculateBassPressure([speaker("muted-sub", "sub", .5, .53, true)], { "muted-sub": 1 }, listener), 0, "muted sub must not vibrate POV");
assert.equal(vibrationFromPressure(VIBRATION_THRESHOLD), 0, "raised threshold prevents constant micro vibration");
assert.ok(vibrationFromPressure(nearPressure) > 0, "audible nearby sub pressure should exceed vibration threshold");
const floorSub = speaker("floor-sub", "sub", .5, .5);
const stackedFull = { ...speaker("stacked-full", "full", .5, .5), stackParentId: "floor-sub" };
const looseFull = speaker("loose-full", "full", .5, .5);
assert.ok(bassDistanceWeight(stackedFull, [floorSub, stackedFull], listener) < bassDistanceWeight(looseFull, [looseFull], listener), "stacked speaker distance must use elevated audio center");

console.log("bass pressure tests passed");
