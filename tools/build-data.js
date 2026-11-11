#!/usr/bin/env node
/* Builds the DTC library the app loads:  data-src/  →  app/data/dtc-lib.js

   Usage:  node tools/build-data.js

   - drops "not written yet" placeholder steps that came from the old app
   - fills Tamil / Sinhala text: hand-written entries in data-src/i18n/ win,
     otherwise DTC titles get a helper line from tools/lib/dtc-glossary.js
   - leaves vehicle-specific "extra" material out (it belongs to vehicle packs)
   - prints how much of each language is covered

   The output is a plain <script> file (no fetch) so it works from file://
   and inside the Android app. The app loads it only when DTC data is first needed. */
const fs = require("fs");
const path = require("path");
const glossary = require("./lib/dtc-glossary");

const SRC = path.join(__dirname, "..", "data-src");
const OUT = path.join(__dirname, "..", "app", "data", "dtc-lib.js");
const readJSON = (f, fallback) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : fallback);

/* translation memory: { "source text": "translation" } */
const TM = {
  ta: readJSON(path.join(SRC, "i18n", "ta.json"), {}),      // English → Tamil
  si: readJSON(path.join(SRC, "i18n", "si.json"), {}),      // English → Sinhala
  en: readJSON(path.join(SRC, "i18n", "en-from-ta.json"), {}) // Tamil-mixed source → English
};
/* part names and source notes that mechanics read in English anyway: shown as-is in every language */
const KEEP = new Set(readJSON(path.join(SRC, "i18n", "keep-english.json"), []));
const PLACEHOLDER = /^⚠ இந்த code-க்கு step-by-step|^See Repair Manual/;
const stats = { placeholders: 0, vehicleOnly: 0, title: { n: 0, ta: 0, si: 0, taAuto: 0, siAuto: 0 }, detail: { n: 0, en: 0, ta: 0, si: 0 } };
const missing = { ta: new Set(), si: new Set(), en: new Set() };

/* complete a text item {en?,ta?,si?} from the translation memory */
function fill(t, kind) {
  if (!t) return t;
  const o = { ...t };
  if (!o.en && o.ta && TM.en[o.ta]) o.en = TM.en[o.ta];
  if (o.en) {
    if (!o.ta && TM.ta[o.en]) o.ta = TM.ta[o.en];
    if (!o.si && TM.si[o.en]) o.si = TM.si[o.en];
    if (kind !== "title" && KEEP.has(o.en)) { o.ta = o.ta || o.en; o.si = o.si || o.en; }
  }
  if (kind === "title") {
    stats.title.n++;
    if (!o.ta) { const g = glossary.translate(o.en, "ta"); if (g) { o.ta = g; stats.title.taAuto++; } }
    if (!o.si) { const g = glossary.translate(o.en, "si"); if (g) { o.si = g; stats.title.siAuto++; } }
    if (o.ta) stats.title.ta++; else missing.ta.add(o.en);
    if (o.si) stats.title.si++; else missing.si.add(o.en);
  } else {
    stats.detail.n++;
    ["en", "ta", "si"].forEach((l) => { if (o[l]) stats.detail[l]++; });
    if (!o.en && o.ta) missing.en.add(o.ta);
    if (o.en && !o.ta) missing.ta.add(o.en);
    if (o.en && !o.si) missing.si.add(o.en);
  }
  return o;
}
/* ---- generic layer only: keep it generic ----
   The old data stored one vehicle's manual steps (connector pins, wire colours, dealer-tool menus,
   exact voltages) under generic codes. Those lines are wrong for other vehicles, so they are left
   out of the generic library. They stay in data-src/ and will go into that vehicle's own pack. */
