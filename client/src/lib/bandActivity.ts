/* SYSTM visual-audio rule: LOW/MID/HIGH illumination always comes from one post-character-filter analyser spectrum. */
export type SpeakerBandActivity = { overall: number; low: number; mid: number; high: number };
export type SpeakerBandActivityMap = Readonly<Record<string, SpeakerBandActivity>>;

export const VISUAL_BAND_HZ = { low: { low: 20, high: 200 }, mid: { low: 200, high: 2_000 }, high: { low: 2_000, high: 20_000 } } as const;
export const SILENT_BAND_ACTIVITY: SpeakerBandActivity = { overall: 0, low: 0, mid: 0, high: 0 };

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function bandEnergyFromFrequencyData(data: Uint8Array, sampleRate: number, lowHz: number, highHz: number) {
  const binHz = sampleRate / 2 / data.length; const start = Math.max(0, Math.floor(lowHz / binHz)); const end = Math.min(data.length - 1, Math.ceil(highHz / binHz));
  let sum = 0; let peak = 0; let count = 0;
  for (let index = start; index <= end; index += 1) { const value = data[index] / 255; sum += value * value; peak = Math.max(peak, value); count += 1; }
  const rms = count ? Math.sqrt(sum / count) : 0;
  return clamp(Math.max(rms, peak * .86));
}

export function activityFromFrequencyData(data: Uint8Array, sampleRate: number, overall: number): SpeakerBandActivity {
  return { overall: clamp(overall), low: bandEnergyFromFrequencyData(data, sampleRate, VISUAL_BAND_HZ.low.low, VISUAL_BAND_HZ.low.high), mid: bandEnergyFromFrequencyData(data, sampleRate, VISUAL_BAND_HZ.mid.low, VISUAL_BAND_HZ.mid.high), high: bandEnergyFromFrequencyData(data, sampleRate, VISUAL_BAND_HZ.high.low, VISUAL_BAND_HZ.high.high) };
}
