#!/usr/bin/env node
/* Checks data-src/ before it is built into the app.
   Usage:  node tools/validate.js        (exit code 1 when something is wrong)

   Errors (stop the build):  missing code / English title, unknown status,
     text that is not {en?,ta?,si?}, duplicate codes, engine map pointing at
     a group that does not exist, translation-memory entries that are empty.
   Report:  how many records each layer has and how they are marked. */
const fs = require("fs");
const path = require("path");
const SRC = path.join(__dirname, "..", "data-src");
const STATUSES = ["published", "general", "sourced", "pending"];
const SYSTEMS = ["engine", "electrical", "body", "abs", "srs", "ac", "ecu", "immobilizer", "key", "remote", "cluster", "special", "fuel", "transmission", "wiring", "sensors", "repair"];
const errors = [];
const err = (where, msg) => errors.push(where + ": " + msg);
const readJSON = (f) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { err(path.relative(SRC, f), "not valid JSON (" + e.message + ")"); return null; } };

function checkText(t, where) {
  if (!t || typeof t !== "object" || Array.isArray(t)) return err(where, "text must be an object like {en, ta, si}");
  const keys = Object.keys(t);
  if (!keys.length) err(where, "text has no language");
  keys.forEach((k) => { if (!["en", "ta", "si"].includes(k)) err(where, "unknown language key '" + k + "'"); else if (typeof t[k] !== "string" || !t[k].trim()) err(where, k + " text is empty"); });
}
function checkRecord(r, where) {
  if (!r.code || typeof r.code !== "string") return err(where, "record without a code");
  const w = where + " " + r.code;
  if (!r.title || typeof r.title.en !== "string" || !r.title.en.trim()) err(w, "missing English title"); else checkText(r.title, w + " title");
  if (!STATUSES.includes(r.status)) err(w, "unknown status '" + r.status + "'");
  if (r.sys && !SYSTEMS.includes(r.sys)) err(w, "unknown system '" + r.sys + "'");
  ["symptoms", "causes", "steps"].forEach((f) => { if (r[f] !== undefined) { if (!Array.isArray(r[f])) err(w, f + " must be a list"); else r[f].forEach((t, i) => checkText(t, w + " " + f + "[" + i + "]")); } });
  if (r.repair) checkText(r.repair, w + " repair");
  if (r.related && !Array.isArray(r.related)) err(w, "related must be a list");
}
const count = { generic: 0, groups: 0, groupCodes: 0, loose: 0, status: {} };
const tally = (r) => { count.status[r.status] = (count.status[r.status] || 0) + 1; };

/* layer A */
const seenGeneric = {};
for (const f of fs.readdirSync(path.join(SRC, "generic")).sort()) {
  const list = readJSON(path.join(SRC, "generic", f)); if (!list) continue;
  list.forEach((r) => {
    checkRecord(r, "generic/" + f);
    if (seenGeneric[r.code]) err("generic/" + f, "duplicate code " + r.code + " (also in " + seenGeneric[r.code] + ")");
    seenGeneric[r.code] = f;
    if (r.code && r.code.slice(0, 2) !== f.replace(".json", "")) err("generic/" + f, r.code + " is in the wrong file");
    count.generic++; tally(r);
  });
}
/* layer B */
const groupIds = {};
for (const f of fs.readdirSync(path.join(SRC, "brand")).sort()) {
  const b = readJSON(path.join(SRC, "brand", f)); if (!b) continue;
  const where = "brand/" + f;
  if (b.brand + ".json" !== f) err(where, "brand id '" + b.brand + "' does not match the file name");
  if (!b.name) err(where, "missing brand name");
  (b.groups || []).forEach((g) => {
    if (groupIds[g.id]) err(where, "group id " + g.id + " is used twice"); groupIds[g.id] = f;
    if (!g.title) err(where + " " + g.id, "group has no title");
    if (!SYSTEMS.includes(g.sys)) err(where + " " + g.id, "unknown system '" + g.sys + "'");
    (g.steps || []).forEach((t, i) => checkText(t, where + " " + g.id + " steps[" + i + "]"));
    const seen = {};
    g.codes.forEach((r) => { checkRecord(r, where + " " + g.id); if (seen[r.code]) err(where + " " + g.id, "duplicate code " + r.code); seen[r.code] = 1; count.groupCodes++; tally(r); });
    count.groups++;
  });
  const seenLoose = {};
  (b.loose || []).forEach((r) => { checkRecord(r, where + " loose"); if (seenLoose[r.code]) err(where + " loose", "duplicate code " + r.code); seenLoose[r.code] = 1; count.loose++; tally(r); });
}
/* engine → groups */
const eng = readJSON(path.join(SRC, "engine-groups.json")) || {};
Object.entries(eng).forEach(([e, gs]) => gs.forEach((g) => { if (!groupIds[g]) err("engine-groups.json", e + " points at unknown group '" + g + "'"); }));
/* translation memory */
["ta.json", "si.json", "en-from-ta.json"].forEach((f) => {
  const p = path.join(SRC, "i18n", f); if (!fs.existsSync(p)) return;
  const tm = readJSON(p); if (!tm) return;
  Object.entries(tm).forEach(([k, v]) => { if (typeof v !== "string" || !v.trim()) err("i18n/" + f, "empty translation for: " + k.slice(0, 50)); });
  count["tm_" + f] = Object.keys(tm).length;
});