const PIN_NOTE = /\s*\((?=[^)]*(?:\bpins?\b|\bE\d{2}\b))[^)]*\)/gi;                       // "(E12 pin 119)" → removed from the sentence
const VEHICLE_ONLY = new RegExp([
  "\\bpins?\\s?\\d", "\\b[EJ]\\d{2}\\b", "Tech 2", "TIS 2000", "Techstream", "Euro \\d", "Section \\d", "^STEP \\d", "Sensors tab",
  "Diagnostic System Check", "part எண்", "\\bTSB\\b", "Valvematic", "Variable Valve Lift", "METER fuse", "\\d+-notch", "\\bC1336\\b", "\\bDPD\\b",
  "\\bPTO\\b", "SVS lamp", "\\bICU\\b", "\\d\\s?(?:mA|V|Ω)(?![A-Za-z])"
].join("|"), "i");
function genericOnly(t) {
  const o = {};
  for (const l of Object.keys(t)) { const v = t[l].replace(PIN_NOTE, "").trim(); if (VEHICLE_ONLY.test(v)) { stats.vehicleOnly++; return null; } o[l] = v; }
  return o;
}
const real = (t) => { const s = t && (t.ta || t.en || ""); if (PLACEHOLDER.test(s)) { stats.placeholders++; return false; } return !!s; };
const list = (arr, isGeneric) => (arr || []).filter(real).map((t) => (isGeneric ? genericOnly(t) : t)).filter(Boolean).map((t) => fill(t, "detail"));

/* one record in app form (short keys keep the file small) */
function pack(r, isGeneric) {
  const o = { t: fill(r.title, "title"), s: r.status };
  if (r.sys) o.y = r.sys;
  const sym = list(r.symptoms, isGeneric), cau = list(r.causes, isGeneric), st = list(r.steps, isGeneric);
  if (sym.length) o.sym = sym;
  if (cau.length) o.cau = cau;
  if (st.length) o.st = st;
  if (r.repair && real(r.repair)) { const rp = isGeneric ? genericOnly(r.repair) : r.repair; if (rp) o.rep = fill(rp, "detail"); }
  /* blink codes differ per manufacturer, so the generic layer never shows one (it stays in data-src) */
  if (r.flash && !isGeneric) o.fl = r.flash;
  if (r.mil) o.mil = r.mil;
  if (r.related && !isGeneric) o.rel = r.related;
  if (r.source) o.src = r.source;
  if (r.note) o.note = r.note;
  if (r.suspect) o.sus = r.suspect;
  return o;
}

const lib = { version: "", generic: {}, brands: {}, engineGroups: readJSON(path.join(SRC, "engine-groups.json"), {}) };
for (const f of fs.readdirSync(path.join(SRC, "generic")).sort()) {
  for (const r of readJSON(path.join(SRC, "generic", f))) {
    if (lib.generic[r.code]) throw new Error("duplicate generic code " + r.code);
    lib.generic[r.code] = pack(r, true);
  }
}
for (const f of fs.readdirSync(path.join(SRC, "brand")).sort()) {
  const b = readJSON(path.join(SRC, "brand", f));
  const out = { name: b.name, groups: {}, loose: {} };
  for (const g of b.groups) {
    const codes = {};
    for (const r of g.codes) { if (codes[r.code]) throw new Error("duplicate " + r.code + " in " + g.id); codes[r.code] = pack(r); }
    out.groups[g.id] = { title: g.title, y: g.sys, src: g.source, st: list(g.steps), codes };
  }
  for (const r of b.loose) out.loose[r.code] = pack(r);
  lib.brands[b.brand] = out;
}

/* version = short fingerprint of the content, so rebuilding unchanged data gives an identical file */
lib.version = require("crypto").createHash("sha1").update(JSON.stringify(lib)).digest("hex").slice(0, 8);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
/* JSON.parse of one string is much faster for the phone than a huge object literal */
fs.writeFileSync(OUT, "/* GENERATED by tools/build-data.js from data-src/ — do not edit by hand */\nvar DTC_LIB = JSON.parse(" + JSON.stringify(JSON.stringify(lib)) + ");\n");

