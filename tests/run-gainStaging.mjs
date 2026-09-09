import { build } from "esbuild";
import { unlink } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const output = new URL("../.tmp-gain-staging.cjs", import.meta.url);
try {
  await build({ entryPoints: [new URL("../client/src/lib/audioGainStaging.ts", import.meta.url).pathname], bundle: true, platform: "node", format: "cjs", outfile: output.pathname, logLevel: "silent" });
  const result = spawnSync(process.execPath, [new URL("./gainStaging.test.cjs", import.meta.url).pathname, output.pathname], { stdio: "inherit" });
  process.exitCode = result.status ?? 1;
} finally { await unlink(output).catch(() => {}); }
