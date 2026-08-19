/** Club Craft Speaker profiles — shared by runtime DSP and visual Filter Response. */
import type { SpeakerKind } from "@/hooks/useClubAudio";

export type SpeakerTypeFilter = { type: BiquadFilterType; frequency: number; q: number };
export const filterForKind: Record<SpeakerKind, SpeakerTypeFilter> = {
  sub: { type: "lowpass", frequency: 110, q: .8 },
  woofer: { type: "lowpass", frequency: 460, q: .62 },
  full: { type: "allpass", frequency: 1000, q: .3 },
  mid: { type: "bandpass", frequency: 1600, q: .6 },
  high: { type: "highpass", frequency: 3600, q: .7 },
};
