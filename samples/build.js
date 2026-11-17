#!/usr/bin/env node
/* Builds the three standalone sample files.
   Each src/sampleN.src.html contains  <!-- @include file.js -->  markers;
   the referenced file from src/ is inlined as a <script> so every output
   file works on its own (double-click to open, no server needed).
   Usage:  node samples/build.js                                        */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "src");
const OUT = __dirname;

for (const n of [1, 2, 3]) {
  const srcFile = path.join(SRC, `sample${n}.src.html`);
  if (!fs.existsSync(srcFile)) { console.warn("skip (missing):", srcFile); continue; }
  const html = fs.readFileSync(srcFile, "utf8").replace(
    /<!--\s*@include\s+([\w.-]+)\s*-->/g,
    (_, name) => {
      const code = fs.readFileSync(path.join(SRC, name), "utf8");
      return `<script>\n/* ---- inlined from src/${name} ---- */\n${code.replace(/<\/script/gi, "<\\/script")}\n</script>`;
    }
  );
  const outFile = path.join(OUT, `Sample_${n}.html`);
  fs.writeFileSync(outFile, html);
  console.log("built", path.relative(process.cwd(), outFile), (html.length / 1024).toFixed(1) + " KB");
}
