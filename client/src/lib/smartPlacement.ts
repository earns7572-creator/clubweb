/**
 * Club Craft TOP placement — quiet, continuous placement assistance.
 * Points are normalized for the shared scene; every guide calculation converts through `scale`.
 */

export type WorldPoint = { x: number; y: number };
export type PlacementSpeaker = { id: string; point: WorldPoint };
export type ModifierState = { alt: boolean; shift: boolean };
export type AxisSnapKind = "alignment" | "spacing" | "major-grid" | "minor-grid";
export type AxisSnap = { value: number; kind: AxisSnapKind; targetId?: string; spacingMeters?: number };
export type RadialSnap = { radiusMeters: number; targetId: string };
export type SmartSnapState = { x?: AxisSnap; y?: AxisSnap; radial?: RadialSnap };
export type SmartGuideState = { x?: AxisSnap; y?: AxisSnap; radial?: RadialSnap; distance?: { from: WorldPoint; to: WorldPoint; meters: number; equal: boolean } };
export type PlacementResult = { point: WorldPoint; snap: SmartSnapState; guides: SmartGuideState | null };

type Axis = "x" | "y";
type AxisCandidate = AxisSnap & { priority: number; axis: Axis };
type Request = {
  raw: WorldPoint; draggedId: string; speakers: PlacementSpeaker[]; listener: WorldPoint; bounds: { minX: number; maxX: number; minY: number; maxY: number };
  scale: WorldPoint; enter: WorldPoint; release: WorldPoint; radialEnterMeters: number; radialReleaseMeters: number; modifiers: ModifierState; previous: SmartSnapState;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const nearestGrid = (value: number, step: number) => Math.round(value / step) * step;
const meterDistance = (a: WorldPoint, b: WorldPoint, scale: WorldPoint) => Math.hypot((a.x - b.x) * scale.x, (a.y - b.y) * scale.y);

function chooseAxis(raw: number, axis: Axis, candidates: AxisCandidate[], previous: AxisSnap | undefined, enter: number, release: number) {
  if (previous && Math.abs(raw - previous.value) <= release) return previous;
  return candidates.filter((candidate) => candidate.axis === axis && Math.abs(raw - candidate.value) <= enter).sort((a, b) => a.priority - b.priority || Math.abs(raw - a.value) - Math.abs(raw - b.value))[0];
}

function makeAxisCandidates(others: PlacementSpeaker[], raw: WorldPoint, axis: Axis, scale: WorldPoint) {
  const cross: Axis = axis === "x" ? "y" : "x";
  const candidates: AxisCandidate[] = [];
  others.forEach((speaker) => candidates.push({ axis, value: speaker.point[axis], kind: "alignment", priority: 1, targetId: speaker.id }));
  for (let firstIndex = 0; firstIndex < others.length; firstIndex += 1) for (let secondIndex = firstIndex + 1; secondIndex < others.length; secondIndex += 1) {
    const first = others[firstIndex]; const second = others[secondIndex];
    if (Math.abs(first.point[cross] - second.point[cross]) * scale[cross] > .35) continue;
    const gap = second.point[axis] - first.point[axis];
    if (Math.abs(gap) * scale[axis] < .18) continue;
    candidates.push({ axis, value: second.point[axis] + gap, kind: "spacing", priority: 2, targetId: second.id, spacingMeters: Math.abs(gap) * scale[axis] });
    candidates.push({ axis, value: first.point[axis] - gap, kind: "spacing", priority: 2, targetId: first.id, spacingMeters: Math.abs(gap) * scale[axis] });
  }
  const major = nearestGrid(raw[axis], 1 / scale[axis]);
  const minor = nearestGrid(raw[axis], .5 / scale[axis]);
  candidates.push({ axis, value: major, kind: "major-grid", priority: 4 });
  if (Math.abs(minor - major) > .0001) candidates.push({ axis, value: minor, kind: "minor-grid", priority: 5 });
  return candidates;
}

function listenerRadiusCandidate(raw: WorldPoint, listener: WorldPoint, others: PlacementSpeaker[], scale: WorldPoint, previous: RadialSnap | undefined, enterMeters: number, releaseMeters: number) {
  const rawRadius = meterDistance(raw, listener, scale);
  if (previous && Math.abs(rawRadius - previous.radiusMeters) <= releaseMeters) return previous;
  return others.map((speaker) => ({ radiusMeters: meterDistance(speaker.point, listener, scale), targetId: speaker.id })).filter((candidate) => Math.abs(rawRadius - candidate.radiusMeters) <= enterMeters).sort((a, b) => Math.abs(rawRadius - a.radiusMeters) - Math.abs(rawRadius - b.radiusMeters))[0];
}

export function placeWithSmartGuides(request: Request): PlacementResult {
  const others = request.speakers.filter((speaker) => speaker.id !== request.draggedId);
  const freePoint = { x: clamp(request.raw.x, request.bounds.minX, request.bounds.maxX), y: clamp(request.raw.y, request.bounds.minY, request.bounds.maxY) };
  if (request.modifiers.alt || others.length === 0) return { point: freePoint, snap: {}, guides: null };
  const multiplier = request.modifiers.shift ? 1.62 : 1;
  const enter = { x: request.enter.x * multiplier, y: request.enter.y * multiplier };
  const release = { x: request.release.x * multiplier, y: request.release.y * multiplier };
  const xCandidates = makeAxisCandidates(others, freePoint, "x", request.scale);
  const yCandidates = makeAxisCandidates(others, freePoint, "y", request.scale);
  const previousXDirect = request.previous.x?.kind === "alignment" || request.previous.x?.kind === "spacing" ? request.previous.x : undefined;
  const previousYDirect = request.previous.y?.kind === "alignment" || request.previous.y?.kind === "spacing" ? request.previous.y : undefined;
  const xDirect = chooseAxis(freePoint.x, "x", xCandidates.filter((candidate) => candidate.priority <= 2), previousXDirect, enter.x, release.x);
  const yDirect = chooseAxis(freePoint.y, "y", yCandidates.filter((candidate) => candidate.priority <= 2), previousYDirect, enter.y, release.y);
  let xSnap = xDirect; let ySnap = yDirect; let radial: RadialSnap | undefined; const guide: SmartGuideState = {};
  let point: WorldPoint = { x: xSnap?.value ?? freePoint.x, y: ySnap?.value ?? freePoint.y };
  if (!xDirect && !yDirect) {
    radial = listenerRadiusCandidate(freePoint, request.listener, others, request.scale, request.previous.radial, request.radialEnterMeters * multiplier, request.radialReleaseMeters * multiplier);
    if (radial) {
      const deltaX = (freePoint.x - request.listener.x) * request.scale.x; const deltaY = (freePoint.y - request.listener.y) * request.scale.y; const rawRadius = Math.hypot(deltaX, deltaY); const unit = rawRadius > .0001 ? { x: deltaX / rawRadius, y: deltaY / rawRadius } : { x: 1, y: 0 };
      point = { x: request.listener.x + (unit.x * radial.radiusMeters) / request.scale.x, y: request.listener.y + (unit.y * radial.radiusMeters) / request.scale.y }; guide.radial = radial;
    }
  }
  if (!radial) { xSnap = xDirect ?? chooseAxis(freePoint.x, "x", xCandidates, request.previous.x, enter.x, release.x); ySnap = yDirect ?? chooseAxis(freePoint.y, "y", yCandidates, request.previous.y, enter.y, release.y); point = { x: xSnap?.value ?? freePoint.x, y: ySnap?.value ?? freePoint.y }; }
  if (xSnap) guide.x = xSnap; if (ySnap) guide.y = ySnap;
  point = { x: clamp(point.x, request.bounds.minX, request.bounds.maxX), y: clamp(point.y, request.bounds.minY, request.bounds.maxY) };
  const referenceId = xSnap?.targetId ?? ySnap?.targetId ?? radial?.targetId;
  const reference = others.find((speaker) => speaker.id === referenceId) ?? others.map((speaker) => ({ speaker, distance: meterDistance(speaker.point, point, request.scale) })).sort((a, b) => a.distance - b.distance)[0]?.speaker;
  if (reference) {
    const meters = meterDistance(reference.point, point, request.scale); const equal = xSnap?.kind === "spacing" || ySnap?.kind === "spacing" || Boolean(radial);
    if (meters <= 5.5 || equal) guide.distance = { from: reference.point, to: point, meters, equal };
  }
  const snap: SmartSnapState = { ...(xSnap ? { x: xSnap } : {}), ...(ySnap ? { y: ySnap } : {}), ...(radial ? { radial } : {}) };
  return { point, snap, guides: Object.keys(guide).length ? guide : null };
}
