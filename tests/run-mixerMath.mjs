import { buildSync } from "esbuild";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const work = mkdtempSync(join(tmpdir(), "clubcraft-mixer-math-"));
const bundle = join(work, "mixerMath.cjs");
try {
  buildSync({ entryPoints: ["client/src/lib/mixerMath.ts"], outfile: bundle, bundle: true, platform: "node", format: "cjs", logLevel: "error" });
  const result = spawnSync(process.execPath, ["tests/mixerMath.test.cjs", bundle], { stdio: "inherit" });
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(work, { recursive: true, force: true });
}
