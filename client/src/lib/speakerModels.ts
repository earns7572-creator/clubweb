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
export type SpeakerVisualVariant = SpeakerFamily;
export type SpeakerGlbVisual = { renderer: "glb"; variant: SpeakerVisualVariant; plannedGlbPath: string; src: string; emitterMeshes?: { low?: string[]; mid?: string[]; high?: string[] } };
export type SpeakerProceduralVisual = { renderer: "procedural"; variant: SpeakerVisualVariant; plannedGlbPath: string };
export type SpeakerVisualDefinition = SpeakerGlbVisual | SpeakerProceduralVisual;
export type SpeakerFamilyDefinition = { id: SpeakerFamily; label: string; shortLabel: string; description: string; order: number };
export type SpeakerModelDefinition = { id: SpeakerModelId; family: SpeakerFamily; kind: SpeakerKind; label: string; shortLabel: string; body: { width: number; height: number; depth: number }; characterFilters: CharacterFilter[]; visual: SpeakerVisualDefinition };

const GLB_ASSET_URLS: Record<string, string> = {
  "modern/sub.glb": "/manus-storage/club-sub_945f551c.glb", "modern/point-source.glb": "/manus-storage/point-source_cf234f10.glb",
  "reggae/scoop.glb": "/manus-storage/scoop_5fb2dc25.glb", "reggae/kick-bin.glb": "/manus-storage/kick-bin_4ded79f4.glb", "reggae/mid-horn.glb": "/manus-storage/mid-horn_88e26e4b.glb", "reggae/top.glb": "/manus-storage/top_f53d710b.glb",
  "freeparty/w-bin.glb": "/manus-storage/w-bin_0ce00c0f.glb", "freeparty/kick-horn.glb": "/manus-storage/kick-horn_683764ee.glb", "freeparty/mid-horn.glb": "/manus-storage/mid-horn_913b1365.glb", "freeparty/hf-horn.glb": "/manus-storage/hf-horn_e168a6aa.glb",
  "festival/sub.glb": "/manus-storage/festival-sub_a42dba39.glb", "festival/line-array-hang.glb": "/manus-storage/line-array-hang_9a71a238.glb", "festival/front-fill.glb": "/manus-storage/front-fill_863b5295.glb",
  "hifi/large-woofer.glb": "/manus-storage/large-woofer_4221dd9f.glb", "hifi/mid-horn.glb": "/manus-storage/wooden-mid-horn_678136a1.glb", "hifi/tweeter.glb": "/manus-storage/super-tweeter_22afe845.glb",
  "steppers/reflex-sub.glb": "/manus-storage/reflex-sub_c5d109b8.glb", "steppers/kick.glb": "/manus-storage/kick_08ffe74a.glb", "steppers/mid-top.glb": "/manus-storage/mid-top_8676374e.glb", "steppers/top.glb": "/manus-storage/hf-top_b6c07775.glb",
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
const model = (id: SpeakerModelId, family: SpeakerFamily, kind: SpeakerKind, label: string, shortLabel: string, body: [number, number, number], characterFilters: CharacterFilter[], plannedGlbPath: string): SpeakerModelDefinition => ({ id, family, kind, label, shortLabel, body: { width: body[0], height: body[1], depth: body[2] }, characterFilters, visual: visual(family, plannedGlbPath, id) });
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
  "reggae-scoop": model("reggae-scoop", "reggae", "sub", "Reggae Scoop", "Scoop", [1.45, 1.65, 1.15], [hp(28), peak(55, 2.5, .8), lp(100, .85)], "reggae/scoop.glb"),
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
