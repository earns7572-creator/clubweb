const assert = require("node:assert/strict");
const { BLOCK_HEIGHT_METERS, createBlockResolver, findBlockStackCandidate, findSpeakerBlockCandidate, normalizeSpeakerSupportHeights, syncSpeakerSupportPositions } = require("../.tmp-block-support.cjs");

const block = (id, x = .5, y = .5, parent = null) => ({ id, label: "BLOCK", position: { x, y }, stackParentId: parent });
const speaker = (id, x = .5, y = .5, supportBlockId = null) => ({ id, kind: "full", modelId: "modern-full", label: id, position: { x, y, z: 0 }, orientation: { yaw: 0 }, stackParentId: null, supportBlockId, level: 1, muted: false, responseProfileId: "modern-full", activity: 0, eq: {} });

const floor = block("floor");
const upper = block("upper", .5, .5, "floor");
const resolver = createBlockResolver([floor, upper]);
assert.equal(resolver.getBottomMeters(floor), 0, "BLOCK rests on the floor");
assert.equal(resolver.getTopMeters(floor), BLOCK_HEIGHT_METERS, "BLOCK top is one block height above the floor");
assert.equal(resolver.getBottomMeters(upper), BLOCK_HEIGHT_METERS, "BLOCK on BLOCK derives its physical bottom");
assert.equal(resolver.getTopMeters(upper), BLOCK_HEIGHT_METERS * 2, "stacked BLOCK height accumulates physically");

const supported = syncSpeakerSupportPositions([speaker("cab", .2, .2, "upper")], [floor, upper]);
assert.equal(supported[0].position.x, .5, "supported speaker follows its BLOCK X");
assert.equal(supported[0].position.y, .5, "supported speaker follows its BLOCK Y");
assert.equal(supported[0].position.z, BLOCK_HEIGHT_METERS * 2 / 6, "speaker world elevation reflects the full BLOCK support height");
assert.equal(normalizeSpeakerSupportHeights([speaker("floor-cab", .5, .5)], [floor])[0].position.z, 0, "un-supported speaker remains on the floor");

const candidate = findBlockStackCandidate({ dragged: block("drag", .503, .499), point: { x: .503, y: .499 }, blocks: [floor, block("drag", .503, .499)] });
assert.equal(candidate?.parentId, "floor", "nearby BLOCK is a stack target");
const speakerCandidate = findSpeakerBlockCandidate({ speaker: speaker("cab"), point: { x: .5, y: .5 }, blocks: [floor] });
assert.equal(speakerCandidate?.blockId, "floor", "speaker can target a BLOCK support");
console.log("BLOCK support tests passed");
