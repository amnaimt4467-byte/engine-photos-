#!/usr/bin/env node
/* One-time migration: pulls every DTC record out of the old single-file app
   (EngineSpecs v34 HTML) and writes clean, layered JSON into data-src/.

   Usage:  node tools/migrate-v34.js /path/to/EngineSpecs_researched_v34.html

   v34 sources read
     dtcDB            1 flat table, one meaning per code (generic + brand codes mixed)
     DTC_MEAN_TA/SI   a few extra Tamil / Sinhala titles
     DTC_TX           Tamil + Sinhala text for 15 fully translated codes
     SYS_WEB_DTC      brand groups (codes per brand/system) + engine → groups map

   Output
     data-src/generic/<prefix>.json   layer A: SAE generic ranges
     data-src/brand/<brand>.json      layer B: brand groups + brand-specific codes from dtcDB
     data-src/engine-groups.json      which groups apply to which engine
     data-src/review/conflicts.md     things a person should look at

   Nothing is dropped: the script fails if the record counts do not add up.
   The v34 file itself is NOT stored in the repository. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = process.argv[2];
if (!SRC || !fs.existsSync(SRC)) { console.error("Usage: node tools/migrate-v34.js <v34.html>"); process.exit(1); }
const OUT = path.join(__dirname, "..", "data-src");
const html = fs.readFileSync(SRC, "utf8");
const lines = html.split("\n");

/* ---------- read the v34 tables ---------- */
function grabConst(name) {             // "const NAME = {" … up to the first line that is "};"
  const start = lines.findIndex((l) => l.startsWith("const " + name + " = {"));
  if (start < 0) throw new Error("not found in v34: " + name);
  let end = start; while (!/^\};/.test(lines[end])) end++;
  return lines.slice(start, end + 1).join("\n");
}
const ctx = {};
vm.runInNewContext(["dtcDB", "DTC_MEAN_SI", "DTC_MEAN_TA", "DTC_TX"].map(grabConst).join("\n") +
  "\n;__out = { dtcDB, DTC_MEAN_SI, DTC_MEAN_TA, DTC_TX };", ctx);
const { dtcDB, DTC_MEAN_SI, DTC_MEAN_TA, DTC_TX } = ctx.__out;
const WEB = JSON.parse(html.match(/var SYS_WEB_DTC = (\{.*?\});\n/s)[1]);

/* ---------- helpers ---------- */
const HAS_TA = /[஀-௿]/;
/* a v34 string is either English or Tamil-mixed; keep it under the right language key */
const T = (s) => (HAS_TA.test(s) ? { ta: s } : { en: s });
/* DTC_TX pair = [other-language text, Sinhala]. If the original is Tamil, pair[0] is English, else Tamil. */
function withTx(orig, pair) {
  const t = T(orig);
  if (!pair) return t;
  if (pair[0]) { if (t.ta) t.en = pair[0]; else t.ta = pair[0]; }
  if (pair[1]) t.si = pair[1];
  return t;
}
const isGenericRange = (c) => /^(P0|P2|P3[4-9A-F]|U0|B0|C0)[0-9A-F]{3}$|^(P3[4-9A-F])[0-9A-F]{2}$/.test(c);
function sysOf(code) {                  // app category from the code's structure
  const k = code[0], d = code[2];
  if (k === "U") return "ecu";
  if (k === "B") return "body";
  if (k === "C") return "abs";
  if ("789".includes(d)) return "transmission";
  if (d === "6") return "ecu";
  if (d === "A") return "electrical";
  return "engine";
}
const BRANDS = [
  ["toyota", /toyota|lexus|daihatsu/i, "Toyota / Lexus / Daihatsu"], ["isuzu", /isuzu/i, "Isuzu"], ["nissan", /nissan/i, "Nissan"],
  ["hyundai_kia", /hyundai|kia/i, "Hyundai / Kia"], ["mitsubishi", /mitsubishi/i, "Mitsubishi"], ["suzuki", /suzuki|maruti/i, "Suzuki / Maruti"],
  ["honda", /honda/i, "Honda"], ["mazda", /mazda/i, "Mazda"], ["hino", /hino/i, "Hino"], ["mahindra", /mahindra/i, "Mahindra"],
  ["tata", /tata/i, "Tata"], ["ashok_leyland", /ashok|leyland/i, "Ashok Leyland"]
];
const BRAND_NAME = Object.fromEntries(BRANDS.map((b) => [b[0], b[2]])); BRAND_NAME.unknown = "Unknown brand";
const brandFromText = (s) => { const b = BRANDS.find((x) => x[1].test(s || "")); return b ? b[0] : "unknown"; };
const GROUP_PREFIX = { toyota: "toyota", toy: "toyota", isuzu: "isuzu", isz: "isuzu", nissan: "nissan", nis: "nissan", hk: "hyundai_kia", mitsu: "mitsubishi", mit: "mitsubishi",
  suzuki: "suzuki", suz: "suzuki", mah: "mahindra", tata: "tata", al: "ashok_leyland", honda: "honda", mazda: "mazda", hino: "hino" };
