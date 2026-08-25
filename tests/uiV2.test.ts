import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const floor = read("client/src/components/ClubFloor3D.tsx");
const systm = read("client/src/systm.css");
const onboarding = read("client/src/first-use-onboarding.css");
const page = read("client/index.html");
const home = read("client/src/pages/Home.tsx");

assert.ok(!floor.includes("DjBooth"), "Top View must not render a DJ booth context object");
assert.ok(!floor.includes("spatial-stage-anchor"), "Top View must not render STAGE text");
assert.ok(floor.includes("orthographic.zoom = size.width < 760 ? 52 : 108"), "TOP camera must use the focused UI v2 framing");
assert.ok(floor.includes("const yaw = snapYaw("), "speaker yaw must snap by default while rotating");
assert.ok(floor.includes("TURN {yawToDegrees(yaw)}°"), "selected speaker must show its orientation value");
assert.ok(systm.includes("--font-ui") && systm.includes("--font-tech"), "UI and technical typography roles must be explicit");
assert.ok(!systm.includes("JetBrains Mono"), "UI v2 must not reintroduce JetBrains Mono");
assert.ok(systm.includes(".systm-library") && systm.includes("data-slot"), "SYSTEM LIBRARY must remain an indexed equipment shelf");
assert.ok(systm.includes("SPEAKER / SELECTED"), "Inspector must retain a technical channel identity");
assert.ok(onboarding.includes("font-ui") && onboarding.includes("font-tech"), "onboarding must share the UI typography system");
assert.ok(page.includes("SYSTM / Virtual Sound System"), "document title must use SYSTM micro-copy");
assert.ok(home.includes('type HeaderPopover = "sound" | "system" | "background" | "layout" | null'), "Header popovers must use an explicit single-state union");
assert.ok(home.includes("activeHeaderPopover"), "Header popovers must derive visibility from one active state");
assert.ok(!home.includes("const [showSourcePicker, setShowSourcePicker] = useState(false)"), "SOUND must not retain an independent boolean state");
assert.ok(!home.includes("const [showPresetPicker, setShowPresetPicker] = useState(false)"), "SYSTEM must not retain an independent boolean state");
assert.ok(home.includes('event.key === "Escape"'), "Escape must dismiss an active Header popover");
assert.ok(home.includes('event.target.closest(".source-trigger-wrap, .preset-trigger-wrap, .surface-trigger-wrap, .layout-trigger-wrap")'), "outside pointer input must dismiss an active Header popover while trigger and panel clicks remain usable");
assert.ok(home.includes("const setMixerOpen = (next: boolean) => { if (next) setActiveHeaderPopover(null)"), "opening MIX must immediately close Header popovers");
assert.ok(home.includes("const setCustomOpen = (next: boolean) => { if (next) setActiveHeaderPopover(null)"), "opening CUSTOM must immediately close Header popovers");

console.log("SYSTM UI v2 and Header popover static tests passed");
