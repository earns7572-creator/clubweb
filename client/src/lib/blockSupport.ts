/* BLOCK rule: supports are physical scene objects, never audio sources. A block is a single-height cubic support that can rest on the floor or another block. */
import type { ClubSpeaker } from "@/hooks/useClubAudio";
import { metersToNormalizedZ, speakerBodyForSpeaker, SPEAKER_BODY } from "@/lib/speakerDimensions";
import { STACK_ROOM_METERS, type StackPoint } from "@/lib/speakerStacking";
import { minimumTranslation, physicalFootprintsForScene, type PhysicalFootprint } from "@/lib/physicalPlacement";

export const BLOCK_WIDTH_METERS = 1.2;
export const BLOCK_DEPTH_METERS = 1.2;
export const BLOCK_HEIGHT_METERS = Object.values(SPEAKER_BODY).reduce((sum, body) => sum + body.height, 0) / Object.values(SPEAKER_BODY).length;
export const BLOCK_STACK_ENTER_FACTOR = .34;
export const BLOCK_STACK_RELEASE_FACTOR = .48;

export type SupportBlock = {
  id: string;
  label: "BLOCK";
  position: StackPoint;
  stackParentId: string | null;
  orientation?: { yaw: number };
  dimensions?: { width: number; height: number; depth: number };
  color?: string;
};

export type BlockStackCandidate = { parentId: string; score: number };
export type SpeakerBlockCandidate = { blockId: string; score: number };

const roomPoint = (point: StackPoint) => ({ x: (point.x - .5) * STACK_ROOM_METERS.width, z: (point.y - .5) * STACK_ROOM_METERS.depth });
const pointDistance = (a: StackPoint, b: StackPoint) => Math.hypot((a.x - b.x) * STACK_ROOM_METERS.width, (a.y - b.y) * STACK_ROOM_METERS.depth);
export const blockDimensions = (block?: Pick<SupportBlock, "dimensions">) => block?.dimensions ?? { width: BLOCK_WIDTH_METERS, height: BLOCK_HEIGHT_METERS, depth: BLOCK_DEPTH_METERS };

export function createBlockResolver(blocks: SupportBlock[]) {
  const byId = new Map(blocks.map((block) => [block.id, block]));
  const childByParent = new Map<string, SupportBlock>();
  blocks.forEach((block) => { if (block.stackParentId && !childByParent.has(block.stackParentId)) childByParent.set(block.stackParentId, block); });
  const bottomCache = new Map<string, number>();
  const xyCache = new Map<string, StackPoint>();
  const getBottomMeters = (blockOrId: SupportBlock | string, visited = new Set<string>()): number => {
    const block = typeof blockOrId === "string" ? byId.get(blockOrId) : blockOrId;
    if (!block) return 0;
    const cached = bottomCache.get(block.id);
    if (cached !== undefined) return cached;
    if (!block.stackParentId || visited.has(block.id)) { bottomCache.set(block.id, 0); return 0; }
    const parent = byId.get(block.stackParentId);
    if (!parent) { bottomCache.set(block.id, 0); return 0; }
    const nextVisited = new Set(visited); nextVisited.add(block.id);
    const bottom = getBottomMeters(parent, nextVisited) + blockDimensions(parent).height;
    bottomCache.set(block.id, bottom);
    return bottom;
  };
  const getTopMeters = (blockOrId: SupportBlock | string) => { const block = typeof blockOrId === "string" ? byId.get(blockOrId) : blockOrId; return getBottomMeters(blockOrId) + blockDimensions(block).height; };
  const getCenterMeters = (blockOrId: SupportBlock | string) => { const block = typeof blockOrId === "string" ? byId.get(blockOrId) : blockOrId; return getBottomMeters(blockOrId) + blockDimensions(block).height / 2; };
  const getXY = (blockOrId: SupportBlock | string, visited = new Set<string>()): StackPoint => {
    const block = typeof blockOrId === "string" ? byId.get(blockOrId) : blockOrId;
    if (!block) return { x: .5, y: .5 };
    const cached = xyCache.get(block.id);
    if (cached) return cached;
    if (!block.stackParentId || visited.has(block.id)) { const point = { ...block.position }; xyCache.set(block.id, point); return point; }
    const parent = byId.get(block.stackParentId);
    if (!parent) return { ...block.position };
    const nextVisited = new Set(visited); nextVisited.add(block.id);
    const point = getXY(parent, nextVisited); xyCache.set(block.id, point); return point;
  };
  const getStackTop = (rootId: string) => { let current = rootId; const visited = new Set<string>(); while (!visited.has(current)) { visited.add(current); const child = childByParent.get(current); if (!child) return current; current = child.id; } return rootId; };
  const isDescendant = (candidateParentId: string, childId: string) => { let current = byId.get(candidateParentId); const visited = new Set<string>(); while (current?.stackParentId && !visited.has(current.id)) { if (current.stackParentId === childId) return true; visited.add(current.id); current = byId.get(current.stackParentId); } return false; };
  const getSubtreeIds = (rootId: string) => { const ids = new Set<string>(); let current = rootId; const visited = new Set<string>(); while (!visited.has(current)) { ids.add(current); visited.add(current); const child = childByParent.get(current); if (!child) break; current = child.id; } return ids; };
  return { byId, childByParent, getBottomMeters, getTopMeters, getCenterMeters, getXY, getStackTop, isDescendant, getSubtreeIds };
}

