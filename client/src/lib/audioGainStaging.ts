/* Shared master staging keeps parallel cabinet paths from adding full-scale copies. */
export const MASTER_BASE_GAIN = .82;
export const MASTER_DYNAMICS = {
  thresholdDb: -6,
  kneeDb: 12,
  ratio: 2.5,
  attackSeconds: .008,
  releaseSeconds: .18,
} as const;

export type StagedSpeaker = { muted: boolean };

export function activeSpeakerCount(speakers: readonly StagedSpeaker[]) {
  return speakers.reduce((count, speaker) => count + (speaker.muted ? 0 : 1), 0);
}

/**
 * Equal-power normalization preserves a meaningful +3 dB-per-doubling trend
 * while avoiding the +6 dB-per-doubling gain of identical full-level copies.
 */
export function masterGainForSpeakerCount(count: number) {
  return MASTER_BASE_GAIN / Math.sqrt(Math.max(1, count));
}

export function masterGainForSpeakers(speakers: readonly StagedSpeaker[]) {
  return masterGainForSpeakerCount(activeSpeakerCount(speakers));
}
