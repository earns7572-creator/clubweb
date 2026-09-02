import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInitialSceneStateMap } from "../client/src/lib/systmSceneState";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const home = read("client/src/pages/Home.tsx");
const floor = read("client/src/components/ClubFloor3D.tsx");
const css = read("client/src/product-experience.css");

assert.match(
  home,
  /const SCENE_VIEWS: readonly SceneView\[\] = \["top", "side", "pov"\]/,
  "the view rail explicitly exposes TOP, SIDE, and POV"
);
assert.match(
  home,
  /className="view-switcher"[\s\S]*SCENE_VIEWS\.map/,
  "the selector renders the complete view rail"
);
assert.ok(home.includes('view === "top"'), "TOP keeps the existing scene branch");
for (const callback of [
  "onSpeakerMove={onSpeakerMoveTop}",
  "onSpeakerRotate={rotate}",
  "onSpeakerStack={onSpeakerStack}",
  "onListenerMove={onListenerMove}",
  "onSpeakerRemove={onSpeakerRemove}",
]) {
  assert.ok(home.includes(callback), `${callback} remains wired in TOP`);
}
assert.ok(floor.includes("onPointerMove"), "TOP keeps speaker drag handling");
assert.ok(floor.includes("onPointerDown"), "TOP keeps speaker selection handling");
assert.match(css, /\.product-experience \.view-switcher[\s\S]*z-index:\s*12/);
assert.match(css, /\.product-experience \.view-switcher[\s\S]*transform:\s*none/);
assert.match(css, /\.product-experience \.view-switcher button[\s\S]*min-height:\s*48px/);

const scenes = createInitialSceneStateMap();
assert.equal(scenes.club.view, "top");
assert.equal(scenes["sound-system"].view, "top");
scenes.club.view = "side";
assert.equal(
  scenes["sound-system"].view,
  "top",
  "CLUB and SOUND SYSTEM keep independent view state"
);

console.log("top view regression tests passed");
