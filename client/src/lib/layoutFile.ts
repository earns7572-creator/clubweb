import type { ClubListener, ClubSpeaker } from "@/hooks/useClubAudio";
import { createDefaultEq } from "@/lib/speakerEq";
import { getSpeakerModel, type SpeakerFamily, type SpeakerModelId } from "@/lib/speakerModels";
import type { SurfaceTone } from "@/components/ClubFloor3D";
import type { StackAlignment } from "@/lib/speakerStacking";
import { normalizeCabinetColor } from "@/lib/speakerCabinetColor";

export const LAYOUT_SCHEMA = "club-craft-layout" as const;
export const LAYOUT_VERSION = 1 as const;
const MAX_SPEAKERS = 16;
const surfaceTones = new Set<SurfaceTone>(["paper", "sand", "slate", "night"]);
const speakerFamilies = new Set<SpeakerFamily>(["modern", "reggae", "freeparty", "festival", "hifi", "steppers"]);
const modelIds = new Set<SpeakerModelId>([
  "modern-sub", "modern-woofer", "modern-full", "modern-mid", "modern-high", "reggae-scoop", "reggae-kick", "reggae-mid-horn", "reggae-top",
  "freeparty-wbin", "freeparty-kick-horn", "freeparty-mid-horn", "freeparty-top", "festival-sub", "festival-line-array", "festival-front-fill",
  "hifi-woofer", "hifi-mid-horn", "hifi-tweeter", "steppers-reflex-sub", "steppers-kick", "steppers-mid", "steppers-top",
]);

export type LayoutSpeaker = { key: string; modelId: SpeakerModelId; x: number; y: number; z: number; yaw: number; level: number; muted: boolean; cabinetColor?: string; stackOn: string | null; stackAlign?: StackAlignment };
export type ClubCraftLayoutFile = { schema: typeof LAYOUT_SCHEMA; version: typeof LAYOUT_VERSION; name: string; createdAt: string; family?: SpeakerFamily; surfaceTone?: SurfaceTone; speakers: LayoutSpeaker[]; listener?: { x: number; y: number; z: number; yaw: number; pitch: number } };
export type PresetDataSpeaker = Omit<LayoutSpeaker, "muted" | "stackOn"> & { stackOn?: string };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const isScenePoint = (value: unknown) => isFiniteNumber(value) && value >= 0 && value <= 1;
const fail = (message: string): never => { throw new Error(`Invalid layout: ${message}`); };

function assertNoStackCycles(speakers: LayoutSpeaker[]) {
  const parentByKey = new Map(speakers.map((speaker) => [speaker.key, speaker.stackOn]));
  for (const speaker of speakers) {
    const visited = new Set<string>(); let current: string | null = speaker.key;
    while (current) { if (visited.has(current)) fail("circular stack"); visited.add(current); current = parentByKey.get(current) ?? null; }
  }
}

