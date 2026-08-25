/* Club Craft bass rule: POV movement follows present sub pressure, with only a small upper-bass assist and stack-aware audio distance. */
import type { ClubListener, ClubSpeaker, SpeakerKind } from "@/hooks/useClubAudio";
import { sceneToAudioPosition, speakerToAudioPosition } from "@/lib/spatialCoordinates";
import { bandEnergyFromFrequencyData } from "@/lib/bandActivity";

export const SUB_BAND_HZ = { low: 25, high: 90 } as const;
export const UPPER_BASS_BAND_HZ = { low: 90, high: 160 } as const;
export const UPPER_BASS_WEIGHT = .18;
export const LOW_ACTIVITY_GATE = .035;
export const VIBRATION_WEIGHT: Record<SpeakerKind, number> = { sub: 1, woofer: .5, full: .08, mid: 0, high: 0 };
export const VIBRATION_THRESHOLD = .12;

export function getBandEnergy(analyser: AnalyserNode, data: Uint8Array, sampleRate: number, lowHz: number = SUB_BAND_HZ.low, highHz: number = SUB_BAND_HZ.high) {
  analyser.getByteFrequencyData(data); return bandEnergyFromFrequencyData(data, sampleRate, lowHz, highHz);
}
export function bassEnergyFromFrequencyData(data: Uint8Array, sampleRate: number) { const subEnergy = bandEnergyFromFrequencyData(data, sampleRate, SUB_BAND_HZ.low, SUB_BAND_HZ.high); const upperBassEnergy = bandEnergyFromFrequencyData(data, sampleRate, UPPER_BASS_BAND_HZ.low, UPPER_BASS_BAND_HZ.high); const combined = subEnergy + upperBassEnergy * UPPER_BASS_WEIGHT; return combined < LOW_ACTIVITY_GATE ? 0 : Math.min(1, combined); }
export function bassEnergy(analyser: AnalyserNode, data: Uint8Array, sampleRate: number) { analyser.getByteFrequencyData(data); return bassEnergyFromFrequencyData(data, sampleRate); }
export function bassDistanceWeight(speaker: ClubSpeaker, speakers: ClubSpeaker[], listener: ClubListener) { const source = speakerToAudioPosition(speaker, speakers); const target = sceneToAudioPosition(listener.position); const dx = source.x - target.x; const dy = source.y - target.y; const dz = source.z - target.z; const distance = Math.sqrt(dx * dx + dy * dy + dz * dz); return 1 / (1 + Math.pow(distance / 2.4, 2)); }
export function calculateBassPressure(speakers: ClubSpeaker[], lowActivity: Readonly<Record<string, number>>, listener: ClubListener) { let sum = 0; for (const speaker of speakers) { const energy = lowActivity[speaker.id] ?? 0; const weight = VIBRATION_WEIGHT[speaker.kind]; if (!speaker.muted && energy > 0 && weight > 0) sum += energy * weight * bassDistanceWeight(speaker, speakers, listener); } return 1 - Math.exp(-sum * .75); }
export function vibrationFromPressure(pressure: number) { const clamped = Math.max(0, Math.min(1, pressure)); if (clamped <= VIBRATION_THRESHOLD) return 0; return Math.pow((clamped - VIBRATION_THRESHOLD) / (1 - VIBRATION_THRESHOLD), 1.35); }
