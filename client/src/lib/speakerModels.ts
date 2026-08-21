import type { SpeakerKind } from "@/hooks/useClubAudio";

export type SpeakerFamily = "modern" | "reggae" | "freeparty" | "festival" | "hifi" | "steppers";
export type SpeakerModelId =
  | "modern-sub" | "modern-woofer" | "modern-full" | "modern-mid" | "modern-high"
  | "reggae-scoop" | "reggae-kick" | "reggae-mid-horn" | "reggae-top"
  | "freeparty-wbin" | "freeparty-kick-horn" | "freeparty-mid-horn" | "freeparty-top"
  | "festival-sub" | "festival-line-array" | "festival-front-fill"
  | "hifi-woofer" | "hifi-mid-horn" | "hifi-tweeter"
  | "steppers-reflex-sub" | "steppers-kick" | "steppers-mid" | "steppers-top";

export type CharacterFilter = { type: BiquadFilterType; frequency: number; q?: number; gainDb?: number };
export type SpeakerBand = "low" | "kick" | "full" | "mid" | "high";
export type SpeakerDirectivity = { innerAngle: number; outerAngle: number; outerGain: number; visualRangeMeters: number };
export type SpeakerFieldComponent = { band: "low" | "kick" | "mid" | "high"; gain: number; innerAngle: number; outerAngle: number; outerGain: number; visualRangeMeters: number };
export type SpeakerVisualVariant = SpeakerFamily;
export type SpeakerGlbVisual = { renderer: "glb"; variant: SpeakerVisualVariant; plannedGlbPath: string; src: string; emitterMeshes?: { low?: string[]; mid?: string[]; high?: string[] } };
export type SpeakerProceduralVisual = { renderer: "procedural"; variant: SpeakerVisualVariant; plannedGlbPath: string };
export type SpeakerVisualDefinition = SpeakerGlbVisual | SpeakerProceduralVisual;
export type SpeakerFamilyDefinition = { id: SpeakerFamily; label: string; shortLabel: string; description: string; order: number };
export type SpeakerModelDefinition = { id: SpeakerModelId; family: SpeakerFamily; kind: SpeakerKind; band: SpeakerBand; label: string; shortLabel: string; body: { width: number; height: number; depth: number }; directivity: SpeakerDirectivity; fieldComponents: SpeakerFieldComponent[]; characterFilters: CharacterFilter[]; visual: SpeakerVisualDefinition };

const BAND_BY_MODEL: Record<SpeakerModelId, SpeakerBand> = {
  "modern-sub": "low", "modern-woofer": "low", "modern-full": "full", "modern-mid": "mid", "modern-high": "high",
  "reggae-scoop": "low", "reggae-kick": "kick", "reggae-mid-horn": "mid", "reggae-top": "high",
  "freeparty-wbin": "low", "freeparty-kick-horn": "kick", "freeparty-mid-horn": "mid", "freeparty-top": "high",
  "festival-sub": "low", "festival-line-array": "full", "festival-front-fill": "full",
  "hifi-woofer": "low", "hifi-mid-horn": "mid", "hifi-tweeter": "high",
  "steppers-reflex-sub": "low", "steppers-kick": "kick", "steppers-mid": "mid", "steppers-top": "high",
};

