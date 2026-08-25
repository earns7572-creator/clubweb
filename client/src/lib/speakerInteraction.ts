/* SYSTM interaction rule: click selects; only a deliberate pointer displacement moves a physical cabinet or its complete stack. */
import type { ClubSpeaker } from "@/hooks/useClubAudio";
import { speakerBodyForSpeaker } from "@/lib/speakerDimensions";
import { snapYaw } from "@/lib/speakerOrientation";
import { createStackResolver, STACK_ROOM_METERS } from "@/lib/speakerStacking";

export type LayoutPoint = { x: number; y: number };
export type LayoutBounds = { minX: number; maxX: number; minY: number; maxY: number };

export const ROOM_LAYOUT_BOUNDS: LayoutBounds = { minX: .02, maxX: .98, minY: .02, maxY: .98 };
export const POINTER_DRAG_THRESHOLD_PX = { mouse: 5, touch: 10 } as const;
export const POINTER_HIT_TARGET_PX = { desktop: 48, mobile: 66 } as const;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function exceedsDragThreshold(start: LayoutPoint, current: LayoutPoint, pointerType: string | undefined) {
  const threshold = pointerType === "touch" || pointerType === "pen" ? POINTER_DRAG_THRESHOLD_PX.touch : POINTER_DRAG_THRESHOLD_PX.mouse;
  return Math.hypot(current.x - start.x, current.y - start.y) >= threshold;
}

export function pointerIntent(start: LayoutPoint, current: LayoutPoint, pointerType: string | undefined): "select" | "drag" {
  return exceedsDragThreshold(start, current, pointerType) ? "drag" : "select";
}

export function interactionTargetMeters(speaker: ClubSpeaker, stacked: boolean, worldPerPixel: number, mobile: boolean) {
  const body = speakerBodyForSpeaker(speaker);
  if (stacked) return { width: body.width, depth: body.depth };
  const targetMeters = POINTER_HIT_TARGET_PX[mobile ? "mobile" : "desktop"] * worldPerPixel;
  return { width: Math.max(body.width, targetMeters), depth: Math.max(body.depth, targetMeters) };
}

export function resolveStackRootId(speakers: ClubSpeaker[], id: string) {
  const byId = new Map(speakers.map((speaker) => [speaker.id, speaker]));
  let current = byId.get(id); const visited = new Set<string>();
  while (current?.stackParentId && !visited.has(current.id)) { visited.add(current.id); current = byId.get(current.stackParentId); }
  return current?.id ?? id;
}

function safeBoundsForOffset(speaker: ClubSpeaker, offset: LayoutPoint, bounds: LayoutBounds) {
  const body = speakerBodyForSpeaker(speaker);
  const yaw = speaker.orientation?.yaw ?? 0;
  const halfWidth = (Math.abs(Math.cos(yaw)) * body.width + Math.abs(Math.sin(yaw)) * body.depth) / 2 / STACK_ROOM_METERS.width;
  const halfDepth = (Math.abs(Math.sin(yaw)) * body.width + Math.abs(Math.cos(yaw)) * body.depth) / 2 / STACK_ROOM_METERS.depth;
  return {
    minX: bounds.minX + halfWidth - offset.x,
    maxX: bounds.maxX - halfWidth - offset.x,
    minY: bounds.minY + halfDepth - offset.y,
    maxY: bounds.maxY - halfDepth - offset.y,
  };
}

export function clampStackRootPoint(speakers: ClubSpeaker[], requestedRootId: string, point: LayoutPoint, bounds: LayoutBounds = ROOM_LAYOUT_BOUNDS): LayoutPoint {
  const rootId = resolveStackRootId(speakers, requestedRootId); const resolver = createStackResolver(speakers); const root = resolver.byId.get(rootId);
  if (!root) return { x: clamp(point.x, bounds.minX, bounds.maxX), y: clamp(point.y, bounds.minY, bounds.maxY) };
  const rootPoint = resolver.getXY(root); const subtree = resolver.getSubtreeIds(rootId);
  let minX = bounds.minX; let maxX = bounds.maxX; let minY = bounds.minY; let maxY = bounds.maxY;
  subtree.forEach((id) => {
    const member = resolver.byId.get(id); if (!member) return;
    const memberPoint = resolver.getXY(member); const memberBounds = safeBoundsForOffset(member, { x: memberPoint.x - rootPoint.x, y: memberPoint.y - rootPoint.y }, bounds);
    minX = Math.max(minX, memberBounds.minX); maxX = Math.min(maxX, memberBounds.maxX); minY = Math.max(minY, memberBounds.minY); maxY = Math.min(maxY, memberBounds.maxY);
  });
  return { x: clamp(point.x, minX, maxX), y: clamp(point.y, minY, maxY) };
}

export function moveStackRoot(speakers: ClubSpeaker[], requestedId: string, point: LayoutPoint, bounds: LayoutBounds = ROOM_LAYOUT_BOUNDS) {
  const rootId = resolveStackRootId(speakers, requestedId); const safePoint = clampStackRootPoint(speakers, rootId, point, bounds);
  return speakers.map((speaker) => speaker.id === rootId ? { ...speaker, position: { ...speaker.position, x: safePoint.x, y: safePoint.y } } : speaker);
}

export function detachSpeakerExplicitly(speakers: ClubSpeaker[], id: string) {
  const resolver = createStackResolver(speakers); const speaker = resolver.byId.get(id);
  if (!speaker?.stackParentId) return speakers;
  const effectivePoint = resolver.getXY(speaker);
  return speakers.map((item) => item.id === id ? { ...item, stackParentId: null, stackAlign: undefined, position: { ...item.position, x: effectivePoint.x, y: effectivePoint.y, z: 0 } } : item);
}

export function rotateSpeakerWithoutDetach(speakers: ClubSpeaker[], id: string, yaw: number) {
  return speakers.map((speaker) => speaker.id === id ? { ...speaker, orientation: { yaw: snapYaw(yaw) } } : speaker);
}
