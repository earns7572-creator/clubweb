/* Club Craft physical-space rule: a speaker position.z is its unstacked bottom elevation in a six-metre scene, never a model-specific visual offset. */
import type { ClubSpeaker, SpeakerKind } from "@/hooks/useClubAudio";
import { getSpeakerModel } from "@/lib/speakerModels";

export const SCENE_VERTICAL_METERS = 6;
export const SPEAKER_BODY = {
  sub: { width: 2.36, height: .9, depth: 1.4 },
  woofer: { width: 1.15, height: 1.5, depth: 1.08 },
  full: { width: 1.1, height: 2, depth: 1.08 },
  mid: { width: .84, height: .88, depth: .58 },
  high: { width: 1.08, height: .62, depth: .72 },
} satisfies Record<SpeakerKind, { width: number; height: number; depth: number }>;

export const normalizedZToMeters = (z: number) => z * SCENE_VERTICAL_METERS;
export const metersToNormalizedZ = (meters: number) => meters / SCENE_VERTICAL_METERS;
export const speakerBodyTuple = (kind: SpeakerKind): [number, number, number] => { const body = SPEAKER_BODY[kind]; return [body.width, body.height, body.depth]; };
export const speakerBodyForSpeaker = (speaker: Pick<ClubSpeaker, "kind" | "modelId">) => getSpeakerModel(speaker.modelId, speaker.kind).body;
export const speakerBodyTupleForSpeaker = (speaker: Pick<ClubSpeaker, "kind" | "modelId">): [number, number, number] => { const body = speakerBodyForSpeaker(speaker); return [body.width, body.height, body.depth]; };
