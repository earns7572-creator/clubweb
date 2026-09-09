const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const read = (path) => readFileSync(path, "utf8");
const floor = read("client/src/components/ClubFloor3D.tsx");
const mobile = read("client/src/mobile.css");
const systm = read("client/src/systm.css");

assert.match(floor, /orthographic\.zoom \*= size\.width < 760 \? \.80 : \.66/);
assert.match(floor, /ContactShadows/);
assert.match(floor, /roomWidth \* 1\.08, \.16, roomDepth \* 1\.1/);
assert.doesNotMatch(floor, /<Grid/);
assert.match(floor, /dragging \? 1\.03 : 1/);
assert.match(mobile, /transform: translateY\(calc\(100% - 42px\)\)/);
assert.match(mobile, /\.is-mobile-open \{[^}]*transform: translateY\(0\); \}/);
assert.match(mobile, /transition: transform 180ms/);
assert.match(mobile, /\.tray-closed \.view-switcher/);
assert.match(systm, /\.cabinet-color-control/);
assert.match(systm, /\.side-speaker i\{background:var\(--cabinet-color/);

console.log("visual polish static tests passed");
