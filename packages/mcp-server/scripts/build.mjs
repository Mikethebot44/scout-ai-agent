import { build } from "esbuild";
import { copyFileSync } from "fs";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: "dist/bundled.js",
  sourcemap: true,
});

copyFileSync("dist/bundled.js", "dist/raw.txt");
