const assert = require("node:assert/strict");
const { createStackResolver, findStackCandidate, mobileStackTargetMeters, removeSpeakerFromStack, stackAlignmentPoint, stackFrontFlushOffsetMeters } = require("../.tmp-stacking.cjs");

const speaker = (id, kind, x, y, parent = null, z = 0, stackAlign) => ({ id, kind, label: kind, position: { x, y, z }, orientation: { yaw: 0 }, stackParentId: parent, ...(stackAlign ? { stackAlign } : {}), level: 1, muted: false, responseProfileId: kind, activity: 0, eq: {} });
const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-9, message);
const frontCenter = (parent, child, parentPoint, childPoint) => {
  const parentYaw = parent.orientation?.yaw ?? 0; const childYaw = child.orientation?.yaw ?? 0;
  const parentCenter = parentPoint.x * 13 * Math.sin(parentYaw) + parentPoint.y * 8 * Math.cos(parentYaw);
  const childCenter = childPoint.x * 13 * Math.sin(parentYaw) + childPoint.y * 8 * Math.cos(parentYaw);
  const depths = { sub: 1.4, woofer: 1.08, full: 1.08, mid: .58, high: .72 };
  return { parent: parentCenter + depths[parent.kind] / 2, child: childCenter + depths[child.kind] / 2 * Math.cos(childYaw - parentYaw) };
};
const sub = speaker("sub", "sub", .5, .5);
const full = speaker("full", "full", .5, .5, "sub");
const high = speaker("high", "high", .5, .5, "full");
const column = [sub, full, high];
const resolver = createStackResolver(column);

assert.equal(resolver.getBottomMeters(sub), 0, "floor speaker starts at ground");
assert.equal(resolver.getCenterMeters(sub), .45, "sub center is half its body height");
assert.equal(resolver.getBottomMeters(full), .9, "full rests directly on sub");
assert.equal(resolver.getCenterMeters(full), 1.9, "full center follows physical body height");
assert.equal(resolver.getBottomMeters(high), 2.9, "third cabinet rests on full");
assert.equal(resolver.getCenterMeters(high), 3.21, "high center uses its own body height");
close(resolver.getXY(full).y, .52, "same-yaw child front flushes to a deeper parent");
close(resolver.getXY(high).y, .5425, "front flush resolves recursively through a chain");
const movedColumn = [speaker("sub", "sub", .72, .28), speaker("full", "full", .5, .5, "sub"), speaker("high", "high", .5, .5, "full")];
const movedTopPoint = createStackResolver(movedColumn).getXY(movedColumn[2]);
close(movedTopPoint.x, .72, "parent X move carries every stacked descendant");
close(movedTopPoint.y, .3225, "parent Y move carries every stacked descendant with derived front flush");
assert.equal(resolver.getStackTop("sub"), "high", "candidate targets the actual stack top");
assert.equal(resolver.isDescendant("high", "sub"), true, "cycle guard recognises ancestor target");

const looseMid = speaker("mid", "mid", .503, .499);
const candidate = findStackCandidate({ dragged: looseMid, point: resolver.getXY(high), speakers: [...column, looseMid] });
assert.equal(candidate.parentId, "high", "drop target resolves to single-column top");
assert.equal(findStackCandidate({ dragged: sub, point: { x: .5, y: .5 }, speakers: column }), null, "cannot stack a root onto its own descendant");

const removed = removeSpeakerFromStack(column, "full");
assert.equal(removed.some((item) => item.id === "full"), false, "trash removes only the selected cabinet");
assert.deepEqual(removed.map((item) => item.id), ["sub", "high"], "other cabinets remain after selected removal");
assert.equal(removed.find((item) => item.id === "high").stackParentId, "sub", "remove reparents direct child to removed parent");
const far = speaker("far", "full", .1, .1);
assert.equal(findStackCandidate({ dragged: far, point: { x: .1, y: .1 }, speakers: [...column, far] }), null, "distant speaker has no candidate");
assert.equal(mobileStackTargetMeters(.01, true), .72, "mobile stack target keeps a 72px screen-space affordance");
assert.equal(mobileStackTargetMeters(.01, false), 0, "desktop keeps its physical stack threshold");