/* work lists: what still needs a human translation */
const todo = path.join(SRC, "i18n", "todo");
fs.mkdirSync(todo, { recursive: true });
Object.entries(missing).forEach(([l, set]) => fs.writeFileSync(path.join(todo, "missing-" + l + ".txt"), [...set].sort().join("\n") + "\n"));

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 100) + "%";
const nGroups = Object.values(lib.brands).reduce((n, b) => n + Object.keys(b.groups).length, 0);
const nBrandCodes = Object.values(lib.brands).reduce((n, b) => n + Object.keys(b.loose).length + Object.values(b.groups).reduce((m, g) => m + Object.keys(g.codes).length, 0), 0);
console.log("generic codes : " + Object.keys(lib.generic).length);
console.log("brand records : " + nBrandCodes + " (" + Object.keys(lib.brands).length + " brands, " + nGroups + " groups)");
console.log("placeholders dropped : " + stats.placeholders);
console.log("vehicle-only lines kept out of the generic layer : " + stats.vehicleOnly);
console.log("titles  : " + stats.title.n + " · Tamil " + pct(stats.title.ta, stats.title.n) + " (" + stats.title.taAuto + " by glossary) · Sinhala " + pct(stats.title.si, stats.title.n) + " (" + stats.title.siAuto + " by glossary)");
console.log("details : " + stats.detail.n + " · English " + pct(stats.detail.en, stats.detail.n) + " · Tamil " + pct(stats.detail.ta, stats.detail.n) + " · Sinhala " + pct(stats.detail.si, stats.detail.n));
{
  const cov = (b) => { let n = 0, ta = 0, si = 0, en = 0; const each = (t) => { n++; if (t.ta) ta++; if (t.si) si++; if (t.en) en++; };
    Object.values(lib.brands[b].groups).forEach((g) => { g.st.forEach(each); Object.values(g.codes).forEach((r) => { each(r.t); (r.cau || []).forEach(each); }); });
    return b + " groups: " + n + " texts · English " + pct(en, n) + " · Tamil " + pct(ta, n) + " · Sinhala " + pct(si, n); };
  console.log(cov("toyota"));
}
console.log("still to translate (unique strings): → Tamil " + missing.ta.size + " · → Sinhala " + missing.si.size + " · → English " + missing.en.size + "   (lists in data-src/i18n/todo/)");
console.log("wrote " + path.relative(process.cwd(), OUT) + " " + (fs.statSync(OUT).size / 1024).toFixed(0) + " KB");


