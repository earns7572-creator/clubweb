import { build } from "esbuild";
import { createRequire } from "node:module";
import { unlink } from "node:fs/promises";

const require = createRequire(import.meta.url);
const output = new URL("../.tmp-band-activity.cjs", import.meta.url);
try {
  await build({ entryPoints: [new URL("../client/src/lib/bandActivity.ts", import.meta.url).pathname], bundle: true, platform: "node", format: "cjs", outfile: output.pathname, logLevel: "silent", tsconfigRaw: { compilerOptions: { baseUrl: ".", paths: { "@/*": ["client/src/*"] } } } });
  require(new URL("./bandActivity.test.cjs", import.meta.url).pathname);
} finally { await unlink(output).catch(() => {}); }
