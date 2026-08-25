import assert from "node:assert/strict";
import * as THREE from "three";
import { writeDeviceOrientationQuaternion, writeRelativeDeviceLook } from "../client/src/lib/deviceOrientation";

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

const relative = new THREE.Quaternion();
const forward = new THREE.Vector3();
const look = { yaw: 0, pitch: 0 };
const poseFor = (screen: number, alpha: number, beta: number, gamma: number) => { const output = new THREE.Quaternion(); writeDeviceOrientationQuaternion(output, alpha, beta, gamma, screen); return output; };
const neutralPortrait = poseFor(0, 0, 0, 0);
assert.ok(writeRelativeDeviceLook(look, neutralPortrait, poseFor(0, 0, 0, 20), relative, forward).yaw < 0, "portrait: phone left must look left");
assert.ok(writeRelativeDeviceLook(look, neutralPortrait, poseFor(0, 0, 20, 0), relative, forward).pitch > 0, "portrait: phone up must look up");
const neutralLandscapeLeft = poseFor(90, 0, 0, 0);
assert.ok(writeRelativeDeviceLook(look, neutralLandscapeLeft, poseFor(90, 0, 20, 0), relative, forward).yaw < 0, "landscape-left preserves left look");
const neutralLandscapeRight = poseFor(-90, 0, 0, 0);
assert.ok(writeRelativeDeviceLook(look, neutralLandscapeRight, poseFor(-90, 0, 0, 20), relative, forward).pitch > 0, "landscape-right preserves up look");
const recentered = poseFor(0, 0, 11, -17);
const afterRecenter = writeRelativeDeviceLook(look, recentered, recentered, relative, forward);
closeTo(afterRecenter.yaw, 0); closeTo(afterRecenter.pitch, 0);

console.log("device orientation tests passed");
