/* Club Craft stacking rule: one physical column is a single parent→child chain; effective XY and height derive from the tree rather than duplicated child coordinates. */
import type { ClubSpeaker, Position3D } from "@/hooks/useClubAudio";
import { normalizedZToMeters, speakerBodyForSpeaker } from "@/lib/speakerDimensions";

export const STACK_ROOM_METERS = { width: 13, depth: 8 } as const;
export const STACK_ENTER_FACTOR = .28;
export const STACK_RELEASE_FACTOR = .4;
export type StackPoint = Pick<Position3D, "x" | "y">;
export type StackAlignment = "left" | "center" | "right";
export type StackCandidate = { parentId: string; alignment: StackAlignment; score: number };
export const stackAlignmentForSpeaker = (speaker: ClubSpeaker): StackAlignment => speaker.stackParentId && speaker.stackAlign ? speaker.stackAlign : "center";

function stackAlignmentOffsetMeters(parent: ClubSpeaker, child: ClubSpeaker, alignment: StackAlignment) {
  const parentWidth = speakerBodyForSpeaker(parent).width; const childWidth = speakerBodyForSpeaker(child).width;
  if (alignment === "left") return (childWidth - parentWidth) / 2;
  if (alignment === "right") return (parentWidth - childWidth) / 2;
  return 0;
}

export function stackFrontFlushOffsetMeters(parent: ClubSpeaker, child: ClubSpeaker) {
  const parentDepth = speakerBodyForSpeaker(parent).depth; const childDepth = speakerBodyForSpeaker(child).depth; const parentYaw = parent.orientation?.yaw ?? 0; const childYaw = child.orientation?.yaw ?? 0;
  return parentDepth / 2 - childDepth / 2 * Math.cos(childYaw - parentYaw);
}

export function stackAlignmentPoint(parent: ClubSpeaker, child: ClubSpeaker, parentPoint: StackPoint, alignment: StackAlignment): StackPoint {
  const lateralOffset = stackAlignmentOffsetMeters(parent, child, alignment); const frontOffset = stackFrontFlushOffsetMeters(parent, child); const yaw = parent.orientation?.yaw ?? 0;
  return {
    x: parentPoint.x + (Math.cos(yaw) * lateralOffset + Math.sin(yaw) * frontOffset) / STACK_ROOM_METERS.width,
    y: parentPoint.y + (-Math.sin(yaw) * lateralOffset + Math.cos(yaw) * frontOffset) / STACK_ROOM_METERS.depth,
  };
}

export function findStackAlignment(parent: ClubSpeaker, child: ClubSpeaker, parentPoint: StackPoint, point: StackPoint): StackAlignment {
  let best: { alignment: StackAlignment; score: number } = { alignment: "center", score: Infinity };
  for (const alignment of ["left", "center", "right"] as const) { const anchor = stackAlignmentPoint(parent, child, parentPoint, alignment); const score = Math.hypot(point.x - anchor.x, point.y - anchor.y); if (score < best.score) best = { alignment, score }; }
  return best.alignment;
}

export function createStackResolver(speakers: ClubSpeaker[]) {
  const byId = new Map(speakers.map((speaker) => [speaker.id, speaker])); const childByParent = new Map<string, ClubSpeaker>(); const bottomCache = new Map<string, number>(); const xyCache = new Map<string, StackPoint>();
  speakers.forEach((speaker) => { if (speaker.stackParentId && !childByParent.has(speaker.stackParentId)) childByParent.set(speaker.stackParentId, speaker); });
  const getBottomMeters = (speakerOrId: ClubSpeaker | string, visited = new Set<string>()): number => { const speaker = typeof speakerOrId === "string" ? byId.get(speakerOrId) : speakerOrId; if (!speaker) return 0; const cached = bottomCache.get(speaker.id); if (cached !== undefined) return cached; const base = normalizedZToMeters(speaker.position.z); if (!speaker.stackParentId || visited.has(speaker.id)) { bottomCache.set(speaker.id, base); return base; } const parent = byId.get(speaker.stackParentId); if (!parent) { bottomCache.set(speaker.id, base); return base; } const nextVisited = new Set(visited); nextVisited.add(speaker.id); const bottom = getBottomMeters(parent, nextVisited) + speakerBodyForSpeaker(parent).height; bottomCache.set(speaker.id, bottom); return bottom; };
  const getCenterMeters = (speakerOrId: ClubSpeaker | string) => { const speaker = typeof speakerOrId === "string" ? byId.get(speakerOrId) : speakerOrId; return speaker ? getBottomMeters(speaker) + speakerBodyForSpeaker(speaker).height / 2 : 0; };
  const getXY = (speakerOrId: ClubSpeaker | string, visited = new Set<string>()): StackPoint => { const speaker = typeof speakerOrId === "string" ? byId.get(speakerOrId) : speakerOrId; if (!speaker) return { x: .5, y: .5 }; const cached = xyCache.get(speaker.id); if (cached) return cached; if (!speaker.stackParentId || visited.has(speaker.id)) { const point = { x: speaker.position.x, y: speaker.position.y }; xyCache.set(speaker.id, point); return point; } const parent = byId.get(speaker.stackParentId); if (!parent) return { x: speaker.position.x, y: speaker.position.y }; const nextVisited = new Set(visited); nextVisited.add(speaker.id); const point = stackAlignmentPoint(parent, speaker, getXY(parent, nextVisited), stackAlignmentForSpeaker(speaker)); xyCache.set(speaker.id, point); return point; };
  const getStackTop = (rootId: string) => { let current = rootId; const visited = new Set<string>(); while (!visited.has(current)) { visited.add(current); const child = childByParent.get(current); if (!child) return current; current = child.id; } return rootId; };
  const isDescendant = (candidateParentId: string, childId: string) => { let current = byId.get(candidateParentId); const visited = new Set<string>(); while (current?.stackParentId && !visited.has(current.id)) { if (current.stackParentId === childId) return true; visited.add(current.id); current = byId.get(current.stackParentId); } return false; };
  const getSubtreeIds = (rootId: string) => { const ids = new Set<string>(); let current = rootId; const visited = new Set<string>(); while (!visited.has(current)) { ids.add(current); visited.add(current); const child = childByParent.get(current); if (!child) break; current = child.id; } return ids; };
  return { byId, childByParent, getBottomMeters, getCenterMeters, getXY, getStackTop, isDescendant, getSubtreeIds };
}

