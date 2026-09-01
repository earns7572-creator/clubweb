import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const floor = read("client/src/components/ClubFloor3D.tsx");
const product = read("client/src/product-experience.css");
const page = read("client/index.html");
const home = read("client/src/pages/Home.tsx");

assert.ok(!floor.includes("DjBooth"));
assert.ok(
  floor.includes(
    'orthographic.zoom = size.width < 760 ? (mode === "club" ? 32 : 52) : 108'
  )
);
assert.match(floor, /snappedYawFromScreenPointer/);
assert.match(floor, /setPointerCapture/);
assert.match(floor, /aria-label=\{`Aim \$\{speaker\.label\}`\}/);
assert.doesNotMatch(
  floor,
  /onClick=\{[^}]*turn\(\)/s,
  "TURN click cannot rotate"
);
assert.match(product, /--product-graphite/);
assert.match(product, /\.product-experience \.header-controls/);
assert.match(product, /\.systm-library/);
assert.match(page, /SYSTM \/ Virtual Sound System/);
assert.match(
  home,
  /\| "mode"[\s\S]*\| "layout"[\s\S]*\| "recipe"[\s\S]*\| "sound"[\s\S]*\| "background"[\s\S]*\| "data"/
);
assert.match(home, /activeHeaderPopover/);
assert.doesNotMatch(
  home,
  /const \[showSourcePicker, setShowSourcePicker\] = useState/
);
assert.match(home, /event\.key === "Escape"/);
assert.match(home, /event\.target\.closest\("\.product-popover-owner"\)/);
assert.match(home, /if \(next\) setActiveHeaderPopover\(null\)/);

console.log("product UI and single-popover tests passed");
