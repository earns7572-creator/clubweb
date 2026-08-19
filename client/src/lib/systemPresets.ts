/* Club Craft system presets replace a scene only through an explicit LOAD action in the UI. */
import type { SpeakerFamily, SpeakerModelId } from "@/lib/speakerModels";

export type PresetSpeaker = { key: string; modelId: SpeakerModelId; x: number; y: number; z?: number; level: number; stackOn?: string };
export type SystemPreset = { id: string; label: string; family: SpeakerFamily; description: string; speakers: PresetSpeaker[] };

export const REGGAE_WALL: SystemPreset = { id: "reggae-wall", label: "Reggae Sound System", family: "reggae", description: "Scoop bass, kick, horn mids and top boxes.", speakers: [
  { key: "left-scoop", modelId: "reggae-scoop", x: .36, y: .36, level: .86 }, { key: "left-kick", modelId: "reggae-kick", x: .36, y: .36, level: .76, stackOn: "left-scoop" }, { key: "left-mid", modelId: "reggae-mid-horn", x: .36, y: .36, level: .7, stackOn: "left-kick" }, { key: "left-top", modelId: "reggae-top", x: .36, y: .36, level: .62, stackOn: "left-mid" },
  { key: "right-scoop", modelId: "reggae-scoop", x: .64, y: .36, level: .86 }, { key: "right-kick", modelId: "reggae-kick", x: .64, y: .36, level: .76, stackOn: "right-scoop" }, { key: "right-mid", modelId: "reggae-mid-horn", x: .64, y: .36, level: .7, stackOn: "right-kick" }, { key: "right-top", modelId: "reggae-top", x: .64, y: .36, level: .62, stackOn: "right-mid" },
] };
