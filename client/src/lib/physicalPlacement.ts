/* SYSTM placement rule: physical contact is evaluated in world metres, not screen rectangles. */
import type { ClubSpeaker } from "@/hooks/useClubAudio";
import { speakerBodyForSpeaker } from "@/lib/speakerDimensions";
import { normalizeYaw, snapYaw } from "@/lib/speakerOrientation";
import { createStackResolver, STACK_ROOM_METERS } from "@/lib/speakerStacking";

export type PlacementPoint = { x: number; y: number };
export type WorldXZ = { x: number; z: number };
export type PlacementSide = "left" | "right";

export type PhysicalFootprint = {
  id: string;
  center: WorldXZ;
  halfWidth: number;
  halfDepth: number;
  yaw: number;
  bottom: number;
  top: number;
};

export type SideSnapCandidate = {
  targetRootId: string;
  side: PlacementSide;
  point: PlacementPoint;
  yaw: number;
  yawAligned: boolean;
  frontFlush: boolean;
  distanceMeters: number;
  enterThresholdMeters: number;
  releaseThresholdMeters: number;
  score: number;
};

export const PHYSICAL_CONTACT_EPSILON_METERS = .006;
export const SIDE_SNAP_ENTER_MIN_METERS = .12;
export const SIDE_SNAP_RELEASE_FACTOR = 1.55;
export const YAW_ALIGNMENT_THRESHOLD_RADIANS = Math.PI / 12;

type Axis = WorldXZ;
type Projection = { min: number; max: number };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const pointToWorld = (point: PlacementPoint): WorldXZ => ({ x: (point.x - .5) * STACK_ROOM_METERS.width, z: (point.y - .5) * STACK_ROOM_METERS.depth });
const worldToPoint = (world: WorldXZ): PlacementPoint => ({ x: world.x / STACK_ROOM_METERS.width + .5, y: world.z / STACK_ROOM_METERS.depth + .5 });
const add = (a: WorldXZ, b: WorldXZ): WorldXZ => ({ x: a.x + b.x, z: a.z + b.z });
const subtract = (a: WorldXZ, b: WorldXZ): WorldXZ => ({ x: a.x - b.x, z: a.z - b.z });
const scale = (point: WorldXZ, amount: number): WorldXZ => ({ x: point.x * amount, z: point.z * amount });
const dot = (a: WorldXZ, b: WorldXZ) => a.x * b.x + a.z * b.z;
const length = (point: WorldXZ) => Math.hypot(point.x, point.z);
const normalize = (point: WorldXZ): WorldXZ => { const size = length(point); return size > .000001 ? scale(point, 1 / size) : { x: 1, z: 0 }; };
const localX = (yaw: number): WorldXZ => ({ x: Math.cos(yaw), z: -Math.sin(yaw) });
const localZ = (yaw: number): WorldXZ => ({ x: Math.sin(yaw), z: Math.cos(yaw) });
const angleDistance = (a: number, b: number) => Math.abs(normalizeYaw(a - b));

function rootIdFor(speakers: ClubSpeaker[], requestedId: string) {
  const byId = new Map(speakers.map((speaker) => [speaker.id, speaker]));
  let current = byId.get(requestedId); const visited = new Set<string>();
  while (current?.stackParentId && !visited.has(current.id)) { visited.add(current.id); current = byId.get(current.stackParentId); }
  return current?.id ?? requestedId;
}

function rootIdsFor(speakers: ClubSpeaker[]) {
  const ids = new Set(speakers.map((speaker) => rootIdFor(speakers, speaker.id)));
  return Array.from(ids);
}

export function physicalFootprintsForStack(speakers: ClubSpeaker[], requestedRootId: string, rootPoint?: PlacementPoint): PhysicalFootprint[] {
  const resolver = createStackResolver(speakers); const rootId = rootIdFor(speakers, requestedRootId); const root = resolver.byId.get(rootId);
  if (!root) return [];
  const originalRoot = pointToWorld(resolver.getXY(root)); const targetRoot = pointToWorld(rootPoint ?? resolver.getXY(root)); const shift = subtract(targetRoot, originalRoot);
  return Array.from(resolver.getSubtreeIds(rootId)).flatMap((id) => {
    const speaker = resolver.byId.get(id); if (!speaker) return [];
    const body = speakerBodyForSpeaker(speaker); const center = add(pointToWorld(resolver.getXY(speaker)), shift); const bottom = resolver.getBottomMeters(speaker);
    return [{ id: speaker.id, center, halfWidth: body.width / 2, halfDepth: body.depth / 2, yaw: speaker.orientation?.yaw ?? 0, bottom, top: bottom + body.height }];
  });
}