const SYS_MAP = { airbag: "srs", eps: "electrical" };   // v34 group systems → the app's 17 categories
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/* ---------- layer A + brand-specific codes, from dtcDB ---------- */
const EXTRA_FIELDS = ["circuit_description", "running_condition", "sets_when", "ecm_action", "diagnostic_aid", "clearing_condition", "location", "wiring", "voltage", "liveData", "spareParts"];
const generic = [], loose = {};          // loose[brand] = brand-specific codes that sat in dtcDB
for (const code of Object.keys(dtcDB)) {
  const d = dtcDB[code], tx = DTC_TX[code] || {};
  const title = { en: d.meaning };
  if (d.meaning_ta && d.meaning_ta !== d.meaning && HAS_TA.test(d.meaning_ta)) title.ta = d.meaning_ta;
  if (DTC_MEAN_TA[code]) title.ta = DTC_MEAN_TA[code];
  if (DTC_MEAN_SI[code]) title.si = DTC_MEAN_SI[code];
  const unverified = d.verified !== true || /Unverified/i.test(d.engine_specific || "");
  const rec = {
    code, title, sys: sysOf(code),
    status: unverified ? "pending" : d.source_ref ? "published" : "general",
    symptoms: d.symptoms.map((s, i) => withTx(s, (tx.symptoms || [])[i])),
    causes: d.causes.map((s, i) => withTx(s, (tx.causes || [])[i])),
    steps: d.diagnostic_steps.map((s, i) => withTx(s, (tx.diagnostic_steps || [])[i])),
    repair: d.repair_steps ? withTx(d.repair_steps, (tx.repair_steps || [])[0]) : null
  };
  if (d.flash_code != null) rec.flash = String(d.flash_code);
  if (d.dtc_type) rec.mil = d.dtc_type;
  if (d.linked_dtc && d.linked_dtc.length) rec.related = d.linked_dtc;
  if (d.source_ref) rec.source = d.source_ref;
  if (d.engine_specific) rec.note = d.engine_specific;
  /* vehicle-specific material (pins, voltages, manual text). Kept here so nothing is lost,
     but NOT shipped in the generic library: it belongs to a vehicle pack. */
  const extra = {}; EXTRA_FIELDS.forEach((f) => { if (d[f] != null && d[f] !== "") extra[f] = d[f]; });
  const txExtra = {}; Object.keys(tx).forEach((k) => { if (!["symptoms", "causes", "diagnostic_steps", "repair_steps"].includes(k)) txExtra[k] = tx[k]; });
  if (Object.keys(txExtra).length) extra._tx = txExtra;
  if (Object.keys(extra).length) rec.extra = extra;

  if (isGenericRange(code)) generic.push(rec);
  else { const b = brandFromText(d.engine_specific); (loose[b] = loose[b] || []).push(rec); }
}