const DIRECTIVITY_BY_MODEL: Record<SpeakerModelId, SpeakerDirectivity> = {
  "modern-sub": { innerAngle: 300, outerAngle: 360, outerGain: .75, visualRangeMeters: 7 },
  "modern-woofer": { innerAngle: 170, outerAngle: 270, outerGain: .45, visualRangeMeters: 7 },
  "modern-full": { innerAngle: 100, outerAngle: 170, outerGain: .25, visualRangeMeters: 9 },
  "modern-mid": { innerAngle: 80, outerAngle: 140, outerGain: .18, visualRangeMeters: 9 },
  "modern-high": { innerAngle: 60, outerAngle: 110, outerGain: .10, visualRangeMeters: 10 },
  "reggae-scoop": { innerAngle: 170, outerAngle: 280, outerGain: .55, visualRangeMeters: 8 },
  "reggae-kick": { innerAngle: 120, outerAngle: 210, outerGain: .35, visualRangeMeters: 8 },
  "reggae-mid-horn": { innerAngle: 60, outerAngle: 105, outerGain: .12, visualRangeMeters: 10 },
  "reggae-top": { innerAngle: 45, outerAngle: 90, outerGain: .08, visualRangeMeters: 11 },
  "freeparty-wbin": { innerAngle: 150, outerAngle: 250, outerGain: .50, visualRangeMeters: 8 },
  "freeparty-kick-horn": { innerAngle: 100, outerAngle: 180, outerGain: .30, visualRangeMeters: 8 },
  "freeparty-mid-horn": { innerAngle: 55, outerAngle: 100, outerGain: .12, visualRangeMeters: 10 },
  "freeparty-top": { innerAngle: 45, outerAngle: 85, outerGain: .08, visualRangeMeters: 11 },
  "festival-sub": { innerAngle: 300, outerAngle: 360, outerGain: .70, visualRangeMeters: 10 },
  "festival-line-array": { innerAngle: 90, outerAngle: 140, outerGain: .20, visualRangeMeters: 13 },
  "festival-front-fill": { innerAngle: 110, outerAngle: 180, outerGain: .25, visualRangeMeters: 8 },
  "hifi-woofer": { innerAngle: 160, outerAngle: 260, outerGain: .40, visualRangeMeters: 6 },
  "hifi-mid-horn": { innerAngle: 60, outerAngle: 105, outerGain: .12, visualRangeMeters: 7 },
  "hifi-tweeter": { innerAngle: 45, outerAngle: 80, outerGain: .06, visualRangeMeters: 7 },
  "steppers-reflex-sub": { innerAngle: 280, outerAngle: 360, outerGain: .65, visualRangeMeters: 8 },
  "steppers-kick": { innerAngle: 110, outerAngle: 190, outerGain: .32, visualRangeMeters: 8 },
  "steppers-mid": { innerAngle: 70, outerAngle: 120, outerGain: .15, visualRangeMeters: 9 },
  "steppers-top": { innerAngle: 50, outerAngle: 90, outerGain: .08, visualRangeMeters: 10 },
};

const FIELD_COMPONENTS_BY_MODEL: Partial<Record<SpeakerModelId, SpeakerFieldComponent[]>> = {
  "modern-full": [
    { band: "low", gain: .32, innerAngle: 155, outerAngle: 240, outerGain: .35, visualRangeMeters: 7.5 },
    { band: "mid", gain: .78, innerAngle: 105, outerAngle: 165, outerGain: .20, visualRangeMeters: 9 },
    { band: "high", gain: 1, innerAngle: 72, outerAngle: 120, outerGain: .10, visualRangeMeters: 10 },
  ],
  "festival-line-array": [
    { band: "mid", gain: .90, innerAngle: 100, outerAngle: 150, outerGain: .18, visualRangeMeters: 13 },
    { band: "high", gain: 1.15, innerAngle: 84, outerAngle: 130, outerGain: .12, visualRangeMeters: 14 },
  ],
  "festival-front-fill": [
    { band: "mid", gain: .78, innerAngle: 120, outerAngle: 185, outerGain: .25, visualRangeMeters: 8 },
    { band: "high", gain: .95, innerAngle: 105, outerAngle: 165, outerGain: .20, visualRangeMeters: 8.5 },
  ],
};

const fieldComponentsFor = (id: SpeakerModelId): SpeakerFieldComponent[] => {
  const components = FIELD_COMPONENTS_BY_MODEL[id];
  if (components) return components;
  const band = BAND_BY_MODEL[id];
  if (band === "full") return [];
  return [{ band, gain: 1, ...DIRECTIVITY_BY_MODEL[id] }];
};

