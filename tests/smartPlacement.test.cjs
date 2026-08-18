const assert = require("node:assert/strict");
const { placeWithSmartGuides } = require(process.argv[2]);

const base = {
  speakers: [{ id: "a", point: { x: .25, y: .25 } }, { id: "b", point: { x: .45, y: .25 } }],
  listener: { x: .5, y: .5 },
  bounds: { minX: .07, maxX: .93, minY: .07, maxY: .93 },
  scale: { x: 13, y: 8 },
  enter: { x: .008, y: .012 },
  release: { x: .013, y: .02 },
  radialEnterMeters: .11,
  radialReleaseMeters: .18,
  modifiers: { alt: false, shift: false },
  previous: {},
};

const free = placeWithSmartGuides({ ...base, draggedId: "drag", raw: { x: .565, y: .581 } });
assert.equal(free.point.x, .565, "遠い位置ではfree dragを保つ");
assert.equal(free.point.y, .581, "遠い位置ではfree dragを保つ");

const alignment = placeWithSmartGuides({ ...base, draggedId: "drag", raw: { x: .252, y: .66 } });
assert.equal(alignment.point.x, .25, "Speaker alignmentをgridより優先する");
assert.equal(alignment.snap.x.kind, "alignment");

const hysteresis = placeWithSmartGuides({ ...base, draggedId: "drag", raw: { x: .261, y: .66 }, previous: alignment.snap });
assert.equal(hysteresis.point.x, .25, "release threshold内ではsnapを保持する");

const altFree = placeWithSmartGuides({ ...base, draggedId: "drag", raw: { x: .252, y: .66 }, modifiers: { alt: true, shift: false } });
assert.equal(altFree.point.x, .252, "Alt / Option中はsnapを無効化する");

const equalSpacing = placeWithSmartGuides({ ...base, draggedId: "drag", raw: { x: .651, y: .252 } });
assert.equal(equalSpacing.snap.x.kind, "spacing", "equal spacing候補を検出する");
assert.equal(equalSpacing.guides.distance.equal, true, "equal spacingでは距離guideを出す");

const radialBase = { ...base, speakers: [{ id: "a", point: { x: .5, y: .25 } }] };
const sameDistance = placeWithSmartGuides({ ...radialBase, draggedId: "drag", raw: { x: .6539, y: .5 } });
assert.equal(sameDistance.snap.radial.radiusMeters.toFixed(2), "2.00", "Listenerから既存Speakerと同距離へsnapする");

const sixteen = Array.from({ length: 16 }, (_, index) => ({ id: `s-${index}`, point: { x: .12 + (index % 4) * .2, y: .12 + Math.floor(index / 4) * .2 } }));
const manySpeakers = placeWithSmartGuides({ ...base, speakers: sixteen, draggedId: "drag", raw: { x: .735, y: .715 } });
assert.ok(manySpeakers.point.x >= base.bounds.minX && manySpeakers.point.x <= base.bounds.maxX, "16台でもX座標をclampする");
assert.ok(manySpeakers.point.y >= base.bounds.minY && manySpeakers.point.y <= base.bounds.maxY, "16台でもY座標をclampする");

console.log("smartPlacement tests passed");
