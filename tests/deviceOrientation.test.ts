import assert from "node:assert/strict";
import * as THREE from "three";
import { writeDeviceOrientationQuaternion } from "../client/src/lib/deviceOrientation";

const closeTo = (actual: number, expected: number, epsilon = 1e-7) => assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} should be close to ${expected}`);

const neutral = new THREE.Quaternion();
writeDeviceOrientationQuaternion(neutral, 0, 0, 0, 0);
closeTo(neutral.length(), 1);

const portrait = new THREE.Quaternion();
const landscape = new THREE.Quaternion();
writeDeviceOrientationQuaternion(portrait, 32, 18, -11, 0);
writeDeviceOrientationQuaternion(landscape, 32, 18, -11, 90);
closeTo(portrait.length(), 1);
closeTo(landscape.length(), 1);
assert.ok(Math.abs(portrait.dot(landscape)) < .9999, "screen orientation compensation must change the resulting quaternion");

console.log("device orientation tests passed");