/* engines + vehicle catalogue */
const engineKeys = {}; count.engines = 0; count.engStatus = {};
function checkNode(n, where, depth) {
  if (!n || typeof n !== "object") return err(where, "empty section value");
  if (n.v !== undefined) { if (typeof n.v !== "string" || !n.v.trim()) err(where, "empty text"); return; }
  if (n.list) { if (!n.list.length) err(where, "empty list"); return n.list.forEach((x, i) => checkNode(x, where + "[" + i + "]", depth + 1)); }
  if (n.rows) { if (!n.rows.length) err(where, "empty rows"); return n.rows.forEach((r) => { if (typeof r[0] !== "string" || !r[0]) err(where, "row without a label"); checkNode(r[1], where + " > " + r[0], depth + 1); }); }
  err(where, "unknown value shape");
}
if (fs.existsSync(path.join(SRC, "engines"))) {
  for (const f of fs.readdirSync(path.join(SRC, "engines")).sort()) {
    const list = readJSON(path.join(SRC, "engines", f)); if (!list) continue;
    list.forEach((e) => {
      const w = "engines/" + f + " " + e.key;
      if (!e.key) return err("engines/" + f, "engine without a key");
      if (engineKeys[e.key]) err(w, "duplicate engine key (also in " + engineKeys[e.key] + ")"); engineKeys[e.key] = f;
      if (!e.name) err(w, "missing name");
      if (!["sourced", "pending", "published"].includes(e.status)) err(w, "unknown status '" + e.status + "'");
      if (!e.sections || !e.sections.general_specs) err(w, "missing general_specs");
      Object.entries(e.sections || {}).forEach(([id, n]) => checkNode(n, w + " " + id, 0));
      count.engines++; count.engStatus[e.status] = (count.engStatus[e.status] || 0) + 1;
    });
  }
  const brands = readJSON(path.join(SRC, "vehicles.json")) || [];
  count.brands = brands.length; count.models = 0; count.entries = 0;
  const brandIds = {};
  brands.forEach((b) => {
    if (brandIds[b.id]) err("vehicles.json", "brand " + b.id + " listed twice"); brandIds[b.id] = 1;
    if (!b.name) err("vehicles.json " + b.id, "missing brand name");
    const modelIds = {};
    b.models.forEach((m) => {
      count.models++;
      if (modelIds[m.id]) err("vehicles.json " + b.id, "model " + m.id + " listed twice"); modelIds[m.id] = 1;
      const ids = {};
      m.entries.forEach((e) => {
        count.entries++;
        const w = "vehicles.json " + b.id + "/" + m.id + "/" + e.id;
        if (!e.id || /[~/#\s]/.test(e.id)) err(w, "entry id must be simple (no spaces, ~ / #)");
        if (ids[e.id]) err(w, "entry id used twice"); ids[e.id] = 1;
        if (!engineKeys[e.engine]) err(w, "points at unknown engine '" + e.engine + "'");
      });
    });
  });
  Object.keys(eng).forEach((e) => { if (!engineKeys[e]) err("engine-groups.json", "lists fault-code groups for unknown engine '" + e + "'"); });
}

console.log("generic library : " + count.generic + " codes");
console.log("brand layer     : " + count.groupCodes + " codes in " + count.groups + " groups + " + count.loose + " other brand-specific codes");
console.log("engine map      : " + Object.keys(eng).length + " engines");
console.log("engines         : " + (count.engines || 0) + " (" + Object.entries(count.engStatus || {}).map(([k, v]) => k + " " + v).join(" · ") + ")");
console.log("vehicles        : " + (count.brands || 0) + " brands · " + (count.models || 0) + " models · " + (count.entries || 0) + " year/engine entries");
console.log("DTC marked as   : " + STATUSES.map((s) => s + " " + (count.status[s] || 0)).join(" · "));
console.log("translations    : " + ["ta.json", "si.json", "en-from-ta.json"].map((f) => f + " " + (count["tm_" + f] || 0)).join(" · "));
if (errors.length) { console.error("\n" + errors.length + " problem(s):\n  " + errors.slice(0, 40).join("\n  ") + (errors.length > 40 ? "\n  …" : "")); process.exit(1); }
console.log("\nOK — no problems found");
