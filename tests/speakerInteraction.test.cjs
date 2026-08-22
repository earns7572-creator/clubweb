const assert = require("node:assert/strict");
const { clampStackRootPoint, detachSpeakerExplicitly, exceedsDragThreshold, moveStackRoot, POINTER_DRAG_THRESHOLD_PX, rotateSpeakerWithoutDetach } = require("../.tmp-speaker-interaction.cjs");

const speaker = (id, kind, x, y, parent = null, align) => ({ id, kind, label: kind, position: { x, y, z: 0 }, orientation: { yaw: 0 }, stackParentId: parent, ...(align ? { stackAlign: align } : {}), level: 1, muted: false, responseProfileId: kind, activity: 0, eq: {} });

assert.equal(exceedsDragThreshold({ x: 10, y: 10 }, { x: 14.9, y: 10 }, "mouse"), false, "mouse click under 5px remains selection-only");
assert.equal(exceedsDragThreshold({ x: 10, y: 10 }, { x: 15, y: 10 }, "mouse"), true, "mouse drag begins at 5px");
assert.equal(exceedsDragThreshold({ x: 10, y: 10 }, { x: 19.9, y: 10 }, "touch"), false, "touch tap under 10px remains selection-only");
assert.equal(exceedsDragThreshold({ x: 10, y: 10 }, { x: 20, y: 10 }, "touch"), true, "touch drag begins at 10px");
assert.equal(POINTER_DRAG_THRESHOLD_PX.mouse, 5, "desktop threshold is deliberately constrained");
assert.equal(POINTER_DRAG_THRESHOLD_PX.touch, 10, "mobile threshold is deliberately constrained");

const column = [speaker("root", "sub", .5, .5), speaker("mid", "full", .5, .5, "root", "center"), speaker("top", "high", .5, .5, "mid", "center")];
const moved = moveStackRoot(column, "mid", { x: .7, y: .3 });
assert.equal(moved.find((item) => item.id === "root").position.x, .7, "dragging a stack member moves the root");
assert.equal(moved.find((item) => item.id === "root").position.y, .3, "root follows the requested safe point");
assert.equal(moved.find((item) => item.id === "mid").stackParentId, "root", "member drag preserves direct parent relation");
assert.equal(moved.find((item) => item.id === "top").stackParentId, "mid", "member drag preserves descendant relation");

const rotated = rotateSpeakerWithoutDetach(moved, "mid", Math.PI / 17);
assert.equal(rotated.find((item) => item.id === "mid").stackParentId, "root", "rotation never detaches a stack member");
assert.ok(Math.abs(rotated.find((item) => item.id === "mid").orientation.yaw - Math.PI / 12) < 1e-12, "rotation snaps to 15 degree increments");

const detached = detachSpeakerExplicitly(rotated, "mid");
assert.equal(detached.find((item) => item.id === "mid").stackParentId, null, "DETACH is the only action that clears the parent");
assert.equal(detached.find((item) => item.id === "mid").stackAlign, undefined, "DETACH clears stack alignment metadata");
assert.equal(detached.find((item) => item.id === "top").stackParentId, "mid", "DETACH does not silently alter children");

const clamped = clampStackRootPoint([speaker("edge", "sub", .5, .5)], "edge", { x: 0, y: 0 });
assert.ok(clamped.x > .10 && clamped.x < .12, "safe X bound accounts for half the physical sub width");
assert.ok(clamped.y > .10 && clamped.y < .12, "safe Y bound accounts for half the physical sub depth");
console.log("speaker interaction tests passed");
