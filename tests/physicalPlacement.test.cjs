const assert = require("node:assert/strict");
const { findSideSnapCandidate, findSideSnapCandidates, physicalFootprintsForStack, physicalFootprintsPenetrate, resolvePhysicalCollisions } = require("../.tmp-physical-placement.cjs");

const speaker = (id, kind, x, y, parent = null, yaw = 0, z = 0, stackAlign) => ({ id, kind, modelId: `modern-${kind}`, label: kind, position: { x, y, z }, orientation: { yaw }, stackParentId: parent, ...(stackAlign ? { stackAlign } : {}), level: 1, muted: false, responseProfileId: kind, activity: 0, eq: {} });
const worldZFront = (footprint) => footprint.center.z + Math.sin(footprint.yaw) * footprint.halfWidth + Math.cos(footprint.yaw) * footprint.halfDepth;

const leftSub = speaker("left-sub", "sub", .4, .5);
const rightSub = speaker("right-sub", "sub", .6, .5);
const sideCandidate = findSideSnapCandidate({ speakers: [leftSub, rightSub], movingRootId: rightSub.id, rawRootPoint: rightSub.position });
assert.equal(sideCandidate?.targetRootId, leftSub.id, "nearby cabinet resolves against the neighboring target");
assert.equal(sideCandidate?.side, "right", "right-side contact is exposed as a named candidate");
assert.equal(sideCandidate?.frontFlush, true, "same-yaw side contact keeps front faces flush");
assert.ok(sideCandidate && sideCandidate.distanceMeters <= sideCandidate.enterThresholdMeters, "side snap only activates inside the enter threshold");

const snappedSub = physicalFootprintsForStack([leftSub, rightSub], rightSub.id, sideCandidate.point)[0];
const leftSubFootprint = physicalFootprintsForStack([leftSub, rightSub], leftSub.id)[0];
assert.equal(physicalFootprintsPenetrate(leftSubFootprint, snappedSub), false, "side contact is allowed without penetration");

const collisionScene = [speaker("fixed", "sub", .4, .5), speaker("moving", "full", .45, .5)];
const collisionBefore = physicalFootprintsForStack(collisionScene, "moving")[0];
const fixedFootprint = physicalFootprintsForStack(collisionScene, "fixed")[0];
assert.equal(physicalFootprintsPenetrate(fixedFootprint, collisionBefore), true, "overlapping unstacked cabinets are detected in world space");
const collisionAfter = resolvePhysicalCollisions({ speakers: collisionScene, movingRootId: "moving", requestedRootPoint: { x: .45, y: .5 }, previousRootPoint: { x: .7, y: .5 } });
const resolvedMoving = physicalFootprintsForStack(collisionScene, "moving", collisionAfter.point)[0];
assert.equal(physicalFootprintsPenetrate(fixedFootprint, resolvedMoving), false, "drag collision response stops at contact instead of restoring the old point");
assert.notDeepEqual(collisionAfter.point, { x: .7, y: .5 }, "collision response remains on the requested side of the drag");

for (const yaw of [Math.PI / 4, Math.PI / 2, Math.PI * .75]) {
  const rotatedScene = [speaker("fixed", "sub", .4, .5), speaker("rotated", "high", .46, .5, null, yaw)];
  const before = physicalFootprintsForStack(rotatedScene, "rotated")[0];
  assert.equal(physicalFootprintsPenetrate(physicalFootprintsForStack(rotatedScene, "fixed")[0], before), true, `rotated ${yaw} degree footprint is detected`);
  const after = resolvePhysicalCollisions({ speakers: rotatedScene, movingRootId: "rotated", requestedRootPoint: { x: .46, y: .5 }, previousRootPoint: { x: .72, y: .5 } });
  assert.equal(physicalFootprintsPenetrate(physicalFootprintsForStack(rotatedScene, "fixed")[0], physicalFootprintsForStack(rotatedScene, "rotated", after.point)[0]), false, `rotated ${yaw} degree footprint resolves without penetration`);
}

const stack = [speaker("stack-root", "sub", .4, .5), speaker("stack-top", "full", .4, .5, "stack-root")];
const stackFootprints = physicalFootprintsForStack(stack, "stack-root");
assert.equal(physicalFootprintsPenetrate(stackFootprints[0], stackFootprints[1]), false, "vertical stack contact remains legal");
const unrelated = speaker("unrelated", "sub", .72, .5);
const movedStack = resolvePhysicalCollisions({ speakers: [...stack, unrelated], movingRootId: "stack-root", requestedRootPoint: { x: .62, y: .5 }, previousRootPoint: { x: .4, y: .5 } });
const movedStackFootprints = physicalFootprintsForStack([...stack, unrelated], "stack-root", movedStack.point);
const unrelatedFootprint = physicalFootprintsForStack([...stack, unrelated], "unrelated")[0];
assert.equal(movedStackFootprints.some((moving) => physicalFootprintsPenetrate(moving, unrelatedFootprint)), false, "a moving stack uses its complete physical footprint");

const rotatedMoving = speaker("rotated-moving", "high", .53, .5, null, Math.PI / 12);
const yawCandidate = findSideSnapCandidate({ speakers: [leftSub, rotatedMoving], movingRootId: rotatedMoving.id, rawRootPoint: rotatedMoving.position });
assert.equal(yawCandidate?.yawAligned, true, "15 degree cabinets expose a compatible yaw alignment candidate");
assert.equal(yawCandidate?.yaw, 0, "compatible side snap proposes the target yaw without changing the 15 degree rotation primitive");

const far = speaker("far", "high", .9, .5);
assert.equal(findSideSnapCandidate({ speakers: [leftSub, far], movingRootId: far.id, rawRootPoint: far.position }), null, "outside the side snap threshold does not snap");
const held = sideCandidate && findSideSnapCandidate({ speakers: [leftSub, rightSub], movingRootId: rightSub.id, rawRootPoint: { x: sideCandidate.point.x + .05, y: sideCandidate.point.y }, previous: sideCandidate });
assert.equal(held?.targetRootId, sideCandidate?.targetRootId, "snap hysteresis holds the candidate through small pointer movement");

const wide = speaker("wide", "sub", .4, .5);
const narrow = speaker("narrow", "high", .53, .5);
const widthCandidate = findSideSnapCandidate({ speakers: [wide, narrow], movingRootId: narrow.id, rawRootPoint: narrow.position });
assert.equal(widthCandidate?.targetRootId, wide.id, "different cabinet widths still produce a side contact candidate");
const wideFootprint = physicalFootprintsForStack([wide], wide.id)[0];
const narrowSnapped = physicalFootprintsForStack([wide, narrow], narrow.id, widthCandidate.point)[0];
assert.ok(Math.abs(worldZFront(wideFootprint) - worldZFront(narrowSnapped)) < .01, "different widths keep their front faces flush");

console.log("physical placement and snap tests passed");