function parseSpeaker(value: unknown, keys: Set<string>): LayoutSpeaker {
  if (!isRecord(value)) fail("speaker is not an object");
  const record = value as Record<string, unknown>;
  const { key, modelId, x, y, z, yaw, level, muted, cabinetColor, stackOn, stackAlign } = record;
  if (typeof key !== "string" || !/^speaker-\d{2}$/.test(key) || keys.has(key)) fail("speaker key");
  if (typeof modelId !== "string" || !modelIds.has(modelId as SpeakerModelId)) fail("speaker modelId");
  if (!isScenePoint(x) || !isScenePoint(y) || !isScenePoint(z) || !isFiniteNumber(yaw) || !isFiniteNumber(level) || level < .02 || level > 1 || typeof muted !== "boolean") fail("speaker values");
  if (stackOn !== null && typeof stackOn !== "string") fail("stackOn");
  if (stackAlign !== undefined && stackAlign !== "left" && stackAlign !== "center" && stackAlign !== "right") fail("stackAlign");
  if (stackAlign !== undefined && !stackOn) fail("stackAlign");
  if (cabinetColor !== undefined && (typeof cabinetColor !== "string" || !/^#[0-9a-fA-F]{6}$/.test(cabinetColor))) fail("cabinetColor");
  keys.add(key as string); return { key: key as string, modelId: modelId as SpeakerModelId, x: x as number, y: y as number, z: z as number, yaw: yaw as number, level: level as number, muted: muted as boolean, ...(cabinetColor ? { cabinetColor: normalizeCabinetColor(cabinetColor as string) } : {}), stackOn: stackOn as string | null, ...(stackOn ? { stackAlign: (stackAlign ?? "center") as StackAlignment } : {}) };
}

export function createLayoutFile({ speakers, listener, surfaceTone, name = "My Club Craft Layout" }: { speakers: ClubSpeaker[]; listener?: ClubListener; surfaceTone?: SurfaceTone; name?: string }): ClubCraftLayoutFile {
  const keyById = new Map(speakers.map((speaker, index) => [speaker.id, `speaker-${String(index + 1).padStart(2, "0")}`]));
  const models = speakers.map((speaker) => getSpeakerModel(speaker.modelId, speaker.kind));
  const family = models.length && models.every((model) => model.family === models[0].family) ? models[0].family : undefined;
  return {
    schema: LAYOUT_SCHEMA, version: LAYOUT_VERSION, name, createdAt: new Date().toISOString(), ...(family ? { family } : {}), ...(surfaceTone ? { surfaceTone } : {}),
    speakers: speakers.map((speaker, index) => ({ key: `speaker-${String(index + 1).padStart(2, "0")}`, modelId: getSpeakerModel(speaker.modelId, speaker.kind).id, x: speaker.position.x, y: speaker.position.y, z: speaker.position.z, yaw: speaker.orientation?.yaw ?? 0, level: speaker.level, muted: speaker.muted, ...(speaker.cabinetColor ? { cabinetColor: normalizeCabinetColor(speaker.cabinetColor) } : {}), stackOn: speaker.stackParentId ? keyById.get(speaker.stackParentId) ?? null : null, ...(speaker.stackParentId ? { stackAlign: speaker.stackAlign ?? "center" } : {}) })),
    ...(listener ? { listener: { x: listener.position.x, y: listener.position.y, z: listener.position.z, yaw: listener.orientation.yaw, pitch: listener.orientation.pitch } } : {}),
  };
}

export const serializeLayout = (input: Parameters<typeof createLayoutFile>[0]) => JSON.stringify(createLayoutFile(input), null, 2);

export function parseLayoutFile(text: string): ClubCraftLayoutFile {
  let value: unknown; try { value = JSON.parse(text); } catch { return fail("malformed JSON"); }
  if (!isRecord(value)) fail("schema or version");
  const record = value as Record<string, unknown>;
  if (record.schema !== LAYOUT_SCHEMA || record.version !== LAYOUT_VERSION || typeof record.name !== "string" || typeof record.createdAt !== "string" || !Array.isArray(record.speakers)) fail("schema or version");
  const rawSpeakers = record.speakers as unknown[];
  if (rawSpeakers.length < 1 || rawSpeakers.length > MAX_SPEAKERS) fail("speaker count");
  if (record.family !== undefined && (typeof record.family !== "string" || !speakerFamilies.has(record.family as SpeakerFamily))) fail("family");
  if (record.surfaceTone !== undefined && (typeof record.surfaceTone !== "string" || !surfaceTones.has(record.surfaceTone as SurfaceTone))) fail("surfaceTone");
  const keys = new Set<string>(); const speakers = rawSpeakers.map((speaker) => parseSpeaker(speaker, keys));
  for (const speaker of speakers) if (speaker.stackOn && (!keys.has(speaker.stackOn) || speaker.stackOn === speaker.key)) fail("stackOn");
  assertNoStackCycles(speakers);
  let listener: ClubCraftLayoutFile["listener"];
  if (record.listener !== undefined) { if (!isRecord(record.listener)) fail("listener"); const listenerRecord = record.listener as Record<string, unknown>; if (!isScenePoint(listenerRecord.x) || !isScenePoint(listenerRecord.y) || !isScenePoint(listenerRecord.z) || !isFiniteNumber(listenerRecord.yaw) || !isFiniteNumber(listenerRecord.pitch)) fail("listener"); listener = { x: listenerRecord.x as number, y: listenerRecord.y as number, z: listenerRecord.z as number, yaw: listenerRecord.yaw as number, pitch: listenerRecord.pitch as number }; }
  return { schema: LAYOUT_SCHEMA, version: LAYOUT_VERSION, name: record.name as string, createdAt: record.createdAt as string, ...(record.family ? { family: record.family as SpeakerFamily } : {}), ...(record.surfaceTone ? { surfaceTone: record.surfaceTone as SurfaceTone } : {}), speakers, ...(listener ? { listener } : {}) };
}

export function layoutToClubSpeakers(layout: ClubCraftLayoutFile, runtimeSeed = Date.now()): ClubSpeaker[] {
  const idByKey = new Map(layout.speakers.map((speaker, index) => [speaker.key, `${speaker.modelId}-${runtimeSeed}-${index}`]));
  return layout.speakers.map((speaker) => { const model = getSpeakerModel(speaker.modelId, "sub"); return { id: idByKey.get(speaker.key)!, modelId: speaker.modelId, kind: model.kind, label: model.label, position: { x: speaker.x, y: speaker.y, z: speaker.z }, orientation: { yaw: speaker.yaw }, stackParentId: speaker.stackOn ? idByKey.get(speaker.stackOn) ?? null : null, ...(speaker.stackOn ? { stackAlign: speaker.stackAlign ?? "center" } : {}), ...(speaker.cabinetColor ? { cabinetColor: normalizeCabinetColor(speaker.cabinetColor) } : {}), level: speaker.level, muted: speaker.muted, responseProfileId: speaker.modelId, activity: 0, eq: createDefaultEq() }; });
}

export const layoutToPresetData = (layout: ClubCraftLayoutFile): PresetDataSpeaker[] => layout.speakers.map(({ key, modelId, x, y, z, yaw, level, stackOn, stackAlign }) => ({ key, modelId, x, y, z, yaw, level, ...(stackOn ? { stackOn, stackAlign: stackAlign ?? "center" } : {}) }));
