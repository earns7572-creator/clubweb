const assert = require("node:assert/strict");

const { MASTER_BASE_GAIN, MASTER_DYNAMICS, activeSpeakerCount, masterGainForSpeakerCount, masterGainForSpeakers } = require(process.argv[2]);
const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-12, message);

close(masterGainForSpeakerCount(1), MASTER_BASE_GAIN, "one speaker keeps the existing master reference gain");
close(masterGainForSpeakerCount(2), MASTER_BASE_GAIN / Math.sqrt(2), "two speakers use equal-power staging");
close(masterGainForSpeakerCount(4), MASTER_BASE_GAIN / 2, "four speakers remain below the unnormalized sum");
close(masterGainForSpeakerCount(8), MASTER_BASE_GAIN / Math.sqrt(8), "eight speakers remain below the unnormalized sum");
assert.ok(masterGainForSpeakerCount(8) < masterGainForSpeakerCount(4), "master staging decreases as parallel paths increase");
assert.equal(activeSpeakerCount([{ muted: false }, { muted: true }, { muted: false }]), 2, "muted cabinets do not consume shared master headroom");
close(masterGainForSpeakers([{ muted: false }, { muted: false }, { muted: false }, { muted: false }]), MASTER_BASE_GAIN / 2, "speaker staging is derived from active cabinet count");
assert.deepEqual(MASTER_DYNAMICS, { thresholdDb: -6, kneeDb: 12, ratio: 2.5, attackSeconds: .008, releaseSeconds: .18 }, "master dynamics are peak protection, not heavy constant compression");

console.log("audio gain staging tests passed");
