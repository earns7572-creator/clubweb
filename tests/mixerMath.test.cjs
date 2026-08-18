const assert = require("node:assert/strict");
const mixer = require(process.argv[2]);

const near = (actual, expected, epsilon = 0.0001) => assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} should be near ${expected}`);

near(mixer.linearToDb(1), 0);
near(mixer.dbToLinear(0), 1);
near(mixer.linearToDb(.5), -6.0206, .001);
near(mixer.dbToLinear(-6.0206), .5, .001);
assert.equal(mixer.dbToLinear(8), 1, "Fader must never add positive gain");
near(mixer.dbToLinear(-90), mixer.MIXER_MIN_LINEAR, .0000001);
near(mixer.faderPositionToDb(1), 0);
near(mixer.faderPositionToDb(0), mixer.MIXER_MIN_DB);
near(mixer.dbToFaderPosition(-6), mixer.dbToFaderPosition(-6));
assert.equal(mixer.formatDb(1), "0.0 dB");

const before = [-3, -5, -8];
const after = before.map((db) => Math.max(mixer.MIXER_MIN_DB, Math.min(mixer.MIXER_MAX_DB, db + 2)));
assert.deepEqual(after.map((db) => Math.round(db)), [-1, -3, -6], "Relative linked fader movement must preserve dB offsets");

console.log("mixer math tests passed");
