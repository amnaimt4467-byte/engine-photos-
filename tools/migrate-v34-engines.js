#!/usr/bin/env node
/* One-time migration of the ENGINE and VEHICLE tables from the old single-file
   app (EngineSpecs v34 HTML) into data-src/.

   Usage:  node tools/migrate-v34-engines.js /path/to/EngineSpecs_researched_v34.html

   v34 sources read
     engineDB    259 engines: specs, pressures, clearances, torque, special functions …
     vehicleDB   brand → model → "years · engine" entries pointing at an engine
     brandDB     brand names and icons

   Output
     data-src/engines/<file>.json   one file per engine-key prefix (toyota, isuzu …)
     data-src/vehicles.json         the catalogue the vehicle picker uses

   Every value keeps its trust level:
     engine "verified: true" in v34  → status "sourced"   (cited, not checked against the manual here)
     everything else                 → status "pending"   (needs verification)
     a value that carried "⚠ Unverified" in its text gets its own flag (u: 1)
   Nothing is marked "published": that happens only after checking the repair manual.

   Text is cleaned, never invented: "⚠ Unverified —" becomes a flag, "[Source: …]" becomes
   a field, HTML tags become plain text, empty placeholders are dropped. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = process.argv[2];
if (!SRC || !fs.existsSync(SRC)) { console.error("Usage: node tools/migrate-v34-engines.js <v34.html>"); process.exit(1); }
const OUT = path.join(__dirname, "..", "data-src");
const lines = fs.readFileSync(SRC, "utf8").split("\n");
function grabConst(name) {
  const start = lines.findIndex((l) => l.startsWith("const " + name + " = {"));
  if (start < 0) throw new Error("not found in v34: " + name);
  let end = start; while (!/^\};/.test(lines[end])) end++;
  return lines.slice(start, end + 1).join("\n");
}
const ctx = {};
vm.runInNewContext(["engineDB", "brandDB", "vehicleDB"].map(grabConst).join("\n") + "\n;__out = { engineDB, brandDB, vehicleDB };", ctx);
const { engineDB, brandDB, vehicleDB } = ctx.__out;

/* ---------- text cleaning ---------- */
const PLACEHOLDER = /^(சேர்க்கப்படலை|சேர்க்கப்படவில்லை|n\/a|tbd|-|—|\?)?$/i;
const stats = { unverifiedFlags: 0, sources: 0, placeholders: 0, html: 0 };
function clean(str) {
  let s = String(str);
  if (/<[a-z/][^>]*>/i.test(s)) { stats.html++; s = s.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li)>/gi, "\n").replace(/<[^>]+>/g, ""); }
  const o = {};
  if (/⚠\s*Unverified/i.test(s)) { o.u = 1; stats.unverifiedFlags++; s = s.replace(/⚠\s*Unverified\s*[—–-]?\s*/gi, ""); }
  const m = s.match(/\s*\[Source:\s*([^\]]+)\]\s*$/i);
  if (m) { o.src = m[1].trim(); stats.sources++; s = s.slice(0, m.index); }
  s = s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (PLACEHOLDER.test(s)) { stats.placeholders++; return null; }
  o.v = s;
  return o;
}
/* any v34 value → a small tree the app can draw:
     { v, u?, src? }            one text
     { list: [node…] }          a list
     { rows: [[label, node]…] } label / value pairs (may nest) */
function node(value) {
  if (value == null) return null;
  if (typeof value === "string") return clean(value);
  if (typeof value === "number") return { v: String(value) };
  if (typeof value === "boolean") return { v: value ? "Yes" : "No" };
  if (Array.isArray(value)) { const list = value.map(node).filter(Boolean); return list.length ? { list } : null; }
  const rows = Object.entries(value).map(([k, v]) => [k, node(v)]).filter((r) => r[1]);
  return rows.length ? { rows } : null;
}

/* ---------- engines ---------- */
const META = ["make", "display", "vehicles", "verified", "has_versions", "has_variants", "linked_dtc"];
const FILE_OF = { al: "ashok_leyland", ashok: "ashok_leyland" };
const engines = {}, byFile = {};
const sectionCount = {};
for (const [key, e] of Object.entries(engineDB)) {
  const prefix = key.split("_")[0], file = FILE_OF[prefix] || prefix;
  const rec = { key, make: e.make, name: e.display, vehicles: e.vehicles || "", status: e.verified === true ? "sourced" : "pending", sections: {} };
  for (const [f, v] of Object.entries(e)) {
    if (META.includes(f)) continue;
    const n = node(v);
    if (n) { rec.sections[f] = n; sectionCount[f] = (sectionCount[f] || 0) + 1; }
  }
  if (Array.isArray(e.linked_dtc) && e.linked_dtc.length) rec.linkedDtc = e.linked_dtc;
  engines[key] = rec; (byFile[file] = byFile[file] || []).push(rec);
}

