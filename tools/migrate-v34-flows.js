#!/usr/bin/env node
/* One-time migration of the step-by-step DIAGNOSIS FLOWS from the old single-file
   app (EngineSpecs v34 HTML) into data-src/flows.json.

   Usage:  node tools/migrate-v34-flows.js /path/to/EngineSpecs_researched_v34.html

   v34 sources read
     SYS_MV_EXTRA   13 decision trees: step → "what did you find?" → next step / fix / done
     SYS_VEH_SYM    titles and which engines each flow applies to
     SYS_VEH_SYMG   group titles

   A flow in data-src/flows.json
     { id, group, title, applies, vehicle, start, steps: [...], confirm: [...], source }
     step   { n, title, tool, acts: [text], note?, res: [ { label, step | fix | done } ] }
     text   { en, ta, si?, u? }      u = the old app marked this line "Unverified"
     applies { fuel: "cr" | "mech" | "pet" | "ev" | "dsl" | "ice", engines?: [...], skip?: [...] }

   The script fails if a result points at a step that does not exist or a flow cannot end. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = process.argv[2];
if (!SRC || !fs.existsSync(SRC)) { console.error("Usage: node tools/migrate-v34-flows.js <v34.html>"); process.exit(1); }
const OUT = path.join(__dirname, "..", "data-src", "flows.json");
const html = fs.readFileSync(SRC, "utf8");
const lines = html.split("\n");

const MV = JSON.parse(html.match(/var SYS_MV_EXTRA = (.*?);\n/)[1]);
const GROUPS = JSON.parse(html.match(/var SYS_VEH_SYMG = (.*?);\n/)[1]);
/* the flow index is the second assignment: SYS_VEH_SYM = [...].concat(SYS_VEH_SYM).concat([...]) */
const idxLine = lines.find((l) => l.startsWith("SYS_VEH_SYM = ["));
const ctx = { SYS_VEH_SYM: [] };
vm.runInNewContext(idxLine, ctx);
const INDEX = ctx.SYS_VEH_SYM.filter((x) => MV[x.key]);

/* ---------- text ---------- */
let unverified = 0;
function T(o) {
  if (!o) return null;
  const out = {};
  ["en", "ta", "si"].forEach((l) => {
    if (typeof o[l] !== "string") return;
    let s = o[l];
    if (/⚠\s*Unverified/i.test(s)) { out.u = 1; s = s.replace(/\s*⚠\s*Unverified\s*[—–-]?\s*/gi, " ").trim(); }
    if (s) out[l] = s;
  });
  if (out.u) unverified++;
  if (out.si && out.si === out.en) delete out.si;      // the old app copied English into the Sinhala slot
  return out.en || out.ta ? out : null;
}

/* ---------- flows ---------- */
const flows = [];
for (const [id, f] of Object.entries(MV)) {
  const idx = INDEX.filter((x) => x.key === id);
  if (!idx.length) throw new Error("flow " + id + " has no title in SYS_VEH_SYM");
  const applies = idx[0].f ? { fuel: idx[0].f } : { engines: idx.map((x) => x.e) };
  if (idx[0].skipE) applies.skip = idx[0].skipE;
  const numbers = f.steps.map((s) => s.n);
  const steps = f.steps.map((s) => {
    const st = { n: s.n, title: T(s.title), tool: s.tool, acts: (s.acts || []).map(T).filter(Boolean) };
    if (s.note) st.note = T(s.note);
    st.res = (s.res || []).map((r) => {
      const o = { label: T(r.lab) };
      if (r.go.step != null) { if (numbers.indexOf(r.go.step) < 0) throw new Error(id + " step " + s.n + " points at missing step " + r.go.step); o.step = r.go.step; }
      else if (r.go.fix) o.fix = T(r.go.fix);
      else if (r.go.done) o.done = T(r.go.done);
      else throw new Error(id + " step " + s.n + " has a result that goes nowhere");
      return o;
    });
    if (!st.res.length) throw new Error(id + " step " + s.n + " has no results");
    return st;
  });
  /* every path must end: walk the tree and make sure no step can be reached twice on one path */
  const byN = Object.fromEntries(steps.map((s) => [s.n, s]));
  (function walk(n, seen) {
    if (seen.indexOf(n) >= 0) throw new Error(id + " loops at step " + n);
    byN[n].res.forEach((r) => { if (r.step != null) walk(r.step, seen.concat([n])); });
  })(f.start || numbers[0], []);
  const g = GROUPS[idx[0].grp];
  flows.push({
    id, group: idx[0].grp, groupTitle: g ? { en: g[0], ta: g[1], si: g[2] } : null,
    title: T(idx[0].title), applies, vehicle: f.veh, start: f.start || numbers[0], steps,
    confirm: (f.confirm || []).map(T).filter(Boolean),
    source: String(f.src || "").replace(/\s*⚠\s*Unverified\s*[—–-]?\s*/gi, " ").trim()
  });
}

const nSteps = flows.reduce((n, f) => n + f.steps.length, 0);
if (flows.length !== Object.keys(MV).length) throw new Error("flow count mismatch");
fs.writeFileSync(OUT, "[\n" + flows.map((f) => {
  const head = Object.assign({}, f); delete head.steps; delete head.confirm;
  return "  {\n" + Object.entries(head).map(([k, v]) => "    " + JSON.stringify(k) + ": " + JSON.stringify(v)).join(",\n") +
    ",\n    \"steps\": [\n" + f.steps.map((s) => "      " + JSON.stringify(s)).join(",\n") + "\n    ],\n    \"confirm\": " + JSON.stringify(f.confirm) + "\n  }";
}).join(",\n") + "\n]\n");

const noSi = new Set(); (function walk(o) { if (o && typeof o === "object") { if (typeof o.en === "string") { if (!o.si) noSi.add(o.en); return; } Object.values(o).forEach(walk); } })(flows);
console.log("flows   : " + flows.length + " (" + flows.map((f) => f.id + " " + f.steps.length).join(", ") + ")");
console.log("steps   : " + nSteps + " · every result leads to a step, a fix or a done screen · no loops");
console.log("cleaned : " + unverified + " 'Unverified' marks → flags");
console.log("Sinhala : " + noSi.size + " different texts still need a translation");
console.log("written " + path.relative(process.cwd(), OUT));
