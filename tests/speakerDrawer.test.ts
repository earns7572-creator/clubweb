import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const home = read("client/src/pages/Home.tsx");
const floor = read("client/src/components/ClubFloor3D.tsx");
const css = read("client/src/product-experience.css");

assert.match(home, /drawerPinStorageKey/);
assert.match(home, /localStorage\.setItem\(drawerPinStorageKey/);
assert.match(home, /onPointerEnter=\{onPointerEnter\}/);
assert.match(home, /scheduleDrawerClose/);
assert.match(home, /if \(drawerPinned \|\| drawerDragRef\.current\) return/);
assert.match(
  home,
  /onPointerDown=\{event => onDragStart\?\.\(event, modelId\)\}/
);
assert.doesNotMatch(home, /draggable=|onDragStart=\{\(event: DragEvent/);
assert.match(home, /preview\?\.valid/);
assert.match(home, /placeSpeakerModel\(active\.modelId, preview\.point\)/);
assert.match(home, /setView\("top"\)/);

for (const label of ["LAYOUT", "SPEAKERS", "RECIPE", "CABINETS"]) {
  assert.ok(
    home.includes(`label: "${label}"`),
    `${label} is available in the drawer`
  );
}
for (const family of [
  "Reggae",
  "Free Party",
  "Club",
  "Festival",
  "Hi-Fi",
  "Steppers",
]) {
  assert.ok(
    home.includes(family) ||
      read("client/src/lib/speakerModels.ts").includes(family)
  );
}

assert.match(floor, /drawerRaycaster\.current\.setFromCamera/);
assert.match(floor, /intersectPlane/);
assert.match(floor, /clampStackRootPoint\(sceneWithGhost/);
assert.match(floor, /physicalFootprintsPenetrate/);
assert.match(floor, /DrawerPlacementGhost/);
assert.match(floor, /valid: insideBounds && !overlaps/);

assert.match(css, /\.desktop-drawer-trigger[\s\S]*width:\s*30px/);
assert.match(
  css,
  /\.desktop-side-panel[\s\S]*transition:\s*transform 220ms ease/
);
assert.match(
  css,
  /\.desktop-panel-body \.systm-equipment-item[\s\S]*touch-action:\s*none/
);
const mobile = css.slice(css.lastIndexOf("@media (max-width: 760px)"));
assert.match(css, /\.desktop-drawer-trigger[\s\S]*display:\s*none/);
assert.doesNotMatch(
  mobile,
  /\.desktop-drawer-trigger\s*\{[\s\S]*display:\s*block/
);

console.log("speaker drawer tests passed");
