import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const home = read("client/src/pages/Home.tsx");
const css = read("client/src/product-experience.css");
const floor = read("client/src/components/ClubFloor3D.tsx");

assert.match(
  home,
  /type DesktopPanel =\s*[\s\S]*\| "layout"[\s\S]*\| "speakers"[\s\S]*\| "recipe"[\s\S]*\| "cabinets"[\s\S]*\| "inspector"[\s\S]*\| "mix"/
);
assert.match(home, /function DesktopSidePanel\(/);
assert.match(home, /className="desktop-scene-frame"/);
assert.match(home, /className="desktop-side-panel"/);
assert.match(home, /className="desktop-panel-tabs"/);
assert.match(home, /className="mobile-surface-controls"/);
assert.match(home, /SCENE_VIEWS: readonly SceneView\[\] = \["top", "side", "pov"\]/);
assert.match(home, /view === "top"/);

for (const label of ["LAYOUT", "SPEAKERS", "RECIPE", "CABINETS", "INSPECTOR", "MIX"]) {
  assert.ok(home.includes(`label: "${label}"`), `${label} remains a panel tab`);
}

const desktop = css.slice(css.indexOf("@media (min-width: 1121px)"));
assert.match(desktop, /grid-template-columns:\s*minmax\(0, 1fr\) minmax\(320px, 380px\)/);
assert.match(desktop, /\.desktop-scene-frame > \.scene-surface[\s\S]*width: min\(100%, calc\(100svh - 64px - 36px\)\)/);
assert.match(desktop, /\.desktop-scene-frame > \.scene-surface[\s\S]*height: min\(100%, calc\(100svh - 64px - 36px\)\)/);
assert.match(desktop, /\.desktop-scene-frame > \.scene-surface[\s\S]*aspect-ratio: 1/);
assert.match(desktop, /\.desktop-panel-body[\s\S]*overflow: auto/);
assert.match(desktop, /\.product-experience > \.mixer-trigger[\s\S]*display: none/);

const mobile = css.slice(css.indexOf("@media (max-width: 760px)", css.indexOf("@media (min-width: 1121px)")));
assert.match(mobile, /\.desktop-scene-frame[\s\S]*display: contents/);
assert.match(mobile, /\.mobile-surface-controls[\s\S]*display: contents/);
assert.match(mobile, /\.product-experience \.club-layout-library[\s\S]*bottom: 0/);
assert.match(mobile, /\.product-experience \.speaker-composer\.speaker-library\.systm-library[\s\S]*bottom: 0/);

assert.match(floor, /onPointerMove/);
assert.match(floor, /ROOM_LAYOUT_BOUNDS/);

console.log("desktop layout tests passed");