export function blockFootprintSize(block: SupportBlock) {
  const dimensions = blockDimensions(block); return { ...dimensions, yaw: block.orientation?.yaw ?? 0, center: roomPoint(block.position) };
}

export function findBlockStackCandidate({ dragged, point, blocks, previousParentId, minimumTargetMeters = 0 }: { dragged: SupportBlock; point: StackPoint; blocks: SupportBlock[]; previousParentId?: string | null; minimumTargetMeters?: number }) {
  const resolver = createBlockResolver(blocks); let best: BlockStackCandidate | null = null;
  for (const target of blocks) {
    const topId = resolver.getStackTop(target.id);
    if (target.id !== topId || topId === dragged.id || resolver.isDescendant(topId, dragged.id)) continue;
    const targetPoint = resolver.getXY(topId); const targetBlock = resolver.byId.get(topId); const threshold = Math.max(blockDimensions(dragged).width * (previousParentId === topId ? BLOCK_STACK_RELEASE_FACTOR : BLOCK_STACK_ENTER_FACTOR), blockDimensions(targetBlock).width * .2, minimumTargetMeters);
    const distance = pointDistance(point, targetPoint);
    if (distance > threshold) continue;
    const score = distance / threshold;
    if (!best || score < best.score) best = { parentId: topId, score };
  }
  return best;
}

export function findSpeakerBlockCandidate({ speaker, point, blocks, minimumTargetMeters = 0 }: { speaker: ClubSpeaker; point: StackPoint; blocks: SupportBlock[]; minimumTargetMeters?: number }) {
  const resolver = createBlockResolver(blocks); const body = speakerBodyForSpeaker(speaker); let best: SpeakerBlockCandidate | null = null;
  for (const block of blocks) {
    if (resolver.getStackTop(block.id) !== block.id) continue;
    const target = resolver.getXY(block); const dimensions = blockDimensions(block); const thresholdX = Math.max(Math.max(body.width, dimensions.width) * .42, minimumTargetMeters) / STACK_ROOM_METERS.width; const thresholdY = Math.max(Math.max(body.depth, dimensions.depth) * .42, minimumTargetMeters) / STACK_ROOM_METERS.depth;
    const dx = Math.abs(point.x - target.x); const dy = Math.abs(point.y - target.y);
    if (dx > thresholdX || dy > thresholdY) continue;
    const score = Math.hypot(dx / thresholdX, dy / thresholdY);
    if (!best || score < best.score) best = { blockId: block.id, score };
  }
  return best;
}

export function supportBlockIdsForRoot(blocks: SupportBlock[], rootId: string) { return createBlockResolver(blocks).getSubtreeIds(rootId); }

export function normalizeSpeakerSupportHeights(speakers: ClubSpeaker[], blocks: SupportBlock[]) {
  const resolver = createBlockResolver(blocks);
  return speakers.map((speaker) => {
    if (speaker.stackParentId) return { ...speaker, position: { ...speaker.position, z: 0 } };
    const block = speaker.supportBlockId ? resolver.byId.get(speaker.supportBlockId) : undefined;
    const z = block ? metersToNormalizedZ(resolver.getTopMeters(block)) : 0;
    return { ...speaker, position: { ...speaker.position, z } };
  });
}

export function syncSpeakerSupportPositions(speakers: ClubSpeaker[], blocks: SupportBlock[]) {
  const resolver = createBlockResolver(blocks);
  return normalizeSpeakerSupportHeights(speakers, blocks).map((speaker) => {
    if (speaker.stackParentId || !speaker.supportBlockId) return speaker;
    const block = resolver.byId.get(speaker.supportBlockId);
    if (!block) return { ...speaker, supportBlockId: null, position: { ...speaker.position, z: 0 } };
    const point = resolver.getXY(block);
    return { ...speaker, position: { ...speaker.position, x: point.x, y: point.y } };
  });
}

