/* Club Craft vibration rule: derive visual bass pressure from real post-filter low-band energy, distance, and speaker type; never alter audio state. */
import type { ClubListener, ClubSpeaker, SpeakerKind } from "@/hooks/useClubAudio";
import { sceneToAudioPosition } from "@/hooks/useClubAudio";

export const LOW_BAND_HZ = { low: 20, high: 160 } as const;
export const VIBRATION_WEIGHT: Record<SpeakerKind, number> = { sub: 1, woofer: .7, full: .22, mid: .04, high: 0 };
export const VIBRATION_THRESHOLD = .08;

export function getBandEnergy(analyser: AnalyserNode, data: Uint8Array, sampleRate: number, lowHz = LOW_BAND_HZ.low, highHz = LOW_BAND_HZ.high) {
  analyser.getByteFrequencyData(data);
  const binHz = sampleRate / 2 / data.length;
  const start = Math.max(0, Math.floor(lowHz / binHz));
  const end = Math.min(data.length - 1, Math.ceil(highHz / binHz));
  let sum = 0; let count = 0;
  for (let index = start; index <= end; index += 1) { const value = data[index] / 255; sum += value * value; count += 1; }
  return count ? Math.sqrt(sum / count) : 0;
}

export function bassDistanceWeight(speaker: ClubSpeaker, listener: ClubListener) {
  const source = sceneToAudioPosition(speaker.position); const target = sceneToAudioPosition(listener.position);
  const dx = source.x - target.x; const dy = source.y - target.y; const dz = source.z - target.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return 1 / (1 + Math.pow(distance / 2.4, 2));
}

export function calculateBassPressure(speakers: ClubSpeaker[], lowActivity: Readonly<Record<string, number>>, listener: ClubListener) {
  let sum = 0;
  for (const speaker of speakers) { if (!speaker.muted) sum += (lowActivity[speaker.id] ?? 0) * VIBRATION_WEIGHT[speaker.kind] * bassDistanceWeight(speaker, listener); }
  return 1 - Math.exp(-sum * .75);
}

export function vibrationFromPressure(pressure: number) {
  const clamped = Math.max(0, Math.min(1, pressure));
  return clamped <= VIBRATION_THRESHOLD ? 0 : (clamped - VIBRATION_THRESHOLD) / (1 - VIBRATION_THRESHOLD);
}
