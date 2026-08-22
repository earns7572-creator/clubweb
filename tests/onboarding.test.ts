import assert from "node:assert/strict";
import { isSupportedMusicFile } from "../client/src/lib/onboarding";

assert.equal(isSupportedMusicFile({ name: "set.mp3", type: "audio/mpeg" }), true);
assert.equal(isSupportedMusicFile({ name: "set.WAV", type: "audio/wav" }), true);
assert.equal(isSupportedMusicFile({ name: "set.m4a", type: "audio/mp4" }), false);
console.log("onboarding tests passed");
