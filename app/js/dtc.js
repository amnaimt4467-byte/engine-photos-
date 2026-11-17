/* =====================================================================
   DTC LIBRARY — the layered code lookup.

   Layers, in the order a code is resolved for the mechanic's vehicle:
     1. pack     the vehicle's own data pack           (KB_DATA.dtcs today)
     2. engine   brand groups listed for this engine   (DTC_LIB.engineGroups)
     3. brand    other records of the same brand
     4. generic  SAE generic library
     5. other    what other brands mean by the same code
     + decode()  reads the code's structure, so even an unknown code gets an answer

   data/dtc-lib.js (about 1 MB) is loaded only when first needed:
     DTC.load(callback)   → injects the script once, builds the index
     DTC.ready()          → true when lookups can run
   ===================================================================== */
var DTC = (function () {
  var lib = null, index = null, flat = null, loading = false, waiters = [];

  /* ---------- loading ---------- */
  function ready() { return !!index; }
  function load(cb) {
    if (index) { if (cb) cb(); return; }
    if (cb) waiters.push(cb);
    if (loading) return;
    loading = true;
    var done = function () { loading = false; if (window.DTC_LIB) build(window.DTC_LIB); var w = waiters; waiters = []; w.forEach(function (f) { f(); }); };
    if (window.DTC_LIB) return done();
    var s = document.createElement("script");
    s.src = "data/dtc-lib.js"; s.onload = done; s.onerror = done;
    document.head.appendChild(s);
  }

  /* key used for matching: "p0087" → "P0087", "abs-21" / "ABS 21" → "ABS21" */
  function keyOf(code) { return String(code || "").toUpperCase().replace(/[\s\-_.]+/g, ""); }

  function build(data) {
    lib = data; index = {}; flat = [];
    function add(code, entry) { entry.code = code; (index[keyOf(code)] = index[keyOf(code)] || []).push(entry); flat.push(entry); }
    Object.keys(lib.generic).forEach(function (c) { add(c, { layer: "generic", rec: lib.generic[c] }); });
    Object.keys(lib.brands).forEach(function (b) {
      var br = lib.brands[b];
      Object.keys(br.groups).forEach(function (g) {
        var grp = br.groups[g];
        Object.keys(grp.codes).forEach(function (c) { add(c, { layer: "brand", brand: b, brandName: br.name, group: g, groupTitle: grp.title, groupSteps: grp.st, groupSrc: grp.src, sys: grp.y, rec: grp.codes[c] }); });
      });
      Object.keys(br.loose).forEach(function (c) { add(c, { layer: "brand", brand: b, brandName: br.name, group: null, rec: br.loose[c] }); });
    });
  }

  /* ---------- code structure ---------- */
  var VALID = /^[PBCU][0-3][0-9A-F]{3}$/;
  function isCode(q) { return VALID.test(keyOf(q)); }
  /* decode("P0087") → { valid, family, scope, area } as i18n keys (see i18n.js: dc_*) */
  function decode(code) {
    var c = keyOf(code); if (!VALID.test(c)) return { valid: false };
    var fam = c[0], d2 = c[1], d3 = c[2];
    var generic = d2 === "0" || (fam === "P" && d2 === "2") || (fam === "P" && d2 === "3" && "456789ABCDEF".indexOf(d3) >= 0) || (fam === "U" && d2 === "3");
    var area = null;
    if (fam === "P" && generic && (d2 === "0" || d2 === "2")) {
      area = "012".indexOf(d3) >= 0 ? "dc_a_fuel" : d3 === "3" ? "dc_a_ign" : d3 === "4" ? "dc_a_emis" : d3 === "5" ? "dc_a_speed" : d3 === "6" ? "dc_a_ecu" : "789".indexOf(d3) >= 0 ? "dc_a_trans" : "dc_a_hybrid";
    }
    return { valid: true, code: c, family: "dc_f_" + fam, scope: generic ? "dc_generic" : "dc_maker", generic: generic, area: area };
  }

  /* ---------- resolve ---------- */
  function packHit(code, vehicle) {
    if (!vehicle || !KB.DataStore.hasPack(vehicle)) return null;
    return KB.DataStore.dtc(code);
  }
  /* resolve(code, vehicle) → { code, decode, hits: [ {layer, primary, …} ] } ordered best-first */
  function resolve(code, vehicle) {
    var k = keyOf(code), out = { code: k, decode: decode(k), hits: [] };
    var pack = packHit(k, vehicle);
    if (pack) out.hits.push({ layer: "pack", code: pack.code, pack: pack });
    var entries = (index && index[k]) || [];
    var engGroups = (vehicle && lib && lib.engineGroups[vehicle.engineKey]) || [];
    var rank = function (e) {
      if (e.layer === "brand" && vehicle && e.brand === vehicle.brand) return engGroups.indexOf(e.group) >= 0 ? 1 : (e.rec.sus ? 3.5 : 2);
      if (e.layer === "generic") return 3;
      return 4;
    };
    entries.slice().sort(function (a, b) { return rank(a) - rank(b); }).forEach(function (e) {
      var r = rank(e);
      out.hits.push({ layer: r === 1 ? "engine" : r === 2 || r === 3.5 ? "brand" : r === 3 ? "generic" : "other", entry: e, code: e.code });
    });
    if (out.hits.length) out.hits[0].primary = true;
    return out;
  }

  /* ---------- search helpers ---------- */
  function suggest(prefix, vehicle, max) {
    var p = keyOf(prefix); if (!index || p.length < 2) return [];
    var seen = {}, out = [];
    if (vehicle && KB.DataStore.hasPack(vehicle)) KB.DataStore.dtcs().forEach(function (d) { if (d.code.indexOf(p) === 0) { seen[d.code] = 1; out.push({ code: d.code, title: d.title }); } });
    Object.keys(index).sort().some(function (k) {
      if (k.indexOf(p) !== 0 || seen[k]) return false;
      var best = resolve(k, vehicle).hits[0];
      out.push({ code: best.code, title: best.pack ? best.pack.title : best.entry.rec.t });
      return out.length >= (max || 8);
    });
    return out.slice(0, max || 8);
  }
  function textOf(t) { return t ? [t.en, t.ta, t.si].join(" ") : ""; }
  /* keyword search over titles in all three languages; the vehicle's brand first */
  function search(q, vehicle, max) {
    var words = String(q || "").toLowerCase().split(/\s+/).filter(Boolean); if (!index || !words.length) return [];
    var hits = flat.filter(function (e) { var hay = (e.code + " " + textOf(e.rec.t)).toLowerCase(); return words.every(function (w) { return hay.indexOf(w) >= 0; }); });
    var score = function (e) { return e.layer === "generic" ? 1 : vehicle && e.brand === vehicle.brand ? 0 : 2; };
    return hits.sort(function (a, b) { return score(a) - score(b) || a.code.localeCompare(b.code); }).slice(0, max || 60);
  }
  /* blink / flash code lookup, e.g. "49" */
  function byFlash(n, vehicle) {
    if (!index) return [];
    var f = String(n).replace(/^0+/, "");
    var hits = flat.filter(function (e) { return e.rec.fl && String(e.rec.fl).replace(/^0+/, "") === f; });
    var score = function (e) { return vehicle && e.brand === vehicle.brand ? 0 : 1; };
    return hits.sort(function (a, b) { return score(a) - score(b) || a.code.localeCompare(b.code); });
  }
  /* browse: every code of one system for this vehicle's brand, plus the generic ones */
  function browse(sys, vehicle) {
    if (!index) return [];
    var best = {};                         // one row per code: the vehicle's brand wins over the generic entry
    flat.forEach(function (e) {
      if ((e.sys || e.rec.y) !== sys) return;
      var mine = e.layer === "brand" && vehicle && e.brand === vehicle.brand && !e.rec.sus;
      if (e.layer !== "generic" && !mine) return;
      var k = keyOf(e.code), cur = best[k];
      if (!cur || (mine && cur.layer === "generic") || (mine && e.group && !cur.group)) best[k] = e;
    });
    return Object.keys(best).sort().map(function (k) { return best[k]; });
  }
  function groupsFor(vehicle) {
    if (!lib || !vehicle) return [];
    var br = lib.brands[vehicle.brand]; if (!br) return [];
    return (lib.engineGroups[vehicle.engineKey] || []).filter(function (g) { return br.groups[g]; }).map(function (g) {
      return { id: g, brand: vehicle.brand, title: br.groups[g].title, sys: br.groups[g].y, count: Object.keys(br.groups[g].codes).length };
    });
  }
  function group(brand, id) {
    var br = lib && lib.brands[brand], g = br && br.groups[id]; if (!g) return null;
    return { id: id, brandName: br.name, title: g.title, sys: g.y, src: g.src, steps: g.st, entries: flat.filter(function (e) { return e.brand === brand && e.group === id; }) };
  }
  function stats() {
    if (!lib) return null;
    var brand = 0; Object.keys(lib.brands).forEach(function (b) { var br = lib.brands[b]; brand += Object.keys(br.loose).length; Object.keys(br.groups).forEach(function (g) { brand += Object.keys(br.groups[g].codes).length; }); });
    return { version: lib.version, generic: Object.keys(lib.generic).length, brand: brand, brands: Object.keys(lib.brands).length };
  }

  return { load: load, ready: ready, keyOf: keyOf, isCode: isCode, decode: decode, resolve: resolve, suggest: suggest, search: search, byFlash: byFlash, browse: browse, groupsFor: groupsFor, group: group, stats: stats };
})();