export const resolveStackBottomMeters = (speaker: ClubSpeaker, speakers: ClubSpeaker[]) => createStackResolver(speakers).getBottomMeters(speaker);
export const resolveSpeakerCenterMeters = (speaker: ClubSpeaker, speakers: ClubSpeaker[]) => createStackResolver(speakers).getCenterMeters(speaker);
export const resolveStackXY = (speaker: ClubSpeaker, speakers: ClubSpeaker[]) => createStackResolver(speakers).getXY(speaker);
export const isDescendant = (speakers: ClubSpeaker[], candidateParentId: string, childId: string) => createStackResolver(speakers).isDescendant(candidateParentId, childId);

export function findStackCandidate({ dragged, point, speakers, previousParentId }: { dragged: ClubSpeaker; point: StackPoint; speakers: ClubSpeaker[]; previousParentId?: string | null }) {
  const resolver = createStackResolver(speakers); const draggedBody = speakerBodyForSpeaker(dragged); let best: StackCandidate | null = null;
  for (const target of speakers) { const topId = resolver.getStackTop(target.id); if (target.id !== topId || topId === dragged.id || resolver.isDescendant(topId, dragged.id)) continue; const top = resolver.byId.get(topId); if (!top) continue; const xy = resolver.getXY(top); const targetBody = speakerBodyForSpeaker(top); const factor = previousParentId === topId ? STACK_RELEASE_FACTOR : STACK_ENTER_FACTOR; const thresholdX = Math.max(draggedBody.width, targetBody.width) / STACK_ROOM_METERS.width * factor; const thresholdY = Math.max(draggedBody.depth, targetBody.depth) / STACK_ROOM_METERS.depth * factor; const dx = Math.abs(point.x - xy.x); const dy = Math.abs(point.y - xy.y); if (dx > thresholdX || dy > thresholdY) continue; for (const alignment of ["left", "center", "right"] as const) { const anchor = stackAlignmentPoint(top, dragged, xy, alignment); const score = Math.hypot((point.x - anchor.x) / thresholdX, (point.y - anchor.y) / thresholdY); if (!best || score < best.score) best = { parentId: topId, alignment, score }; } }
  return best;
}

export function isWithinStackFootprint(speaker: ClubSpeaker, point: StackPoint, speakers: ClubSpeaker[], factor = STACK_RELEASE_FACTOR) { const resolver = createStackResolver(speakers); const xy = resolver.getXY(speaker); const body = speakerBodyForSpeaker(speaker); return Math.abs(point.x - xy.x) <= body.width / STACK_ROOM_METERS.width * factor && Math.abs(point.y - xy.y) <= body.depth / STACK_ROOM_METERS.depth * factor; }

export function removeSpeakerFromStack(speakers: ClubSpeaker[], id: string) { const removed = speakers.find((speaker) => speaker.id === id); if (!removed) return speakers; return speakers.filter((speaker) => speaker.id !== id).map((speaker) => speaker.stackParentId === id ? { ...speaker, stackParentId: removed.stackParentId ?? null, ...(removed.stackParentId ? { stackAlign: stackAlignmentForSpeaker(removed) } : { stackAlign: undefined }) } : speaker); }
