import assert from "node:assert/strict";
import { createMaterialStagingPlan } from "../client/src/lib/recipeMaterials";

const plan = createMaterialStagingPlan([
  { modelId: "reggae-scoop", quantity: 1 }, { modelId: "reggae-scoop", quantity: 1 },
  { modelId: "reggae-kick", quantity: 1 }, { modelId: "reggae-mid-horn", quantity: 1 },
  { modelId: "reggae-top", quantity: 1 },
]);
assert.equal(plan.length, 5, "one staging item is created per missing ingredient instance");
assert.deepEqual(plan.map((item) => [item.x, item.y]), [[.17, .18], [.39, .18], [.61, .18], [.83, .18], [.17, .36]], "staging uses modest rows and columns");
assert.equal(new Set(plan.map((item) => `${item.x}:${item.y}`)).size, plan.length, "staging points are unique");
assert.ok(plan.every((item) => item.x > 0 && item.x < 1 && item.y > 0 && item.y < 1), "staging remains inside normalized camera bounds");
console.log("recipe material tests passed");
