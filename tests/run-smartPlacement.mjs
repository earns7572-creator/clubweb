import { buildSync } from "esbuild";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const work = mkdtempSync(join(tmpdir(), "clubcraft-smart-placement-"));
const bundle = join(work, "smartPlacement.cjs");
try {
  buildSync({ entryPoints: ["client/src/lib/smartPlacement.ts"], outfile: bundle, bundle: true, platform: "node", format: "cjs", logLevel: "error" });
  const result = spawnSync(process.execPath, ["tests/smartPlacement.test.cjs", bundle], { stdio: "inherit" });
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(work, { recursive: true, force: true });
}