/* =====================================================================
   ENGINES + VEHICLE CATALOGUE
     data-src/vehicles.json      → app/data/catalog.js           (loaded at start: small)
     data-src/engines/<f>.json   → app/data/engines/<f>.js       (loaded when a vehicle of that file is opened)
   Row labels found in data-src/i18n/spec-labels.json become {en, ta, si}.
   ===================================================================== */
{
  const LABELS = readJSON(path.join(SRC, "i18n", "spec-labels.json"), {});
  const ENG_OUT = path.join(__dirname, "..", "app", "data", "engines");
  const asScript = (prefix, obj) => "/* GENERATED by tools/build-data.js from data-src/ — do not edit by hand */\n" + prefix + "JSON.parse(" + JSON.stringify(JSON.stringify(obj)) + ");\n";
  let labelHits = 0, labelMiss = new Set();
  const label = (k) => { if (LABELS[k]) { labelHits++; return LABELS[k]; } labelMiss.add(k); return k; };
  const withLabels = (sections) => {
    const out = {};
    for (const [id, n] of Object.entries(sections)) out[id] = n.rows ? { rows: n.rows.map(([k, v]) => [label(k), v]) } : n;
    return out;
  };
  /* which diagnosis flows fit an engine:
       "cr" common-rail diesel · "mech" mechanical-pump diesel · "d" diesel, injection type not stated · "pet" petrol · "ev" electric
     Decided from the Fuel / Common Rail / Fuel System fields and the engine name. When the data does not say
     whether a diesel is common-rail, it is "d" and the app offers both diesel no-start guides. */
  const CR_WORDS = /common.?rail|crdi|crde|d-4d|\bddi\b|\bdci\b|tdci|di-d|skyactiv-d|mhawk|multijet|ddis|cdti|dicor|kryotec|revotorq|igen6/i;
  const MECH_WORDS = /mechanical|in-?line pump|distributor|rotary pump|\bVE pump|\bIDI\b|indirect injection|\bMDI\b/i;
  const fuelType = (e) => {
    const g = {}; ((e.sections.general_specs || {}).rows || []).forEach(([k, n]) => { if (n.v !== undefined) g[k] = n.v; });
    /* some engines have no Fuel field and say "2.4L Diesel" under Displacement, so every spec value is read */
    const fuel = String(g.Fuel || g["Fuel Type"] || "").toLowerCase(), text = Object.values(g).concat([e.name || ""]).join(" ");
    if (/electric/.test(fuel) && !/petrol|diesel/.test(fuel)) return "ev";
    if (/petrol|gasoline|flex/.test(fuel) && !/diesel/.test(fuel)) return "pet";
    const diesel = /diesel/.test(fuel) || /diesel|crdi|d-4d|\bddi\b|\btdi\b|\bdci\b/i.test(text);
    if (!diesel) return "pet";
    const field = String(g["Common Rail"] || "").toLowerCase();
    if (field.startsWith("yes")) return "cr";
    if (field.startsWith("no")) return "mech";
    const cr = CR_WORDS.test(text), mech = MECH_WORDS.test(text);
    return cr && !mech ? "cr" : mech && !cr ? "mech" : "d";
  };
  fs.rmSync(ENG_OUT, { recursive: true, force: true }); fs.mkdirSync(ENG_OUT, { recursive: true });
  const engineIndex = {}; let engBytes = 0, nEng = 0;
  for (const f of fs.readdirSync(path.join(SRC, "engines")).sort()) {
    const file = f.replace(".json", ""), pack = {};
    for (const e of readJSON(path.join(SRC, "engines", f))) {
      const rec = { name: e.name, vehicles: e.vehicles, status: e.status, sections: withLabels(e.sections) };
      if (e.linkedDtc) rec.linkedDtc = e.linkedDtc;
      pack[e.key] = rec; nEng++;
      engineIndex[e.key] = { n: e.name, f: file, v: e.vehicles, s: e.status, sec: Object.keys(e.sections), ft: fuelType(e) };
    }
    const js = asScript("(window.ENGINES = window.ENGINES || {})[" + JSON.stringify(file) + "] = ", pack);
    fs.writeFileSync(path.join(ENG_OUT, file + ".js"), js); engBytes += js.length;
  }
  const brands = readJSON(path.join(SRC, "vehicles.json"), []);
  let nModels = 0, nEntries = 0;
  brands.forEach((b) => b.models.forEach((m) => { nModels++; m.entries.forEach((e) => { nEntries++; if (!engineIndex[e.engine]) throw new Error("catalogue points at unknown engine " + e.engine); }); }));
  const catJs = asScript("var CATALOG = ", { brands, engines: engineIndex });
  fs.writeFileSync(path.join(__dirname, "..", "app", "data", "catalog.js"), catJs);
  console.log("catalogue : " + brands.length + " brands · " + nModels + " models · " + nEntries + " year/engine entries → app/data/catalog.js " + (catJs.length / 1024).toFixed(0) + " KB");
  console.log("engines   : " + nEng + " → app/data/engines/*.js " + (engBytes / 1024).toFixed(0) + " KB in total · labels translated " + labelHits + ", left as written " + labelMiss.size + " different labels");
}


/* =====================================================================
   DIAGNOSIS FLOWS     data-src/flows.json → app/data/flows.js
   (loaded when the mechanic opens "I see a problem")
   ===================================================================== */
{
  const flows = readJSON(path.join(SRC, "flows.json"), []);
  let n = 0, si = 0, ta = 0; const todo = new Set();
  (function walk(o) {
    if (!o || typeof o !== "object") return;
    if (typeof o.en === "string") {
      n++;
      if (!o.si && TM.si[o.en]) o.si = TM.si[o.en];
      if (o.si) si++; else todo.add(o.en);
      if (o.ta) ta++;
      return;
    }
    Object.values(o).forEach(walk);
  })(flows);
  const js = "/* GENERATED by tools/build-data.js from data-src/flows.json — do not edit by hand */\nvar FLOWS = JSON.parse(" + JSON.stringify(JSON.stringify(flows)) + ");\n";
  fs.writeFileSync(path.join(__dirname, "..", "app", "data", "flows.js"), js);
  fs.writeFileSync(path.join(SRC, "i18n", "todo", "flows-missing-si.txt"), [...todo].join("\n") + "\n");
  const steps = flows.reduce((k, f) => k + f.steps.length, 0);
  console.log("flows     : " + flows.length + " flows · " + steps + " steps → app/data/flows.js " + (js.length / 1024).toFixed(0) + " KB · texts " + n + " · Tamil " + pct(ta, n) + " · Sinhala " + pct(si, n));
}
