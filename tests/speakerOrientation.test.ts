import assert from "node:assert/strict";
import { createStackResolver } from "../client/src/lib/speakerStacking";
import { degreesToYaw, snapYaw, speakerOrientationToAudioOrientation, yawToDegrees } from "../client/src/lib/speakerOrientation";
import { REGGAE_WALL } from "../client/src/lib/systemPresets";

const close = (actual: number, expected: number, message: string) => assert.ok(Math.abs(actual - expected) < .00001, message);
const forward = (degrees: number) => speakerOrientationToAudioOrientation(degreesToYaw(degrees));

assert.equal(yawToDegrees(degreesToYaw(135)), 135, "degree/radian conversion remains reversible");
assert.equal(yawToDegrees(snapYaw(degreesToYaw(22))), 15, "Shift rotation snaps to 15 degree increments");
for (const [degrees, x, z] of [[0, 0, 1], [90, 1, 0], [180, 0, -1], [-90, -1, 0]] as const) {
  const vector = forward(degrees); close(vector.x, x, `${degrees} degrees gives expected audio X`); close(vector.y, 0, `${degrees} degrees stays level`); close(vector.z, z, `${degrees} degrees gives expected audio Z`);
}

const speaker = (id: string, parent: string | null, yaw?: number) => ({ id, kind: "full" as const, label: id, position: { x: .4, y: .6, z: 0 }, orientation: { yaw: yaw ?? 0 }, stackParentId: parent, level: 1, muted: false, responseProfileId: "modern-full", activity: 0, eq: {} });
const base = speaker("base", null); const stacked = speaker("stacked", "base", Math.PI / 2);
const before = createStackResolver([base, stacked]).getXY(stacked);
const rotated = { ...stacked, orientation: { yaw: Math.PI } };
assert.deepEqual(createStackResolver([base, rotated]).getXY(rotated), before, "yaw updates preserve stack relationship and resolved position");
assert.ok(REGGAE_WALL.speakers.every((item) => (item.yaw ?? 0) === 0), "legacy preset entries without yaw resolve to zero");

console.log("speaker orientation tests passed");
