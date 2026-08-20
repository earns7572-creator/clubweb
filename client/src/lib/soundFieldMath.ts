import type { SpeakerDirectivity } from "./speakerModels";

export const SOUND_FIELD_STYLE = {
  activityGamma: 0.9,
  distanceScaleMeters: 4,
  distanceExponent: 1.7,
  rangeFadeStart: 0.72,
  compression: 1.35,
  alphaGamma: 1.08,
  maxOpacity: 0.32,
  tintMix: 0.24,
} as const;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  if (edge0 === edge1) return value < edge0 ? 0 : 1;
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

export function visualActivity(activity: number) {
  return Math.pow(clamp01(activity), SOUND_FIELD_STYLE.activityGamma);
}

export function directivityFactor(angleRadians: number, directivity: Pick<SpeakerDirectivity, "innerAngle" | "outerAngle" | "outerGain">) {
  const innerCos = Math.cos(directivity.innerAngle * 0.5 * Math.PI / 180);
  const outerCos = Math.cos(directivity.outerAngle * 0.5 * Math.PI / 180);
  const cosTheta = Math.cos(Math.abs(angleRadians));
  const transition = smoothstep(outerCos, innerCos, cosTheta);
  return directivity.outerGain + (1 - directivity.outerGain) * transition;
}

export function distanceFactor(distanceMeters: number) {
  const distance = Math.max(0, distanceMeters);
  return 1 / (1 + Math.pow(distance / SOUND_FIELD_STYLE.distanceScaleMeters, SOUND_FIELD_STYLE.distanceExponent));
}

export function rangeFactor(distanceMeters: number, rangeMeters: number) {
  if (rangeMeters <= 0) return 0;
  return 1 - smoothstep(rangeMeters * SOUND_FIELD_STYLE.rangeFadeStart, rangeMeters, distanceMeters);
}

export function soundFieldContribution({ activity, distanceMeters, angleRadians, directivity }: { activity: number; distanceMeters: number; angleRadians: number; directivity: SpeakerDirectivity }) {
  return visualActivity(activity) * directivityFactor(angleRadians, directivity) * distanceFactor(distanceMeters) * rangeFactor(distanceMeters, directivity.visualRangeMeters);
}

export function combineSoundContributions(contributions: readonly number[]) {
  let energy = 0;
  for (const contribution of contributions) energy += contribution * contribution;
  const combined = Math.sqrt(energy);
  return 1 - Math.exp(-SOUND_FIELD_STYLE.compression * combined);
}

export function soundFieldOpacity(combined: number) {
  return Math.pow(clamp01(combined), SOUND_FIELD_STYLE.alphaGamma) * SOUND_FIELD_STYLE.maxOpacity;
}
