const assert = require("node:assert/strict");
const { activityFromFrequencyData, SILENT_BAND_ACTIVITY, VISUAL_BAND_HZ } = require("../.tmp-band-activity.cjs");

const sampleRate = 48_000;
const tone = (hz) => { const data = new Uint8Array(512); data[Math.round(hz / (sampleRate / 2 / data.length))] = 255; return data; };
const assertDominantBand = (hz, expected) => {
  const activity = activityFromFrequencyData(tone(hz), sampleRate, .7);
  assert.ok(activity[expected] > .7, `${hz} Hz produces a strong ${expected} activity`);
  for (const band of ["low", "mid", "high"]) if (band !== expected) assert.ok(activity[band] < .02, `${hz} Hz does not leak visual activity into ${band}`);
  assert.equal(activity.overall, .7, `${hz} Hz preserves the overall envelope`);
};

assert.deepEqual(VISUAL_BAND_HZ, { low: { low: 20, high: 200 }, mid: { low: 200, high: 2000 }, high: { low: 2000, high: 20000 } }, "visual bands use the specified real frequency ranges");
assertDominantBand(100, "low");
assertDominantBand(1_000, "mid");
assertDominantBand(10_000, "high");
assert.deepEqual(activityFromFrequencyData(new Uint8Array(512), sampleRate, 0), SILENT_BAND_ACTIVITY, "silent analyser data produces zero visual activity for pause decay");
console.log("band activity tests passed");
