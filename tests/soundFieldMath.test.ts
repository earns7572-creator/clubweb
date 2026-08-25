import assert from "node:assert/strict";
import { combineSoundContributions, directivityFactor, distanceFactor, soundFieldContribution } from "../client/src/lib/soundFieldMath";

const sub = { innerAngle: 300, outerAngle: 360, outerGain: 0.75, visualRangeMeters: 8 };
const horn = { innerAngle: 60, outerAngle: 100, outerGain: 0.12, visualRangeMeters: 10 };

assert.equal(soundFieldContribution({ activity: 0, distanceMeters: 2, angleRadians: 0, directivity: horn }), 0);
assert.ok(directivityFactor(0, horn) > 0.99);
assert.ok(directivityFactor(Math.PI, horn) <= 0.121);
assert.ok(directivityFactor(Math.PI, sub) >= 0.74);
assert.ok(directivityFactor(Math.PI / 2, sub) > directivityFactor(Math.PI / 2, horn));
assert.ok(distanceFactor(2) > distanceFactor(8));

const one = combineSoundContributions([0.5]);
const two = combineSoundContributions([0.5, 0.5]);
const four = combineSoundContributions([0.5, 0.5, 0.5, 0.5]);

assert.ok(two > one);
assert.ok(four > two);
assert.ok(four < 1);

console.log("sound field math tests passed");
