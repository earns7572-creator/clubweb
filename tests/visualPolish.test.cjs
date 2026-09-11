const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const read = (path) => readFileSync(path, "utf8");
const floor = read("client/src/components/ClubFloor3D.tsx");
const mobile = read("client/src/mobile.css");
const shell = read("client/src/systm.css");
const home = read("client/src/pages/Home.tsx");
const anchor = read("client/src/components/ObjectControlsAnchor.tsx");

// Scene and model rendering contracts remain unchanged.
assert.match(floor, /orthographic\.zoom \*= size\.width < 760 \? \.80 : \.66/);
assert.match(floor, /ContactShadows/);
assert.match(floor, /roomWidth \* 1\.08, \.16, roomDepth \* 1\.1/);
assert.doesNotMatch(floor, /<Grid/);
assert.match(floor, /dragging \? 1\.03 : 1/);
// Overlay open state must not enter the scene sizing rules or its projection props.
assert.match(shell, /\.instrument-stage \{ position: absolute;[^}]*inset: 0;[^}]*isolation: isolate;/);
assert.doesNotMatch(shell + mobile, /\.(?:tray-open|tray-closed)[^{]*\.(?:instrument-stage|scene-surface|club-floor-3d)\s*\{/);
assert.match(mobile, /\.component-index \{ display: none;/);
assert.match(mobile, /\.is-mobile-open \.component-index \{ display: block;/);
assert.match(mobile, /\.spatial-inspector\.mobile-open \{ display: block;/);
assert.match(shell, /\.spatial-inspector\[hidden\] \{ display: none;/);
assert.match(home, /const inspectorHidden = speakerTrayOpen \|\| Boolean\(activeHeaderPopover\) \|\| mixerOpen \|\| customOpen/);
assert.match(anchor, /querySelector\("\.contextual-diagram-label"\)/);
assert.doesNotMatch(anchor, /useThree|camera\.|useFrame|setInterval/);
assert.match(anchor, /observer\.disconnect\(\)/);
assert.match(anchor, /cancelAnimationFrame\(frame\)/);
assert.match(shell, /\.side-speaker i\{background:var\(--cabinet-color/);
assert.doesNotMatch(home, /import "\.\.\/(floor-instrument|spatial-installation|dark-club)\.css"/);
console.log("release shell static contracts passed (not browser visual QA)");