/* ---------- layer B, from SYS_WEB_DTC ---------- */
const brands = {};                        // brands[id] = { brand, name, groups: [], loose: [] }
const brandOf = (id) => (brands[id] = brands[id] || { brand: id, name: BRAND_NAME[id] || id, groups: [], loose: [] });
let groupRecords = 0;
for (const [gid, g] of Object.entries(WEB.groups)) {
  const b = GROUP_PREFIX[gid.split("_")[0]];
  if (!b) throw new Error("no brand for group " + gid);
  const codes = Object.entries(g.codes).map(([code, c]) => {
    groupRecords++;
    const r = { code, title: { en: c.m }, status: "sourced" };
    if (c.fl) r.flash = String(c.fl);
    if (c.c && c.c.length) r.causes = c.c.map(T);
    Object.keys(c).forEach((k) => { if (!["m", "fl", "c"].includes(k)) throw new Error("unexpected field " + k + " in " + gid); });
    return r;
  });
  const grp = { id: gid, title: g.title, sys: SYS_MAP[g.sys] || g.sys, source: g.src || "", steps: (g.s || []).map(T), codes };
  if (g.c) grp.note = g.c;
  brandOf(b).groups.push(grp);
}
Object.entries(loose).forEach(([b, list]) => { brandOf(b).loose = list.sort((x, y) => x.code.localeCompare(y.code)); });

/* ---------- checks: nothing lost ---------- */
const looseCount = Object.values(loose).reduce((n, l) => n + l.length, 0);
const dbTotal = Object.keys(dtcDB).length, webTotal = Object.values(WEB.groups).reduce((n, g) => n + Object.keys(g.codes).length, 0);
if (generic.length + looseCount !== dbTotal) throw new Error("dtcDB count mismatch");
if (groupRecords !== webTotal) throw new Error("SYS_WEB_DTC count mismatch");

/* ---------- review report ---------- */
const review = [];
const unknown = (loose.unknown || []);
const sameBrandClash = [], otherBrandSame = [], genericVsBrand = [];
const genericTitle = Object.fromEntries(generic.map((r) => [r.code, r.title.en]));
for (const b of Object.values(brands)) {
  for (const rec of b.loose) {
    for (const ob of Object.values(brands)) for (const g of ob.groups) {
      const hit = g.codes.find((c) => c.code === rec.code); if (!hit) continue;
      const same = norm(hit.title.en) === norm(rec.title.en);
      if (ob.brand === b.brand && !same) {
        sameBrandClash.push([rec.code, b.name, rec.title.en, g.id, hit.title.en, rec.status]);
        /* the brand group cites a source; the old flat-table entry does not agree with it → treat as unconfirmed */
        rec.status = "pending"; rec.suspect = "Differs from the " + g.id + " group";
      }
      if (ob.brand !== b.brand && same) otherBrandSame.push([rec.code, b.name, rec.title.en, ob.name + " · " + g.id]);
    }
  }
  for (const g of b.groups) for (const c of g.codes) {
    if (genericTitle[c.code] && norm(genericTitle[c.code]) !== norm(c.title.en)) genericVsBrand.push([c.code, genericTitle[c.code], b.name + " · " + g.id, c.title.en]);
  }
}
const row = (cells) => "| " + cells.map((c) => String(c).replace(/\|/g, "/")).join(" | ") + " |";
review.push("# DTC migration review", "", "Generated by `tools/migrate-v34.js`. These are the records a person should check. Nothing here was dropped: every record is in `data-src/`.", "");
review.push("## 1. Same brand, two different meanings (" + sameBrandClash.length + ")", "", "The old flat table and the brand group disagree. The app shows both; the old-table one is the suspect.", "",
  row(["Code", "Brand", "Old table says", "Group", "Group says", "Old status"]), row(["---", "---", "---", "---", "---", "---"]), ...sameBrandClash.map(row), "");
review.push("## 2. Possibly filed under the wrong brand (" + otherBrandSame.length + ")", "", "The old table lists the code under one brand, but the same wording appears in another brand's group.", "",
  row(["Code", "Filed under", "Meaning", "Same wording in"]), row(["---", "---", "---", "---"]), ...otherBrandSame.map(row), "");