const GLB_ASSET_URLS: Record<string, string> = {
  // Modern and Reggae intentionally have no entry: their approved procedural visuals are protected from bulk GLB replacement.
  "freeparty/w-bin.glb": "/models/speakers/freeparty/w-bin.glb", "freeparty/kick-horn.glb": "/models/speakers/freeparty/kick-horn.glb", "freeparty/mid-horn.glb": "/models/speakers/freeparty/mid-horn.glb", "freeparty/hf-horn.glb": "/models/speakers/freeparty/hf-horn.glb",
  "festival/sub.glb": "/models/speakers/festival/sub.glb", "festival/line-array-hang.glb": "/models/speakers/festival/line-array-hang.glb", "festival/front-fill.glb": "/models/speakers/festival/front-fill.glb",
  "hifi/large-woofer.glb": "/models/speakers/hifi/large-woofer.glb", "hifi/mid-horn.glb": "/models/speakers/hifi/mid-horn.glb", "hifi/tweeter.glb": "/models/speakers/hifi/tweeter.glb",
  "steppers/reflex-sub.glb": "/models/speakers/steppers/reflex-sub.glb", "steppers/kick.glb": "/models/speakers/steppers/kick.glb", "steppers/mid-top.glb": "/models/speakers/steppers/mid-top.glb", "steppers/top.glb": "/models/speakers/steppers/top.glb",
};
const emittersFor = (id: SpeakerModelId): SpeakerGlbVisual["emitterMeshes"] => {
  if (id === "modern-full" || id === "festival-front-fill") return { low: ["EmitterLow"], high: ["EmitterHigh"] };
  if (id === "modern-mid") return { mid: ["EmitterHigh"] };
  if (id === "steppers-mid") return { low: ["EmitterLow"], mid: ["EmitterMid"] };
  if (id === "festival-line-array" || id.endsWith("-top") || id === "modern-high" || id === "hifi-tweeter" || id === "freeparty-top") return { high: ["EmitterHigh"] };
  if (id.includes("mid-horn") || id === "freeparty-mid-horn" || id === "hifi-mid-horn") return { mid: ["EmitterMid"] };
  return { low: ["EmitterLow"] };
};
const visual = (variant: SpeakerVisualVariant, plannedGlbPath: string, id: SpeakerModelId): SpeakerVisualDefinition => { const src = GLB_ASSET_URLS[plannedGlbPath]; return src ? { renderer: "glb", variant, plannedGlbPath, src, emitterMeshes: emittersFor(id) } : { renderer: "procedural", variant, plannedGlbPath }; };
const model = (id: SpeakerModelId, family: SpeakerFamily, kind: SpeakerKind, label: string, shortLabel: string, body: [number, number, number], characterFilters: CharacterFilter[], plannedGlbPath: string): SpeakerModelDefinition => ({ id, family, kind, band: BAND_BY_MODEL[id], label, shortLabel, body: { width: body[0], height: body[1], depth: body[2] }, directivity: DIRECTIVITY_BY_MODEL[id], fieldComponents: fieldComponentsFor(id), characterFilters, visual: visual(family, plannedGlbPath, id) });
const hp = (frequency: number, q = .7): CharacterFilter => ({ type: "highpass", frequency, q });
const lp = (frequency: number, q = .7): CharacterFilter => ({ type: "lowpass", frequency, q });
const peak = (frequency: number, gainDb: number, q = .75): CharacterFilter => ({ type: "peaking", frequency, gainDb, q });

export const SPEAKER_FAMILIES: Record<SpeakerFamily, SpeakerFamilyDefinition> = {
  reggae: { id: "reggae", label: "Reggae Sound System", shortLabel: "Reggae", description: "Classic multi-way scoop, kick, horn and top stacks.", order: 1 },
  freeparty: { id: "freeparty", label: "Free Party / Tekno", shortLabel: "Free Party", description: "Horn-loaded DIY stacks for high-impact electronic music.", order: 2 },
  modern: { id: "modern", label: "Modern Club", shortLabel: "Club", description: "Point-source club systems with dedicated sub bass.", order: 3 },
  festival: { id: "festival", label: "Festival", shortLabel: "Festival", description: "Large-format arrays, subs and front fills for open stages.", order: 4 },
  hifi: { id: "hifi", label: "Hi-Fi / Listening Bar", shortLabel: "Hi-Fi", description: "Large woofers and horns for focused stereo listening.", order: 5 },
  steppers: { id: "steppers", label: "UK Dub / Steppers", shortLabel: "Steppers", description: "Compact, modern multi-way bass-heavy dub stacks.", order: 6 },
};

