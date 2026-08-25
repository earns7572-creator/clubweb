import assert from "node:assert/strict";
import { SWEEP_END_HZ, SWEEP_LEG_DURATION_SECONDS, SWEEP_START_HZ, sweepLegTarget } from "../client/src/lib/sineSweep";

assert.ok(SWEEP_LEG_DURATION_SECONDS >= 12 && SWEEP_LEG_DURATION_SECONDS <= 15);
assert.equal(sweepLegTarget(0), SWEEP_END_HZ);
assert.equal(sweepLegTarget(1), SWEEP_START_HZ);
assert.equal(SWEEP_START_HZ, 20);
assert.equal(SWEEP_END_HZ, 20_000);
console.log("sine sweep tests passed");
