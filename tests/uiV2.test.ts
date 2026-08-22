import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const floor = read("client/src/components/ClubFloor3D.tsx");
const systm = read("client/src/systm.css");
const onboarding = read("client/src/first-use-onboarding.css");
const page = read("client/index.html");

assert.ok(!floor.includes("DjBooth"), "Top View must not render a DJ booth context object");
assert.ok(!floor.includes("spatial-stage-anchor"), "Top View must not render STAGE text");
assert.ok(floor.includes("orthographic.zoom = size.width < 760 ? 46 : 108"), "desktop TOP camera must use the focused UI v2 framing");
assert.ok(floor.includes("const yaw = snapYaw("), "speaker yaw must snap by default while rotating");
assert.ok(floor.includes("TURN {yawToDegrees(yaw)}°"), "selected speaker must show its orientation value");
assert.ok(systm.includes("--font-ui") && systm.includes("--font-tech"), "UI and technical typography roles must be explicit");
assert.ok(!systm.includes("JetBrains Mono"), "UI v2 must not reintroduce JetBrains Mono");
assert.ok(systm.includes(".systm-library") && systm.includes("data-slot"), "SYSTEM LIBRARY must remain an indexed equipment shelf");
assert.ok(systm.includes("SPEAKER / SELECTED"), "Inspector must retain a technical channel identity");
assert.ok(onboarding.includes("font-ui") && onboarding.includes("font-tech"), "onboarding must share the UI typography system");
assert.ok(page.includes("SYSTM / Virtual Sound System"), "document title must use SYSTM micro-copy");

console.log("SYSTM UI v2 static tests passed");
