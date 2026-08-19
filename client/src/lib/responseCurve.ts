/** Pure electrical Filter Response calculations — no AudioNodes are created for UI rendering. */
import type { ClubSpeaker } from "@/hooks/useClubAudio";
import { filterForKind } from "@/lib/speakerProfiles";

export type VisualFilter = { type: BiquadFilterType; frequency: number; q?: number; gainDb?: number };
export type ResponsePoint = { frequency: number; db: number };
export const GRAPH_MIN_DB = -48;
export const GRAPH_MAX_DB = 12;
export const GRAPH_MIN_FREQUENCY = 20;
export const GRAPH_MAX_FREQUENCY = 20_000;
const SAMPLE_RATE = 48_000;

export function createLogFrequencyBins(count = 240, min = GRAPH_MIN_FREQUENCY, max = GRAPH_MAX_FREQUENCY) { return Array.from({ length: count }, (_, index) => min * Math.pow(max / min, index / (count - 1))); }
export const RESPONSE_FREQUENCIES = createLogFrequencyBins();
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const frequencyToX = (frequency: number, width: number) => ((Math.log10(frequency) - Math.log10(GRAPH_MIN_FREQUENCY)) / (Math.log10(GRAPH_MAX_FREQUENCY) - Math.log10(GRAPH_MIN_FREQUENCY))) * width;
export const xToFrequency = (x: number, width: number) => GRAPH_MIN_FREQUENCY * Math.pow(GRAPH_MAX_FREQUENCY / GRAPH_MIN_FREQUENCY, clamp(x / width, 0, 1));
export const dbToY = (db: number, height: number) => height - ((clamp(db, GRAPH_MIN_DB, GRAPH_MAX_DB) - GRAPH_MIN_DB) / (GRAPH_MAX_DB - GRAPH_MIN_DB)) * height;
export const yToGainDb = (y: number, height: number) => clamp(GRAPH_MAX_DB - clamp(y / height, 0, 1) * (GRAPH_MAX_DB - GRAPH_MIN_DB), -12, 12);

export function speakerFilters(speaker: ClubSpeaker): VisualFilter[] {
  const typeFilter = filterForKind[speaker.kind];
  return [{ ...typeFilter }, { type: "lowshelf", frequency: speaker.eq.low.frequency, gainDb: speaker.eq.low.gainDb }, { type: "peaking", frequency: speaker.eq.lowMid.frequency, gainDb: speaker.eq.lowMid.gainDb, q: speaker.eq.lowMid.q }, { type: "peaking", frequency: speaker.eq.highMid.frequency, gainDb: speaker.eq.highMid.gainDb, q: speaker.eq.highMid.q }, { type: "highshelf", frequency: speaker.eq.high.frequency, gainDb: speaker.eq.high.gainDb }];
}

function coefficients(filter: VisualFilter) {
  const omega = 2 * Math.PI * clamp(filter.frequency, 1, SAMPLE_RATE / 2 - 1) / SAMPLE_RATE; const cos = Math.cos(omega); const sin = Math.sin(omega); const q = Math.max(.0001, filter.q ?? .7071); const gain = filter.gainDb ?? 0; const A = Math.pow(10, gain / 40); const alpha = sin / (2 * q); const beta = 2 * Math.sqrt(A) * alpha;
  let b0 = 1; let b1 = 0; let b2 = 0; let a0 = 1; let a1 = 0; let a2 = 0;
  if (filter.type === "lowpass") { b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = b0; a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha; }
  else if (filter.type === "highpass") { b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = b0; a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha; }
  else if (filter.type === "bandpass") { b0 = sin / 2; b1 = 0; b2 = -sin / 2; a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha; }
  else if (filter.type === "allpass") { b0 = 1 - alpha; b1 = -2 * cos; b2 = 1 + alpha; a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha; }
  else if (filter.type === "peaking") { b0 = 1 + alpha * A; b1 = -2 * cos; b2 = 1 - alpha * A; a0 = 1 + alpha / A; a1 = -2 * cos; a2 = 1 - alpha / A; }
  else if (filter.type === "lowshelf") { b0 = A * ((A + 1) - (A - 1) * cos + beta); b1 = 2 * A * ((A - 1) - (A + 1) * cos); b2 = A * ((A + 1) - (A - 1) * cos - beta); a0 = (A + 1) + (A - 1) * cos + beta; a1 = -2 * ((A - 1) + (A + 1) * cos); a2 = (A + 1) + (A - 1) * cos - beta; }
  else if (filter.type === "highshelf") { b0 = A * ((A + 1) + (A - 1) * cos + beta); b1 = -2 * A * ((A - 1) + (A + 1) * cos); b2 = A * ((A + 1) + (A - 1) * cos - beta); a0 = (A + 1) - (A - 1) * cos + beta; a1 = 2 * ((A - 1) - (A + 1) * cos); a2 = (A + 1) - (A - 1) * cos - beta; }
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}
export function calculateMagnitude(filter: VisualFilter, frequency: number) { const c = coefficients(filter); const w = 2 * Math.PI * frequency / SAMPLE_RATE; const cos = Math.cos(w); const sin = Math.sin(w); const cos2 = Math.cos(2 * w); const sin2 = Math.sin(2 * w); const numerator = Math.hypot(c.b0 + c.b1 * cos + c.b2 * cos2, -c.b1 * sin - c.b2 * sin2); const denominator = Math.hypot(1 + c.a1 * cos + c.a2 * cos2, -c.a1 * sin - c.a2 * sin2); return numerator / Math.max(denominator, 1e-12); }
export function calculateCombinedMagnitudeDb(filters: VisualFilter[], frequency: number) { return 20 * Math.log10(Math.max(filters.reduce((total, filter) => total * calculateMagnitude(filter, frequency), 1), 1e-6)); }
export function getSpeakerResponse(speaker: ClubSpeaker): ResponsePoint[] { const filters = speakerFilters(speaker); return RESPONSE_FREQUENCIES.map((frequency) => ({ frequency, db: calculateCombinedMagnitudeDb(filters, frequency) })); }
export function responseToPath(response: ResponsePoint[], width: number, height: number) { return response.map((point, index) => `${index ? "L" : "M"}${frequencyToX(point.frequency, width)},${dbToY(point.db, height)}`).join(" "); }
export function findIntersections(a: ResponsePoint[], b: ResponsePoint[]) { const intersections: ResponsePoint[] = []; for (let index = 1; index < Math.min(a.length, b.length); index += 1) { const previous = a[index - 1].db - b[index - 1].db; const current = a[index].db - b[index].db; if (previous * current < 0 && Math.abs(previous - current) > .15 && (Math.abs(previous) > .05 || Math.abs(current) > .05)) intersections.push({ frequency: Math.sqrt(a[index - 1].frequency * a[index].frequency), db: (a[index].db + b[index].db) / 2 }); } return intersections; }
