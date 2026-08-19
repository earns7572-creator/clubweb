const assert = require("node:assert/strict");
const { createStackResolver, findStackCandidate, removeSpeakerFromStack } = require("../.tmp-stacking.cjs");

const speaker = (id, kind, x, y, parent = null, z = 0) => ({ id, kind, label: kind, position: { x, y, z }, stackParentId: parent, level: 1, muted: false, responseProfileId: kind, activity: 0, eq: {} });
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
console.log("speaker stacking tests passed");
