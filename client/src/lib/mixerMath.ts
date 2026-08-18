/**
 * Club Craft Mixer — PA-style dB control for the existing linear Speaker level.
 * This module changes presentation only; Web Audio still receives speaker.level.
 */
export const MIXER_MIN_LINEAR = .02;
export const MIXER_MAX_LINEAR = 1;
export const MIXER_MIN_DB = 20 * Math.log10(MIXER_MIN_LINEAR);
export const MIXER_MAX_DB = 0;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function linearToDb(linear: number) {
  return 20 * Math.log10(clamp(linear, MIXER_MIN_LINEAR, MIXER_MAX_LINEAR));
}

export function dbToLinear(db: number) {
  return clamp(Math.pow(10, clamp(db, MIXER_MIN_DB, MIXER_MAX_DB) / 20), MIXER_MIN_LINEAR, MIXER_MAX_LINEAR);
}

export function dbToFaderPosition(db: number) {
  return (clamp(db, MIXER_MIN_DB, MIXER_MAX_DB) - MIXER_MIN_DB) / (MIXER_MAX_DB - MIXER_MIN_DB);
}

export function faderPositionToDb(position: number) {
  return MIXER_MIN_DB + clamp(position, 0, 1) * (MIXER_MAX_DB - MIXER_MIN_DB);
}

export function formatDb(linear: number) {
  const db = linearToDb(linear);
  if (db <= MIXER_MIN_DB + .08) return "−34 dB";
  if (Math.abs(db) < .05) return "0.0 dB";
  return `${db > -10 ? "−" : ""}${Math.abs(db).toFixed(1)} dB`;
}