export function physicalFootprintsForScene(speakers: ClubSpeaker[]) {
  return rootIdsFor(speakers).flatMap((rootId) => physicalFootprintsForStack(speakers, rootId));
}

function axesFor(footprint: PhysicalFootprint): Axis[] { return [localX(footprint.yaw), localZ(footprint.yaw)]; }
function projection(footprint: PhysicalFootprint, axis: Axis): Projection {
  const extent = Math.abs(dot(localX(footprint.yaw), axis)) * footprint.halfWidth + Math.abs(dot(localZ(footprint.yaw), axis)) * footprint.halfDepth;
  const center = dot(footprint.center, axis); return { min: center - extent, max: center + extent };
}

function verticalOverlap(a: PhysicalFootprint, b: PhysicalFootprint) { return Math.min(a.top, b.top) - Math.max(a.bottom, b.bottom) > PHYSICAL_CONTACT_EPSILON_METERS; }

export function physicalFootprintsPenetrate(a: PhysicalFootprint, b: PhysicalFootprint) {
  if (!verticalOverlap(a, b)) return false;
  return [...axesFor(a), ...axesFor(b)].every((axis) => {
    const first = projection(a, axis); const second = projection(b, axis);
    return Math.min(first.max, second.max) - Math.max(first.min, second.min) > PHYSICAL_CONTACT_EPSILON_METERS;
  });
}

function minimumTranslation(moving: PhysicalFootprint, fixed: PhysicalFootprint, preferredDirection: WorldXZ): WorldXZ | null {
  if (!verticalOverlap(moving, fixed)) return null;
  let best: WorldXZ | null = null;
  for (const axis of [...axesFor(moving), ...axesFor(fixed)]) {
    const first = projection(moving, axis); const second = projection(fixed, axis); const overlap = Math.min(first.max, second.max) - Math.max(first.min, second.min);
    if (overlap <= PHYSICAL_CONTACT_EPSILON_METERS) return null;
    const centerDelta = subtract(moving.center, fixed.center); const preferred = dot(preferredDirection, axis);
    const sign = Math.abs(dot(centerDelta, axis)) > PHYSICAL_CONTACT_EPSILON_METERS ? (dot(centerDelta, axis) >= 0 ? 1 : -1) : preferred >= 0 ? 1 : -1;
    const candidate = scale(axis, sign * (overlap + PHYSICAL_CONTACT_EPSILON_METERS));
    if (!best || length(candidate) < length(best)) best = candidate;
  }
  return best;
}

export type CollisionResolutionRequest = {
  speakers: ClubSpeaker[];
  movingRootId: string;
  requestedRootPoint: PlacementPoint;
  previousRootPoint?: PlacementPoint;
};

export type CollisionResolution = { point: PlacementPoint; collidedIds: string[] };

export function resolvePhysicalCollisions(request: CollisionResolutionRequest): CollisionResolution {
  let point = request.requestedRootPoint; const previous = pointToWorld(request.previousRootPoint ?? request.requestedRootPoint); const collidedIds = new Set<string>();
  const movingRootId = rootIdFor(request.speakers, request.movingRootId); const staticFootprints = physicalFootprintsForScene(request.speakers).filter((footprint) => !physicalFootprintsForStack(request.speakers, movingRootId).some((moving) => moving.id === footprint.id));
  for (let iteration = 0; iteration < 12; iteration += 1) {
    const movingFootprints = physicalFootprintsForStack(request.speakers, movingRootId, point); let moved = false;
    for (const moving of movingFootprints) for (const fixed of staticFootprints) {
      const separation = minimumTranslation(moving, fixed, subtract(moving.center, previous));
      if (!separation) continue;
      collidedIds.add(fixed.id); const nextWorld = add(pointToWorld(point), separation); point = worldToPoint(nextWorld); moved = true;
      break;
    }
    if (!moved) break;
  }
  return { point, collidedIds: Array.from(collidedIds) };
}

type GroupSupport = { min: number; max: number };
function supportForGroup(footprints: PhysicalFootprint[], anchor: WorldXZ, axis: Axis): GroupSupport {
  return footprints.reduce((support, footprint) => {
    const extent = Math.abs(dot(localX(footprint.yaw), axis)) * footprint.halfWidth + Math.abs(dot(localZ(footprint.yaw), axis)) * footprint.halfDepth;
    const relative = dot(subtract(footprint.center, anchor), axis);
    return { min: Math.min(support.min, relative - extent), max: Math.max(support.max, relative + extent) };
  }, { min: Infinity, max: -Infinity });
}