/* ---------- vehicle catalogue ---------- */
const slug = (s) => String(s).toLowerCase().replace(/[–—]/g, "-").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const catalogue = [];
let nModels = 0, nEntries = 0;
for (const [bid, models] of Object.entries(vehicleDB)) {
  const modelIds = Object.keys(models); if (!modelIds.length) continue;        // brands listed in v34 but with no vehicles yet
  const brand = { id: bid, name: (brandDB[bid] && brandDB[bid].name) || bid, icon: (brandDB[bid] && brandDB[bid].icon) || "🚗", models: [] };
  for (const mid of modelIds) {
    const m = models[mid], seen = {}, entries = [];
    for (const [label, y] of Object.entries(m.years || {})) {
      if (!engines[y.engine_key]) throw new Error("vehicle " + bid + "/" + mid + " points at unknown engine " + y.engine_key);
      const parts = label.split(" · ");
      let id = slug(label); if (seen[id]) id += "-" + (++seen[id]); else seen[id] = 1;
      entries.push({ id, years: parts[0].trim(), variant: parts.slice(1).join(" · ").trim(), engine: y.engine_key });
      nEntries++;
    }
    brand.models.push({ id: mid, name: m.name, entries }); nModels++;
  }
  catalogue.push(brand);
}

/* ---------- checks ---------- */
const dbEngines = Object.keys(engineDB).length;
const dbModels = Object.values(vehicleDB).reduce((n, b) => n + Object.keys(b).length, 0);
const dbEntries = Object.values(vehicleDB).reduce((n, b) => n + Object.values(b).reduce((k, m) => k + Object.keys(m.years || {}).length, 0), 0);
if (Object.keys(engines).length !== dbEngines) throw new Error("engine count mismatch");
if (nModels !== dbModels || nEntries !== dbEntries) throw new Error("vehicle count mismatch");

/* ---------- write ---------- */
fs.rmSync(path.join(OUT, "engines"), { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "engines"), { recursive: true });
for (const [file, list] of Object.entries(byFile)) {
  list.sort((a, b) => a.key.localeCompare(b.key));
  fs.writeFileSync(path.join(OUT, "engines", file + ".json"), "[\n" + list.map((r) => JSON.stringify(r, null, 1).replace(/^/gm, " ")).join(",\n") + "\n]\n");
}
fs.writeFileSync(path.join(OUT, "vehicles.json"), "[\n" + catalogue.map((b) =>
  "  {\"id\": " + JSON.stringify(b.id) + ", \"name\": " + JSON.stringify(b.name) + ", \"icon\": " + JSON.stringify(b.icon) + ", \"models\": [\n" +
  b.models.map((m) => "    {\"id\": " + JSON.stringify(m.id) + ", \"name\": " + JSON.stringify(m.name) + ", \"entries\": [\n" + m.entries.map((e) => "      " + JSON.stringify(e)).join(",\n") + "\n    ]}").join(",\n") +
  "\n  ]}").join(",\n") + "\n]\n");

/* ---------- summary ---------- */
const st = {}; Object.values(engines).forEach((e) => { st[e.status] = (st[e.status] || 0) + 1; });
console.log("engines            : " + dbEngines + "  → " + Object.keys(byFile).length + " files (" + Object.entries(byFile).map(([f, l]) => f + " " + l.length).join(", ") + ")");
console.log("engine status      : " + JSON.stringify(st));
console.log("vehicle catalogue  : " + catalogue.length + " brands, " + nModels + " models, " + nEntries + " year/engine entries");
console.log("sections filled    : " + Object.entries(sectionCount).sort((a, b) => b[1] - a[1]).map(([f, n]) => f + " " + n).join(", "));
console.log("cleaned            : " + stats.unverifiedFlags + " 'Unverified' marks → flags, " + stats.sources + " sources split out, " + stats.placeholders + " empty placeholders dropped, " + stats.html + " HTML fragments → text");
console.log("written to " + path.relative(process.cwd(), OUT));
