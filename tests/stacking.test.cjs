const assert = require("node:assert/strict");
const { createStackResolver, findStackCandidate, removeSpeakerFromStack } = require("../.tmp-stacking.cjs");

const speaker = (id, kind, x, y, parent = null, z = 0, stackAlign) => ({ id, kind, label: kind, position: { x, y, z }, orientation: { yaw: 0 }, stackParentId: parent, ...(stackAlign ? { stackAlign } : {}), level: 1, muted: false, responseProfileId: kind, activity: 0, eq: {} });
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
assert.deepEqual(resolver.getXY(high), { x: .5, y: .5 }, "stacked child resolves parent XY");
const movedColumn = [speaker("sub", "sub", .72, .28), speaker("full", "full", .5, .5, "sub"), speaker("high", "high", .5, .5, "full")];
assert.deepEqual(createStackResolver(movedColumn).getXY(movedColumn[2]), { x: .72, y: .28 }, "parent XY move carries every stacked descendant without rewriting child positions");
assert.equal(resolver.getStackTop("sub"), "high", "candidate targets the actual stack top");
assert.equal(resolver.isDescendant("high", "sub"), true, "cycle guard recognises ancestor target");

const looseMid = speaker("mid", "mid", .503, .499);
const candidate = findStackCandidate({ dragged: looseMid, point: { x: .501, y: .501 }, speakers: [...column, looseMid] });
assert.equal(candidate.parentId, "high", "drop target resolves to single-column top");
assert.equal(findStackCandidate({ dragged: sub, point: { x: .5, y: .5 }, speakers: column }), null, "cannot stack a root onto its own descendant");

const removed = removeSpeakerFromStack(column, "full");
assert.equal(removed.find((item) => item.id === "high").stackParentId, "sub", "remove reparents direct child to removed parent");
const far = speaker("far", "full", .1, .1);
assert.equal(findStackCandidate({ dragged: far, point: { x: .1, y: .1 }, speakers: [...column, far] }), null, "distant speaker has no candidate");

const wideParent = speaker("wide", "sub", .5, .5);
const narrowLeft = speaker("left", "high", .5, .5, "wide", 0, "left");
const narrowCenter = speaker("center", "high", .5, .5, "wide", 0, "center");
const narrowRight = speaker("right", "high", .5, .5, "wide", 0, "right");
const aligned = createStackResolver([wideParent, narrowLeft, narrowCenter, narrowRight]);
assert.equal(aligned.getXY(narrowCenter).x, .5, "center alignment preserves parent center");
assert.deepEqual(createStackResolver([wideParent, speaker("legacy", "high", .5, .5, "wide")]).getXY("legacy"), { x: .5, y: .5 }, "legacy undefined stackAlign defaults to center");
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
  const rotatedChild = { ...narrowLeft, stackParentId: "wide" };
  const point = createStackResolver([rotatedParent, rotatedChild]).getXY(rotatedChild);
  const offset = (1.08 - 2.36) / 2;
  assert.equal(Math.round((point.x - .5) * 13 * 1e9) / 1e9, Math.round(Math.cos(yaw) * offset * 1e9) / 1e9, `left alignment follows parent yaw ${yaw}`);
  assert.equal(Math.round((point.y - .5) * 8 * 1e9) / 1e9, Math.round(-Math.sin(yaw) * offset * 1e9) / 1e9, `left alignment follows parent yaw ${yaw}`);
}
const chained = [wideParent, speaker("mid-chain", "full", .5, .5, "wide", 0, "right"), speaker("top-chain", "high", .5, .5, "mid-chain", 0, "left")];
assert.notDeepEqual(createStackResolver(chained).getXY(chained[2]), createStackResolver(chained).getXY(chained[0]), "stack chain resolves each alignment recursively");
const reparented = removeSpeakerFromStack([wideParent, speaker("removed", "full", .5, .5, "wide", 0, "right"), speaker("survivor", "high", .5, .5, "removed", 0, "left")], "removed");
assert.equal(reparented.find((item) => item.id === "survivor").stackAlign, "right", "removing a middle speaker inherits its parent-facing alignment");
console.log("speaker stacking tests passed");