function rotateGroupAroundAnchor(footprints: PhysicalFootprint[], anchor: WorldXZ, deltaYaw: number) {
  const cosine = Math.cos(deltaYaw); const sine = Math.sin(deltaYaw);
  return footprints.map((footprint) => { const relative = subtract(footprint.center, anchor); const rotated = { x: relative.x * cosine + relative.z * sine, z: -relative.x * sine + relative.z * cosine }; return { ...footprint, center: add(anchor, rotated), yaw: normalizeYaw(footprint.yaw + deltaYaw) }; });
}

function groupSpan(footprints: PhysicalFootprint[]) { return Math.max(...footprints.map((footprint) => footprint.halfWidth * 2 + footprint.halfDepth * 2), .2); }

export type SideSnapRequest = {
  speakers: ClubSpeaker[];
  movingRootId: string;
  rawRootPoint: PlacementPoint;
  previous?: SideSnapCandidate | null;
};

export function sideSnapThresholdMeters(moving: PhysicalFootprint[], target: PhysicalFootprint[]) {
  return clamp((groupSpan(moving) + groupSpan(target)) * .09, SIDE_SNAP_ENTER_MIN_METERS, .42);
}

export function findSideSnapCandidates(request: SideSnapRequest): SideSnapCandidate[] {
  const movingRootId = rootIdFor(request.speakers, request.movingRootId); const movingRoot = createStackResolver(request.speakers).byId.get(movingRootId); if (!movingRoot) return [];
  const currentMoving = physicalFootprintsForStack(request.speakers, movingRootId); const currentAnchor = pointToWorld(createStackResolver(request.speakers).getXY(movingRoot)); const targets = rootIdsFor(request.speakers).filter((rootId) => rootId !== movingRootId);
  const candidates: SideSnapCandidate[] = [];
  for (const targetRootId of targets) {
    const targetRoot = createStackResolver(request.speakers).byId.get(targetRootId); if (!targetRoot) continue;
    const target = physicalFootprintsForStack(request.speakers, targetRootId); const targetAnchor = pointToWorld(createStackResolver(request.speakers).getXY(targetRoot)); const targetYaw = targetRoot.orientation?.yaw ?? 0; const movingYaw = movingRoot.orientation?.yaw ?? 0; const yawAligned = angleDistance(movingYaw, targetYaw) <= YAW_ALIGNMENT_THRESHOLD_RADIANS + .0001;
    const yawDelta = yawAligned ? normalizeYaw(targetYaw - movingYaw) : 0; const moving = yawDelta ? rotateGroupAroundAnchor(currentMoving, currentAnchor, yawDelta) : currentMoving; const sideAxis = localX(targetYaw); const frontAxis = localZ(targetYaw); const targetSideSupport = supportForGroup(target, targetAnchor, sideAxis); const targetFrontSupport = supportForGroup(target, targetAnchor, frontAxis); const movingSideSupport = supportForGroup(moving, currentAnchor, sideAxis); const movingFrontSupport = supportForGroup(moving, currentAnchor, frontAxis); const threshold = sideSnapThresholdMeters(moving, target);
    for (const side of ["left", "right"] as const) {
      const targetBoundary = side === "right" ? targetSideSupport.max : targetSideSupport.min; const movingBoundary = side === "right" ? movingSideSupport.min : movingSideSupport.max; const sideCoordinate = dot(targetAnchor, sideAxis) + targetBoundary - movingBoundary; const frontCoordinate = dot(targetAnchor, frontAxis) + targetFrontSupport.max - movingFrontSupport.max; const candidateWorld = add(scale(sideAxis, sideCoordinate), scale(frontAxis, frontCoordinate)); const candidatePoint = worldToPoint(candidateWorld); const distanceMeters = length(subtract(pointToWorld(request.rawRootPoint), candidateWorld));
      const releaseThresholdMeters = threshold * SIDE_SNAP_RELEASE_FACTOR; const previousMatch = request.previous && request.previous.targetRootId === targetRootId && request.previous.side === side; const allowed = previousMatch ? distanceMeters <= releaseThresholdMeters : distanceMeters <= threshold;
      if (!allowed) continue;
      candidates.push({ targetRootId, side, point: candidatePoint, yaw: snapYaw(targetYaw), yawAligned, frontFlush: yawAligned, distanceMeters, enterThresholdMeters: threshold, releaseThresholdMeters, score: distanceMeters / threshold + (yawAligned ? 0 : .18) });
    }
  }
  return candidates.sort((a, b) => a.score - b.score);
}

export function findSideSnapCandidate(request: SideSnapRequest) { return findSideSnapCandidates(request)[0] ?? null; }
