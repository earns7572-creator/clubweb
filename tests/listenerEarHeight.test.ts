import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { listenerEarHeightMeters, sceneToAudioPosition } from "../client/src/lib/spatialCoordinates";

const approximately = (actual: number, expected: number, label: string) => assert.ok(Math.abs(actual - expected) < 1e-9, `${label}: expected ${expected}, received ${actual}`);

approximately(listenerEarHeightMeters(0), 1.10, "floor-normalized listener height maps to 1.10m ear height");
approximately(listenerEarHeightMeters(.5), 1.65, "default listener height maps to 1.65m ear height");
approximately(listenerEarHeightMeters(1), 2.20, "high-normalized listener height maps to 2.20m ear height");
approximately(sceneToAudioPosition({ x: .5, y: .5, z: .5 }).y, 1.65, "Audio listener default height uses the shared ear-height mapping");

const pov = readFileSync(new URL("../client/src/components/PovPreview.tsx", import.meta.url), "utf8");
assert.match(pov, /listenerEarHeightMeters\(listener\.position\.z\)/, "POV camera height uses the shared listener ear-height helper");

console.log("listener ear height tests passed");
