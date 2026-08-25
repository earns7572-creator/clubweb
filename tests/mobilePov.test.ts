import assert from "node:assert/strict";
import { recenterLookAnchor, swipeLookDelta } from "../client/src/lib/povLook";

const right = swipeLookDelta(390, 0, 390, 844);
const left = swipeLookDelta(-390, 0, 390, 844);
const up = swipeLookDelta(0, -844, 390, 844);
const down = swipeLookDelta(0, 844, 390, 844);
assert.ok(right.yaw > 0, "finger right must look right");
assert.ok(left.yaw < 0, "finger left must look left");
assert.ok(up.pitch > 0, "finger up must look up");
assert.ok(down.pitch < 0, "finger down must look down");
assert.ok(Math.abs(right.yaw) >= Math.PI / 2 && Math.abs(right.yaw) <= Math.PI * 2 / 3, "full-width swipe stays within the 90–120 degree target");
assert.deepEqual(recenterLookAnchor({ yaw: .42, pitch: -.18 }), { yaw: .42, pitch: -.18 }, "recenter keeps the visible look as the neutral anchor");

console.log("mobile POV tests passed");