export function clampBlockPoint(point: StackPoint, dimensions = blockDimensions()) {
  const halfX = dimensions.width / STACK_ROOM_METERS.width / 2; const halfY = dimensions.depth / STACK_ROOM_METERS.depth / 2;
  return { x: Math.max(.02 + halfX, Math.min(.98 - halfX, point.x)), y: Math.max(.02 + halfY, Math.min(.98 - halfY, point.y)) };
}

const worldPoint = (point: StackPoint) => ({ x: (point.x - .5) * STACK_ROOM_METERS.width, z: (point.y - .5) * STACK_ROOM_METERS.depth });
const pointFromWorld = (point: { x: number; z: number }): StackPoint => ({ x: point.x / STACK_ROOM_METERS.width + .5, y: point.z / STACK_ROOM_METERS.depth + .5 });
const addWorld = (a: { x: number; z: number }, b: { x: number; z: number }) => ({ x: a.x + b.x, z: a.z + b.z });
const subtractWorld = (a: { x: number; z: number }, b: { x: number; z: number }) => ({ x: a.x - b.x, z: a.z - b.z });
const blockRootId = (blocks: SupportBlock[], requestedId: string) => {
  const resolver = createBlockResolver(blocks); let current = resolver.byId.get(requestedId); const visited = new Set<string>();
  while (current?.stackParentId && !visited.has(current.id)) { visited.add(current.id); current = resolver.byId.get(current.stackParentId); }
  return current?.id ?? requestedId;
};
export const resolveBlockRootId = blockRootId;

export function physicalFootprintsForBlockStack(blocks: SupportBlock[], requestedRootId: string, rootPoint?: StackPoint): PhysicalFootprint[] {
  const resolver = createBlockResolver(blocks); const rootId = blockRootId(blocks, requestedRootId); const root = resolver.byId.get(rootId); if (!root) return [];
  const original = worldPoint(resolver.getXY(root)); const target = worldPoint(rootPoint ?? resolver.getXY(root)); const shift = subtractWorld(target, original);
  return Array.from(resolver.getSubtreeIds(rootId)).flatMap((id) => {
    const block = resolver.byId.get(id); if (!block) return [];
    const size = blockFootprintSize(block); const center = addWorld(worldPoint(resolver.getXY(block)), shift); const bottom = resolver.getBottomMeters(block);
    return [{ id: block.id, center, halfWidth: size.width / 2, halfDepth: size.depth / 2, yaw: 0, bottom, top: bottom + size.height }];
  });
}

export function physicalFootprintsForBlocks(blocks: SupportBlock[]) {
  const resolver = createBlockResolver(blocks); const roots = new Set(blocks.map((block) => blockRootId(blocks, block.id)));
  return Array.from(roots).flatMap((rootId) => physicalFootprintsForBlockStack(blocks, rootId));
}

export function resolveBlockPhysicalCollisions({ blocks, speakers, movingRootId, requestedRootPoint, previousRootPoint }: { blocks: SupportBlock[]; speakers: ClubSpeaker[]; movingRootId: string; requestedRootPoint: StackPoint; previousRootPoint?: StackPoint }) {
  const movingId = blockRootId(blocks, movingRootId); const movingRoot = createBlockResolver(blocks).byId.get(movingId); let point = clampBlockPoint(requestedRootPoint, blockDimensions(movingRoot)); const previous = worldPoint(previousRootPoint ?? requestedRootPoint); const movingNow = physicalFootprintsForBlockStack(blocks, movingId); const movingIds = new Set(movingNow.map((footprint) => footprint.id));
  const staticFootprints = [...physicalFootprintsForBlocks(blocks).filter((footprint) => !movingIds.has(footprint.id)), ...physicalFootprintsForScene(speakers)]; const collidedIds = new Set<string>();
  for (let iteration = 0; iteration < 12; iteration += 1) {
    const moving = physicalFootprintsForBlockStack(blocks, movingId, point); let moved = false;
    for (const current of moving) for (const fixed of staticFootprints) {
      const separation = minimumTranslation(current, fixed, subtractWorld(current.center, previous)); if (!separation) continue;
      collidedIds.add(fixed.id); point = clampBlockPoint(pointFromWorld(addWorld(worldPoint(point), separation)), blockDimensions(movingRoot)); moved = true; break;
    }
    if (!moved) break;
  }
  return { point, collidedIds: Array.from(collidedIds) };
}
