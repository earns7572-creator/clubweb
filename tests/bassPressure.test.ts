import assert from "node:assert/strict";
import type { ClubListener, ClubSpeaker, SpeakerKind } from "../client/src/hooks/useClubAudio";
import { calculateBassPressure, getBandEnergy, vibrationFromPressure } from "../client/src/lib/bassPressure";

const listener: ClubListener = { position: { x: .5, y: .5, z: 0 }, orientation: { yaw: 0, pitch: 0 } };
const speaker = (id: string, kind: SpeakerKind, x: number, y: number, muted = false) => ({ id, kind, muted, position: { x, y, z: 0 }, level: 1 } as ClubSpeaker);
const closeSub = speaker("sub-close", "sub", .5, .53);
const farSub = speaker("sub-far", "sub", .08, .08);
const highOnly = speaker("high", "high", .5, .53);

const frequencyData = new Uint8Array(512); for (let index = 0; index <= 4; index += 1) frequencyData[index] = 255;
const analyser = { getByteFrequencyData: (target: Uint8Array) => target.set(frequencyData) } as unknown as AnalyserNode;
assert.ok(getBandEnergy(analyser, new Uint8Array(512), 48_000) > .99, "20–160 Hz band energy should read low bins");

const nearPressure = calculateBassPressure([closeSub], { "sub-close": .8 }, listener);
const farPressure = calculateBassPressure([farSub], { "sub-far": .8 }, listener);
const fourPressure = calculateBassPressure([0, 1, 2, 3].map((index) => speaker(`sub-${index}`, "sub", .5 + index * .012, .53)), { "sub-0": .8, "sub-1": .8, "sub-2": .8, "sub-3": .8 }, listener);
assert.ok(nearPressure > farPressure, "near sub should generate more pressure than distant sub");
assert.ok(fourPressure > nearPressure && fourPressure < 1, "multiple nearby subs should rise but saturate safely");
assert.equal(calculateBassPressure([highOnly], { high: 1 }, listener), 0, "high-only playback must not vibrate POV");
assert.equal(calculateBassPressure([speaker("muted-sub", "sub", .5, .53, true)], { "muted-sub": 1 }, listener), 0, "muted sub must not vibrate POV");
assert.equal(vibrationFromPressure(.08), 0, "threshold prevents constant micro vibration");
assert.ok(vibrationFromPressure(nearPressure) > 0, "audible nearby sub pressure should exceed vibration threshold");

console.log("bass pressure tests passed");
