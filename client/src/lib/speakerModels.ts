/* Club Craft model rule: kind remains the acoustic role; modelId selects cabinet silhouette, physical body, and shared cabinet-character filters. */
import type { SpeakerKind } from "@/hooks/useClubAudio";

export type SpeakerFamily = "modern" | "reggae";
export type SpeakerModelId = "modern-sub" | "modern-woofer" | "modern-full" | "modern-mid" | "modern-high" | "reggae-scoop" | "reggae-kick" | "reggae-mid-horn" | "reggae-top";
export type CharacterFilter = { type: BiquadFilterType; frequency: number; q?: number; gainDb?: number };
export type SpeakerDirectivity = { innerAngle: number; outerAngle: number; outerGain: number };
export type SpeakerModelDefinition = { id: SpeakerModelId; family: SpeakerFamily; kind: SpeakerKind; label: string; shortLabel: string; body: { width: number; height: number; depth: number }; characterFilters: CharacterFilter[]; directivity: SpeakerDirectivity };

export const SPEAKER_MODELS: Record<SpeakerModelId, SpeakerModelDefinition> = {
  "modern-sub": { id: "modern-sub", family: "modern", kind: "sub", label: "Sub", shortLabel: "Sub", body: { width: 2.36, height: .9, depth: 1.4 }, characterFilters: [{ type: "lowpass", frequency: 110, q: .8 }], directivity: { innerAngle: 300, outerAngle: 360, outerGain: .75 } },
  "modern-woofer": { id: "modern-woofer", family: "modern", kind: "woofer", label: "Woofer", shortLabel: "Woofer", body: { width: 1.15, height: 1.5, depth: 1.08 }, characterFilters: [{ type: "lowpass", frequency: 460, q: .62 }], directivity: { innerAngle: 180, outerAngle: 280, outerGain: .45 } },
  "modern-full": { id: "modern-full", family: "modern", kind: "full", label: "Full Range", shortLabel: "Full", body: { width: 1.1, height: 2, depth: 1.08 }, characterFilters: [{ type: "allpass", frequency: 1000, q: .3 }], directivity: { innerAngle: 100, outerAngle: 170, outerGain: .25 } },
  "modern-mid": { id: "modern-mid", family: "modern", kind: "mid", label: "Mid", shortLabel: "Mid", body: { width: .84, height: .88, depth: .58 }, characterFilters: [{ type: "bandpass", frequency: 1600, q: .6 }], directivity: { innerAngle: 80, outerAngle: 140, outerGain: .18 } },
  "modern-high": { id: "modern-high", family: "modern", kind: "high", label: "High", shortLabel: "High", body: { width: 1.08, height: .62, depth: .72 }, characterFilters: [{ type: "highpass", frequency: 3600, q: .7 }], directivity: { innerAngle: 60, outerAngle: 110, outerGain: .1 } },
  "reggae-scoop": { id: "reggae-scoop", family: "reggae", kind: "sub", label: "Reggae Scoop", shortLabel: "Scoop", body: { width: 1.45, height: 1.65, depth: 1.15 }, characterFilters: [{ type: "highpass", frequency: 28, q: .7 }, { type: "peaking", frequency: 55, q: .8, gainDb: 2.5 }, { type: "lowpass", frequency: 100, q: .85 }], directivity: { innerAngle: 160, outerAngle: 260, outerGain: .55 } },
  "reggae-kick": { id: "reggae-kick", family: "reggae", kind: "woofer", label: "Reggae Kick", shortLabel: "Kick", body: { width: 1.35, height: .85, depth: 1.05 }, characterFilters: [{ type: "highpass", frequency: 75, q: .7 }, { type: "peaking", frequency: 125, q: .75, gainDb: 2 }, { type: "lowpass", frequency: 240, q: .72 }], directivity: { innerAngle: 120, outerAngle: 200, outerGain: .35 } },
  "reggae-mid-horn": { id: "reggae-mid-horn", family: "reggae", kind: "mid", label: "Reggae Mid Horn", shortLabel: "Mid Horn", body: { width: 1.12, height: .72, depth: .76 }, characterFilters: [{ type: "highpass", frequency: 190, q: .7 }, { type: "peaking", frequency: 1100, q: .65, gainDb: 1.5 }, { type: "lowpass", frequency: 4200, q: .7 }], directivity: { innerAngle: 55, outerAngle: 100, outerGain: .12 } },
  "reggae-top": { id: "reggae-top", family: "reggae", kind: "high", label: "Reggae Top", shortLabel: "Top", body: { width: 1, height: .42, depth: .44 }, characterFilters: [{ type: "highpass", frequency: 4000, q: .72 }, { type: "peaking", frequency: 8500, q: .65, gainDb: 1.5 }], directivity: { innerAngle: 45, outerAngle: 85, outerGain: .08 } },
};

export const defaultModelForKind = (kind: SpeakerKind): SpeakerModelId => `modern-${kind}` as SpeakerModelId;
export const resolveModelId = (modelId: SpeakerModelId | undefined | null, kind: SpeakerKind): SpeakerModelId => modelId && SPEAKER_MODELS[modelId] ? modelId : defaultModelForKind(kind);
export const getSpeakerModel = (modelId: SpeakerModelId | undefined | null, kind: SpeakerKind) => SPEAKER_MODELS[resolveModelId(modelId, kind)];
export const modelIdsForFamily = (family: SpeakerFamily) => (Object.keys(SPEAKER_MODELS) as SpeakerModelId[]).filter((id) => SPEAKER_MODELS[id].family === family);
