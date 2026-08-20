export const PROTECTED_FAMILIES = new Set(["modern", "reggae"]);

// These targets mirror SpeakerModelDefinition.body, the runtime source of truth.
export const SPEAKER_GLB_SPECS = [
  { id: "freeparty-wbin", family: "freeparty", path: "freeparty/w-bin.glb", body: [1.2, .9, 1.05], emitter: "EmitterLow", build: "wBin" },
  { id: "freeparty-kick-horn", family: "freeparty", path: "freeparty/kick-horn.glb", body: [1.1, .72, .9], emitter: "EmitterLow", build: "kickHorn" },
  { id: "freeparty-mid-horn", family: "freeparty", path: "freeparty/mid-horn.glb", body: [.9, .68, .65], emitter: "EmitterMid", build: "midHorn" },
  { id: "freeparty-top", family: "freeparty", path: "freeparty/hf-horn.glb", body: [.82, .46, .48], emitter: "EmitterHigh", build: "topHorn" },
  { id: "festival-sub", family: "festival", path: "festival/sub.glb", body: [1.35, .78, 1.05], emitter: "EmitterLow", build: "festivalSub" },
  { id: "festival-line-array", family: "festival", path: "festival/line-array-hang.glb", body: [.9, 3.2, .7], emitter: "EmitterHigh", build: "lineArray" },
  { id: "festival-front-fill", family: "festival", path: "festival/front-fill.glb", body: [.62, .36, .42], emitter: "EmitterHigh", additionalEmitters: ["EmitterLow"], build: "frontFill" },
  { id: "hifi-woofer", family: "hifi", path: "hifi/large-woofer.glb", body: [.92, 1.02, .65], emitter: "EmitterLow", build: "hifiWoofer" },
  { id: "hifi-mid-horn", family: "hifi", path: "hifi/mid-horn.glb", body: [1.05, .55, .52], emitter: "EmitterMid", build: "hifiHorn" },
  { id: "hifi-tweeter", family: "hifi", path: "hifi/tweeter.glb", body: [.44, .24, .28], emitter: "EmitterHigh", build: "hifiTweeter" },
  { id: "steppers-reflex-sub", family: "steppers", path: "steppers/reflex-sub.glb", body: [1.12, .82, .96], emitter: "EmitterLow", build: "reflexSub" },
  { id: "steppers-kick", family: "steppers", path: "steppers/kick.glb", body: [1.02, .66, .84], emitter: "EmitterLow", build: "steppersKick" },
  { id: "steppers-mid", family: "steppers", path: "steppers/mid-top.glb", body: [.86, .72, .58], emitter: "EmitterMid", additionalEmitters: ["EmitterLow"], build: "steppersMid" },
  { id: "steppers-top", family: "steppers", path: "steppers/top.glb", body: [.72, .4, .4], emitter: "EmitterHigh", build: "steppersTop" },
];

export const REPRESENTATIVE_IDS = new Set([
  "freeparty-wbin",
  "festival-line-array",
  "hifi-mid-horn",
  "steppers-reflex-sub",
]);
