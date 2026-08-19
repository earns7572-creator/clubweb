/** Club Craft Custom EQ — flat defaults and log-frequency helpers shared by UI and DSP. */
export type EqBand = { frequency: number; gainDb: number; q: number };
export type ShelfBand = { frequency: number; gainDb: number };
export type SpeakerEq = { low: ShelfBand; lowMid: EqBand; highMid: EqBand; high: ShelfBand };

export const DEFAULT_SPEAKER_EQ: SpeakerEq = {
  low: { frequency: 100, gainDb: 0 },
  lowMid: { frequency: 300, gainDb: 0, q: 1 },
  highMid: { frequency: 2500, gainDb: 0, q: 1 },
  high: { frequency: 8000, gainDb: 0 },
};

export const EQ_RANGES = {
  low: { frequency: [40, 400] as const, gain: [-12, 12] as const },
  lowMid: { frequency: [80, 2000] as const, gain: [-12, 12] as const, q: [.3, 8] as const },
  highMid: { frequency: [500, 8000] as const, gain: [-12, 12] as const, q: [.3, 8] as const },
  high: { frequency: [2000, 16000] as const, gain: [-12, 12] as const },
};

export function createDefaultEq(): SpeakerEq {
  return { low: { ...DEFAULT_SPEAKER_EQ.low }, lowMid: { ...DEFAULT_SPEAKER_EQ.lowMid }, highMid: { ...DEFAULT_SPEAKER_EQ.highMid }, high: { ...DEFAULT_SPEAKER_EQ.high } };
}

export function positionToFrequency(position: number, min: number, max: number) { return min * Math.pow(max / min, Math.min(1, Math.max(0, position))); }
export function frequencyToPosition(frequency: number, min: number, max: number) { return Math.log(Math.min(max, Math.max(min, frequency)) / min) / Math.log(max / min); }
export function formatFrequency(frequency: number) { return frequency >= 1000 ? `${(frequency / 1000).toFixed(frequency >= 9950 ? 0 : 1)} kHz` : `${Math.round(frequency)} Hz`; }