export const SPEAKER_MODELS: Record<SpeakerModelId, SpeakerModelDefinition> = {
  "modern-sub": model("modern-sub", "modern", "sub", "Sub", "Sub", [2.36, .9, 1.4], [lp(110, .8)], "modern/sub.glb"),
  "modern-woofer": model("modern-woofer", "modern", "woofer", "Woofer", "Woofer", [1.15, 1.5, 1.08], [lp(460, .62)], "modern/point-source.glb"),
  "modern-full": model("modern-full", "modern", "full", "Full Range", "Full", [1.1, 2, 1.08], [{ type: "allpass", frequency: 1000, q: .3 }], "modern/point-source.glb"),
  "modern-mid": model("modern-mid", "modern", "mid", "Mid", "Mid", [.84, .88, .58], [{ type: "bandpass", frequency: 1600, q: .6 }], "modern/point-source.glb"),
  "modern-high": model("modern-high", "modern", "high", "High", "High", [1.08, .62, .72], [hp(3600)], "modern/point-source.glb"),
  "reggae-scoop": model("reggae-scoop", "reggae", "sub", "Reggae Scoop", "Scoop", [1.2, 1.65, 1.15], [hp(28), peak(55, 2.5, .8), lp(100, .85)], "reggae/scoop.glb"),
  "reggae-kick": model("reggae-kick", "reggae", "woofer", "Reggae Kick", "Kick", [1.35, .85, 1.05], [hp(75), peak(125, 2), lp(240, .72)], "reggae/kick-bin.glb"),
  "reggae-mid-horn": model("reggae-mid-horn", "reggae", "mid", "Reggae Mid Horn", "Mid Horn", [1.12, .72, .76], [hp(190), peak(1100, 1.5, .65), lp(4200)], "reggae/mid-horn.glb"),
  "reggae-top": model("reggae-top", "reggae", "high", "Reggae Top", "Top", [1, .42, .44], [hp(4000, .72), peak(8500, 1.5, .65)], "reggae/top.glb"),
  "freeparty-wbin": model("freeparty-wbin", "freeparty", "sub", "W-Bin Bass", "W-Bin", [1.2, .9, 1.05], [hp(35), lp(105, .8)], "freeparty/w-bin.glb"),
  "freeparty-kick-horn": model("freeparty-kick-horn", "freeparty", "woofer", "Kick Horn", "Kick", [1.1, .72, .9], [hp(80), peak(130, 2), lp(260)], "freeparty/kick-horn.glb"),
  "freeparty-mid-horn": model("freeparty-mid-horn", "freeparty", "mid", "Mid Horn", "Mid", [.9, .68, .65], [hp(220), lp(3500)], "freeparty/mid-horn.glb"),
  "freeparty-top": model("freeparty-top", "freeparty", "high", "HF Horn", "Top", [.82, .46, .48], [hp(3200)], "freeparty/hf-horn.glb"),
  "festival-sub": model("festival-sub", "festival", "sub", "Festival Sub", "Sub", [1.35, .78, 1.05], [hp(30), lp(100, .8)], "festival/sub.glb"),
  "festival-line-array": model("festival-line-array", "festival", "full", "Line Array Hang", "Array", [.9, 3.2, .7], [hp(70)], "festival/line-array-hang.glb"),
  "festival-front-fill": model("festival-front-fill", "festival", "full", "Front Fill", "Fill", [.62, .36, .42], [hp(90)], "festival/front-fill.glb"),
  "hifi-woofer": model("hifi-woofer", "hifi", "woofer", "Large Woofer Cabinet", "Woofer", [.92, 1.02, .65], [hp(35), lp(800, .8)], "hifi/large-woofer.glb"),
  "hifi-mid-horn": model("hifi-mid-horn", "hifi", "mid", "Large Mid Horn", "Horn", [1.05, .55, .52], [hp(500), lp(6000)], "hifi/mid-horn.glb"),
  "hifi-tweeter": model("hifi-tweeter", "hifi", "high", "Super Tweeter", "Tweeter", [.44, .24, .28], [hp(5000)], "hifi/tweeter.glb"),
  "steppers-reflex-sub": model("steppers-reflex-sub", "steppers", "sub", "Reflex Bass", "Bass", [1.12, .82, .96], [hp(30), lp(95, .8)], "steppers/reflex-sub.glb"),
  "steppers-kick": model("steppers-kick", "steppers", "woofer", "Steppers Kick", "Kick", [1.02, .66, .84], [hp(80), peak(135, 1.5), lp(260)], "steppers/kick.glb"),
  "steppers-mid": model("steppers-mid", "steppers", "mid", "Mid Top", "Mid", [.86, .72, .58], [hp(220), lp(4500)], "steppers/mid-top.glb"),
  "steppers-top": model("steppers-top", "steppers", "high", "HF Top", "Top", [.72, .4, .4], [hp(4000)], "steppers/top.glb"),
};

export const orderedSpeakerFamilies = () => Object.values(SPEAKER_FAMILIES).sort((a, b) => a.order - b.order);
export const defaultModelForKind = (kind: SpeakerKind): SpeakerModelId => `modern-${kind}` as SpeakerModelId;
export const resolveModelId = (modelId: SpeakerModelId | undefined | null, kind: SpeakerKind): SpeakerModelId => modelId && SPEAKER_MODELS[modelId] ? modelId : defaultModelForKind(kind);
export const getSpeakerModel = (modelId: SpeakerModelId | undefined | null, kind: SpeakerKind) => SPEAKER_MODELS[resolveModelId(modelId, kind)];
export const modelIdsForFamily = (family: SpeakerFamily) => (Object.keys(SPEAKER_MODELS) as SpeakerModelId[]).filter((id) => SPEAKER_MODELS[id].family === family);