const wideParent = speaker("wide", "sub", .5, .5);
const narrowLeft = speaker("left", "high", .5, .5, "wide", 0, "left");
const narrowCenter = speaker("center", "high", .5, .5, "wide", 0, "center");
const narrowRight = speaker("right", "high", .5, .5, "wide", 0, "right");
const aligned = createStackResolver([wideParent, narrowLeft, narrowCenter, narrowRight]);
assert.equal(aligned.getXY(narrowCenter).x, .5, "center alignment preserves parent center");
assert.deepEqual(createStackResolver([wideParent, speaker("legacy", "high", .5, .5, "wide")]).getXY("legacy"), { x: .5, y: .5425 }, "legacy undefined stackAlign remains compatible and defaults to centered front flush");
assert.equal(aligned.getXY(narrowLeft).x, .5 + (1.08 - 2.36) / 2 / 13, "left alignment matches physical left edges");
assert.equal(aligned.getXY(narrowRight).x, .5 + (2.36 - 1.08) / 2 / 13, "right alignment matches physical right edges");
for (const [alignment, target] of [["left", narrowLeft], ["center", narrowCenter], ["right", narrowRight]]) {
  const candidate = findStackCandidate({ dragged: speaker("dragged", "high", .5, .5), point: aligned.getXY(target), speakers: [wideParent, speaker("dragged", "high", .5, .5)] });
  assert.equal(candidate?.alignment, alignment, `${alignment} drag snap chooses nearest anchor`);
}
const narrowParent = speaker("narrow", "high", .5, .5);
const wideChild = speaker("wide-child", "sub", .5, .5, "narrow", 0, "left");
assert.equal(createStackResolver([narrowParent, wideChild]).getXY(wideChild).x, .5 + (2.36 - 1.08) / 2 / 13, "left alignment stays correct when child is wider");
for (const yaw of [0, Math.PI / 12, -Math.PI / 12]) {
  const rotatedParent = { ...wideParent, orientation: { yaw } };
  const rotatedChild = { ...narrowLeft, stackParentId: "wide", orientation: { yaw } };
  const point = createStackResolver([rotatedParent, rotatedChild]).getXY(rotatedChild);
  const lateralOffset = (1.08 - 2.36) / 2; const frontOffset = (1.4 - .72) / 2;
  assert.equal(Math.round((point.x - .5) * 13 * 1e9) / 1e9, Math.round((Math.cos(yaw) * lateralOffset + Math.sin(yaw) * frontOffset) * 1e9) / 1e9, `left alignment and front flush follow parent yaw ${yaw}`);
  assert.equal(Math.round((point.y - .5) * 8 * 1e9) / 1e9, Math.round((-Math.sin(yaw) * lateralOffset + Math.cos(yaw) * frontOffset) * 1e9) / 1e9, `left alignment and front flush follow parent yaw ${yaw}`);
}
const shallowParent = speaker("shallow", "high", .5, .5);
const deepChild = speaker("deep", "sub", .5, .5, "shallow");
close(stackFrontFlushOffsetMeters(shallowParent, deepChild), (.72 - 1.4) / 2, "front flush supports a child deeper than its parent");
for (const deltaYaw of [0, Math.PI / 12, -Math.PI / 12]) {
  const rotatedChild = { ...narrowCenter, orientation: { yaw: deltaYaw } };
  const point = stackAlignmentPoint(wideParent, rotatedChild, { x: .5, y: .5 }, "center");
  const planes = frontCenter(wideParent, rotatedChild, { x: .5, y: .5 }, point);
  close(planes.child, planes.parent, `child front center stays on parent front plane at delta yaw ${deltaYaw}`);
}
for (const alignment of ["left", "center", "right"]) {
  const child = { ...narrowCenter, stackAlign: alignment };
  const point = stackAlignmentPoint(wideParent, child, { x: .5, y: .5 }, alignment);
  const planes = frontCenter(wideParent, child, { x: .5, y: .5 }, point);
  close(planes.child, planes.parent, `${alignment} preserves front flush`);
}
const chained = [wideParent, speaker("mid-chain", "full", .5, .5, "wide", 0, "right"), speaker("top-chain", "high", .5, .5, "mid-chain", 0, "left")];
assert.notDeepEqual(createStackResolver(chained).getXY(chained[2]), createStackResolver(chained).getXY(chained[0]), "stack chain resolves each alignment recursively");
const reparented = removeSpeakerFromStack([wideParent, speaker("removed", "full", .5, .5, "wide", 0, "right"), speaker("survivor", "high", .5, .5, "removed", 0, "left")], "removed");
assert.equal(reparented.find((item) => item.id === "survivor").stackAlign, "right", "removing a middle speaker inherits its parent-facing alignment");
console.log("speaker stacking tests passed");