review.push("## 3. Brand-range codes with no brand named (" + unknown.length + ")", "", "P1 / B1 / B2 / C1 / C2 / U1 codes mean different things per manufacturer. These had no brand in the old data, so they are shown with a warning.", "",
  row(["Code", "Meaning", "Old status"]), row(["---", "---", "---"]), ...unknown.map((r) => row([r.code, r.title.en, r.status])), "");
review.push("## 4. Generic code where a brand uses different wording (" + genericVsBrand.length + ")", "", "Usually harmless (the brand's wording is more specific). Listed so real differences can be spotted.", "",
  row(["Code", "Generic library", "Brand group", "Brand wording"]), row(["---", "---", "---", "---"]), ...genericVsBrand.map(row), "");

/* ---------- write ---------- */
function writeRecords(file, obj) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, obj); }
/* arrays are written one record per line so git diffs stay readable */
const lineArray = (arr, indent) => "[\n" + arr.map((r) => indent + JSON.stringify(r)).join(",\n") + "\n" + indent.slice(2) + "]";
fs.rmSync(path.join(OUT, "generic"), { recursive: true, force: true });
fs.rmSync(path.join(OUT, "brand"), { recursive: true, force: true });
const byPrefix = {};
generic.sort((a, b) => a.code.localeCompare(b.code)).forEach((r) => { (byPrefix[r.code.slice(0, 2)] = byPrefix[r.code.slice(0, 2)] || []).push(r); });
Object.entries(byPrefix).forEach(([p, list]) => writeRecords(path.join(OUT, "generic", p + ".json"), lineArray(list, "  ") + "\n"));
Object.values(brands).forEach((b) => {
  const groups = b.groups.map((g) => "    {\n" + ["id", "title", "sys", "source", "note", "steps"].filter((k) => g[k] !== undefined).map((k) => "      " + JSON.stringify(k) + ": " + JSON.stringify(g[k])).join(",\n") +
    ",\n      \"codes\": " + lineArray(g.codes, "        ") + "\n    }").join(",\n");
  writeRecords(path.join(OUT, "brand", b.brand + ".json"),
    "{\n  \"brand\": " + JSON.stringify(b.brand) + ",\n  \"name\": " + JSON.stringify(b.name) + ",\n  \"groups\": [\n" + groups + "\n  ],\n  \"loose\": " + lineArray(b.loose, "    ") + "\n}\n");
});
writeRecords(path.join(OUT, "engine-groups.json"), "{\n" + Object.entries(WEB.eng).map(([e, g]) => "  " + JSON.stringify(e) + ": " + JSON.stringify(g)).join(",\n") + "\n}\n");
writeRecords(path.join(OUT, "review", "conflicts.md"), review.join("\n") + "\n");

/* ---------- summary ---------- */
console.log("v34 dtcDB records      : " + dbTotal);
console.log("  → generic library    : " + generic.length + "  (" + Object.entries(byPrefix).map(([p, l]) => p + " " + l.length).join(", ") + ")");
console.log("  → brand-specific     : " + looseCount + "  (" + Object.entries(loose).map(([b, l]) => b + " " + l.length).join(", ") + ")");
console.log("v34 brand group records: " + webTotal + " in " + Object.keys(WEB.groups).length + " groups → " + Object.keys(brands).length + " brand files");
console.log("engine → groups map    : " + Object.keys(WEB.eng).length + " engines");
const st = {}; generic.concat(...Object.values(loose)).forEach((r) => { st[r.status] = (st[r.status] || 0) + 1; });
console.log("status (old table)     : " + JSON.stringify(st) + " · groups: sourced " + webTotal);
console.log("review                 : " + sameBrandClash.length + " same-brand clashes, " + otherBrandSame.length + " possible wrong brand, " + unknown.length + " no brand, " + genericVsBrand.length + " generic/brand wording differences");
console.log("written to " + path.relative(process.cwd(), OUT));
