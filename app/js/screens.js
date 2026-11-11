/* =====================================================================
   SCREENS — first launch, home, vehicle picker, vehicle page, system page,
   and "coming soon" placeholders.  (DTC screens: screens-dtc.js)

   Vehicles come from the catalogue (data/catalog.js). The engine record for a
   vehicle (specs, torque, special functions …) is loaded on demand with
   DS.loadEngine(), so the app starts fast even with 259 engines.
   ===================================================================== */
(function () {
  var DS = KB.DataStore, L = KB.L, U = KB.U, esc = KB.esc, badge = KB.badge, val = KB.val;
  var t = APP.t, fold = APP.fold;

  /* ---------------- FIRST LAUNCH: pick a language ---------------- */
  APP.route("first", function () {
    /* shown in all three languages at once, because none is chosen yet */
    var h = '<div class="first"><div class="logo">🔧</div><h2>' + esc(I18N.app_name.en) + "</h2>" +
      '<p class="dim">' + ["en", "ta", "si"].map(function (l) { return esc(I18N.first_title[l]); }).join("<br>") + "</p>";
    KB.LANGS.forEach(function (l) {
      h += '<button class="big" data-act="set:lang:' + l.id + '"><span class="ic">' + l.flag + '</span><span class="tx"><b>' + esc(l.label) + '</b></span><span class="arr">›</span></button>';
    });
    return { html: h + "</div>", top: true };
  });

  /* ---------------- HOME ---------------- */
  function vehicleCard(v) {
    return '<div class="card vehicle"><span class="ic">' + (v.icon || "🚐") + '</span><div class="tx"><b>' + esc(DS.vehicleName(v)) + "</b><small>" + esc(DS.vehicleLine(v)) + "</small></div></div>";
  }
  function recentChips() {
    var r = Settings.get("recent"); if (!r.length) return "";
    return '<div class="chips"><span class="dim" style="align-self:center;font-size:.85rem">' + esc(t("recent")) + ":</span>" +
      r.map(function (c) { return '<a class="chip code" href="#/dtc/' + encodeURIComponent(c) + '">' + esc(c) + "</a>"; }).join("") + "</div>";
  }
  APP.route("home", function () {
    var v = DS.vehicle(Settings.get("vehicleId"));
    var h = '<h3 class="dim" style="margin-top:.8rem">' + esc(t("my_vehicle")) + "</h3>";
    if (v) {
      h += vehicleCard(v) + '<div class="row" style="margin-bottom:1rem"><a class="btn pri" href="#/vehicle/' + v.id + '">' + esc(t("open")) + '</a><a class="btn" href="#/pick">' + esc(t("change")) + "</a></div>";
    } else {
      h += APP.bigLink("🚐", t("choose_vehicle"), t("no_vehicle"), "#/pick");
    }
    h += APP.searchForm("") + recentChips();
    h += "<h2>" + esc(t("hello")) + '</h2><div class="grid2">' +
      APP.bigLink("🔢", t("a_code"), t("a_code_s"), "#/dtc") +
      APP.bigLink("🩺", t("a_sym"), t("a_sym_s"), "#/soon/4") +
      APP.bigLink("🛠️", t("a_sf"), t("a_sf_s"), "#/soon/4") +
      APP.bigLink("📖", t("a_learn"), t("a_learn_s"), "#/soon/4") + "</div>";
    return { title: t("app_name"), html: h, tab: "home", top: true };
  });

  APP.route("soon", function (n) {
    var h = '<div class="empty"><div style="font-size:3rem">🚧</div><h2>' + esc(t("soon_title")) + "</h2><p>" + esc(t("soon_body", { n: n || "" })) + '</p><a class="btn pri" href="#/home">' + esc(t("go_home")) + "</a></div>";
    return { title: t("soon_title"), html: h, tab: "home" };
  });

  /* ---------------- VEHICLE PICKER ----------------
     Make → Model → Years · Engine. A level with only one possible value is
     filled in automatically, so the mechanic taps as little as possible. */
  var sel = {};
  function distinct(vehicles, key) {
    var seen = [];
    vehicles.forEach(function (v) { var x = String(v[key]); if (seen.indexOf(x) < 0) seen.push(x); });
    return seen;
  }
  /* returns the next level to choose: "make", "model", or "entry" (= list the vehicles) */
  function nextLevel() {
    var levels = ["make", "model"];
    for (var i = 0; i < levels.length; i++) {
      var k = levels[i]; if (k in sel) continue;
      var opts = distinct(DS.vehiclesWhere(sel), k);
      if (opts.length === 1) { sel[k] = opts[0]; continue; }
      return k;
    }
    return "entry";
  }
  function statusTag(v) {
    return (DS.hasPack(v) ? '<span class="tag sample">◇ ' + esc(t("tag_sample")) + "</span>" : "") +
      (v.status === "sourced" ? '<span class="tag">📄 ' + esc(t("tag_sourced")) + "</span>" : '<span class="tag medium">⚠ ' + esc(t("tag_unverified")) + "</span>");
  }
  function vehicleRow(v) {
    return APP.bigLink(v.icon || "🚐", DS.vehicleName(v), DS.vehicleLine(v), "#/vehicle/" + v.id, "<div>" + statusTag(v) + "</div>");
  }
  function pickerBody() {
    var level = nextLevel(), pool = DS.vehiclesWhere(sel), h = "";
    var chosen = ["make", "model"].filter(function (k) { return k in sel; });
    if (chosen.length) {
      h += '<div class="path">' + chosen.map(function (k) { return '<span class="chip on">' + esc(sel[k]) + "</span>"; }).join('<span class="dim">›</span>') +
        '<button class="chip" data-act="pickReset">↺ ' + esc(t("pick_restart")) + "</button></div>";
    }
    h += "<h3>" + esc(t("pick_" + level)) + "</h3>";
    if (level === "entry") return h + pool.map(vehicleRow).join("");
    distinct(pool, level).forEach(function (opt) {
      var probe = {}; Object.keys(sel).forEach(function (k) { probe[k] = sel[k]; }); probe[level] = opt;
      var list = DS.vehiclesWhere(probe);
      var sub = level === "make" ? t("n_models", { n: distinct(list, "model").length }) : t("n_vehicles", { n: list.length });
      h += APP.bigAct(level === "make" ? list[0].icon || "🏭" : "🚐", opt, sub, "pick:" + level + ":" + opt);
    });
    return h;
  }
  APP.route("pick", function () {
    var h = '<div class="sbox" style="margin-top:.8rem"><span>🔍</span><input data-input="pickSearch" autocomplete="off" spellcheck="false" placeholder="' + esc(t("pick_search_ph")) + '"></div>' +
      '<div id="pickBody">' + pickerBody() + "</div>";
    return { title: t("pick_title"), html: h, tab: "vehicle" };
  });
  APP.action("pick", function (arg) {
    var i = arg.indexOf(":"); sel[arg.slice(0, i)] = arg.slice(i + 1);
    nextLevel();
    var found = DS.vehiclesWhere(sel);
    if (found.length === 1) { sel = {}; return APP.go("#/vehicle/" + found[0].id); }   // only one vehicle left → open it
    APP.render(); window.scrollTo(0, 0);
  });
  APP.action("pickReset", function () { sel = {}; APP.render(); });
  APP.onInput("pickSearch", function (q) {
    var box = document.getElementById("pickBody"); if (!box) return;
    if (!q.trim()) { box.innerHTML = pickerBody(); return; }
    var found = DS.findVehicles(q, 40);
    box.innerHTML = found.length ? found.map(vehicleRow).join("") : '<p class="empty">' + esc(t("pick_none")) + "</p>";
  });

  /* ---------------- ENGINE DATA: sections of an engine record ----------------
     A section is a small tree made by tools/migrate-v34-engines.js:
       { v, u?, src? }  text (u = this value is not verified, src = where it came from)
       { list: [...] }  list
       { rows: [[label, node], ...] }  label / value pairs, possibly nested */
  var SECTIONS = [                       // [id, icon, system it belongs to]
    ["general_specs", "📋", "engine"], ["versions", "🧬", "engine"], ["versions_delphi", "🧬", "engine"], ["variants", "🧬", "engine"],
    ["fuel_pressure", "⛽", "fuel"], ["scv_diagnostics", "⛽", "fuel"], ["hp_pump_service", "⛽", "fuel"],
    ["valve_clearance", "📐", "engine"], ["torque_specs", "🔩", "engine"],
    ["sensor_voltage", "📍", "sensors"], ["sensors", "📍", "sensors"], ["live_data", "📈", "sensors"],
    ["ecm", "🧠", "ecu"], ["wiring_diagram", "〰️", "wiring"],
    ["diagnosis_priority", "🧭", "engine"], ["common_problems", "⚠️", "engine"],
    ["turbo_diagnostics", "🌀", "engine"], ["egr_diagnostics", "♻️", "engine"], ["dpf_diagnostics", "♻️", "engine"],
    ["special_functions", "🛠️", "special"], ["abs_vsc", "🛑", "abs"], ["chassis_systems", "🛑", "abs"],
    ["manufacturer_dtc", "🧾", "engine"], ["maintenance_schedule", "🗓️", "repair"], ["service_procedure", "📘", "repair"],
    ["special_tools", "🧰", "repair"], ["repair_manual", "📕", "repair"], ["notes", "📝", "engine"], ["_note", "ℹ️", "engine"]
  ];
  function flag(n) { return (n.u ? " " + badge("pending", true) : "") + (n.src ? '<div class="dim small">' + esc(t("source_lbl")) + ": " + esc(n.src) + "</div>" : ""); }
  function text(n) { return esc(String(n.v).replace(/^[A-Z]+:/, "").replace(/\|/g, " / ")).replace(/\n/g, "<br>") + flag(n); }
  function lbl(k) { return esc(typeof k === "string" ? k.replace(/_/g, " ") : L(k)); }
  function node(n) {
    if (!n) return "";
    if (n.v !== undefined) return "<p>" + text(n) + "</p>";
    if (n.list) {
      var simple = n.list.every(function (x) { return x.v !== undefined; });
      return simple ? '<ol class="lst">' + n.list.map(function (x) { return "<li>" + text(x) + "</li>"; }).join("") + "</ol>"
                    : n.list.map(function (x) { return '<div class="sub-card">' + node(x) + "</div>"; }).join("");
    }
    var h = "", rows = "";
    var flush = function () { if (rows) { h += '<table class="tbl kv"><tbody>' + rows + "</tbody></table>"; rows = ""; } };
    n.rows.forEach(function (r) {
      if (r[1].v !== undefined) rows += "<tr><th>" + lbl(r[0]) + "</th><td>" + text(r[1]) + "</td></tr>";
      else { flush(); h += '<div class="blk"><h4>' + lbl(r[0]) + "</h4>" + node(r[1]) + "</div>"; }
    });
    flush();
    return h;
  }
  function sectionFold(id, icon, eng, open) { return fold(icon + " " + t("sec_" + id), node(eng.sections[id]), open); }
  function trustBanner(v) {
    return v.status === "sourced" ? '<p class="dim small">📄 ' + esc(t("eng_sourced")) + "</p>" : '<div class="notice">⚠ ' + esc(t("eng_unverified")) + "</div>";
  }
  /* how many things each of the 17 systems has for this vehicle */
  function systemCount(v, info, sys) {
    var n = 0;
    SECTIONS.forEach(function (s) { if (s[2] === sys && info.sec.indexOf(s[0]) >= 0) n++; });
    if (DS.hasPack(v)) { var c = DS.categoryCounts(sys); n += c.dtc + c.proc + c.special; }
    if (DTC.ready()) DTC.groupsFor(v).forEach(function (g) { if (g.sys === sys) n++; });
    return n;
  }

  /* ---------------- VEHICLE PAGE ---------------- */
  APP.route("vehicle", function (id) {
    var v = DS.vehicle(id);
    if (!v) { sel = {}; return { title: t("pick_title"), html: '<div id="pickBody">' + pickerBody() + "</div>", tab: "vehicle" }; }
    var info = DS.engineInfo(v.engineKey), eng = DS.engine(v.engineKey);
    if (!eng) DS.loadEngine(v.engineKey, APP.render);
    if (!DTC.ready()) DTC.load(APP.render);                 // for the code-group counts on the tiles
    var mine = Settings.get("vehicleId") === v.id, fav = Settings.isFavorite(v.id);
    var h = '<div style="margin-top:.8rem">' + vehicleCard(v) + "</div>";
    h += '<p class="small"><b>' + esc(t("engine_lbl")) + ":</b> " + esc(info.n) + (info.v ? '<br><span class="dim">' + esc(t("used_in")) + ": " + esc(info.v) + "</span>" : "") + "</p>";
    h += '<div class="row" style="margin:.6rem 0 1rem">' +
      (mine ? '<span class="btn on">✓ ' + esc(t("is_current")) + "</span>" : '<button class="btn pri" data-act="set:vehicleId:' + v.id + '">' + esc(t("use_vehicle")) + "</button>") +
      '<button class="btn' + (fav ? " on" : "") + '" data-act="fav:' + v.id + '">' + (fav ? "★ " + esc(t("fav_remove")) : "☆ " + esc(t("fav_add"))) + "</button></div>";
    h += trustBanner(v);

    h += "<h3>" + esc(t("systems")) + '</h3><div class="tiles">' + DS.categories().map(function (c) {
      var n = systemCount(v, info, c.id);
      return '<a class="tile' + (n ? "" : " empty-t") + '" href="#/system/' + v.id + "/" + c.id + '"><span class="ic">' + c.icon + '</span><span class="nm">' + esc(L(c.name)) + '</span><span class="ct">' + (n ? "📄 " + n : "—") + "</span></a>";
    }).join("") + "</div>";

    h += "<h3>" + esc(t("all_engine_data")) + "</h3>";
    if (!eng) h += '<p class="empty">⏳ ' + esc(t("loading_engine")) + "</p>";
    else {
      h += SECTIONS.filter(function (s) { return eng.sections[s[0]]; }).map(function (s) { return sectionFold(s[0], s[1], eng, s[0] === "general_specs"); }).join("");
      if (eng.linkedDtc) h += fold("🔢 " + t("linked_codes") + " (" + eng.linkedDtc.length + ")", '<div class="chips">' + eng.linkedDtc.map(function (c) {
        return '<a class="chip code" href="#/dtc/' + encodeURIComponent(c) + '">' + esc(c) + "</a>"; }).join("") + "</div>");
    }
    if (DS.hasPack(v)) h += '<div class="notice">' + esc(L(DS.meta().notice)) + "</div>";
    return { title: DS.vehicleName(v), sub: DS.vehicleLine(v), html: h, tab: "vehicle", top: mine };
  });
  APP.action("fav", function (id) { Settings.toggleFavorite(id); });

  /* ---------------- SYSTEM PAGE (one of the 17 categories) ---------------- */
  function dtcItem(d) {
    return '<a class="ditem ' + d.severity + '" href="#/dtc/' + d.code + '"><span class="c">' + d.code + '</span><span class="t">' + esc(L(d.title)) + "</span></a>";
  }
  function stepsList(steps) {
    return '<ol class="lst">' + steps.map(function (s) {
      return "<li>" + esc(L(s.text)) + " " + badge(s.status, true) + (s.value !== undefined ? "<br>" + val(s.value, s.status) : "") + "</li>";
    }).join("") + "</ol>";
  }
  function procFold(p) {
    return fold("📘 " + L(p.title), '<p><span class="lv ' + p.level + '" style="margin-left:0">' + esc(U(p.level)) + "</span> ⏱ " + esc(p.time) + " · 🧰 " + esc(L(p.tools)) + "</p>" +
      '<div class="safety" style="margin-top:0">⚠ ' + esc(L(p.warning)) + "</div>" + stepsList(p.steps));
  }
  function scanTag(v) {
    return v === true ? '<span class="tag medium">📟 ' + esc(U("scanner_req")) + "</span>" : v === false ? '<span class="tag low">✋ ' + esc(U("scanner_no")) + "</span>" : '<span class="tag">❔ ' + esc(U("scanner_maybe")) + "</span>";
  }
  function specialFold(s) {
    return fold("🛠️ " + L(s.title), "<div>" + scanTag(s.needsScanner) + '<span class="lv ' + s.level + '">' + esc(U(s.level)) + "</span></div><p>" + esc(L(s.why)) + "</p>" + stepsList(s.steps));
  }
  APP.route("system", function (vid, sys) {
    var v = DS.vehicle(vid), c = DS.category(sys);
    if (!v || !c) return APP.redirect("#/home");
    var eng = DS.engine(v.engineKey);
    if (!eng) DS.loadEngine(v.engineKey, APP.render);
    if (!DTC.ready()) DTC.load(APP.render);
    var h = "", any = false;
    /* 1. this engine's data for the system */
    if (eng) {
      var mine = SECTIONS.filter(function (s) { return s[2] === sys && eng.sections[s[0]]; });
      if (mine.length) { any = true; h += '<div style="margin-top:.8rem">' + trustBanner(v) + "</div>" + mine.map(function (s) { return sectionFold(s[0], s[1], eng, mine.length === 1); }).join(""); }
    } else h += '<p class="empty">⏳ ' + esc(t("loading_engine")) + "</p>";
    /* 2. the demo pack (HiAce 1KD-FTV only) */
    if (DS.hasPack(v)) {
      var dt = DS.dtcsBySystem(sys), pr = sys === "repair" ? DS.procedures() : DS.proceduresBySystem(sys), sp = sys === "special" ? DS.specialFunctions() : DS.specialBySystem(sys);
      if (dt.length || pr.length || sp.length) {
        any = true; h += "<h3>◇ " + esc(t("demo_pack")) + "</h3>";
        h += dt.map(dtcItem).join("") + pr.map(procFold).join("");
        if (sp.length) h += ((sys === "key" || sys === "remote" || sys === "special") ? '<div class="safety">🔐 ' + esc(U("no_bypass")) + "</div>" : "") + sp.map(specialFold).join("");
      }
    }
    /* 3. fault-code groups for this system */
    var groups = DTC.ready() ? DTC.groupsFor(v).filter(function (g) { return g.sys === sys; }) : [];
    if (groups.length) { any = true; h += "<h3>🏭 " + esc(t("for_vehicle")) + "</h3>" + groups.map(function (g) { return APP.bigLink(c.icon, g.title.split(" — ")[0], t("n_codes", { n: g.count }), "#/dtcgroup/" + g.brand + "/" + g.id); }).join(""); }
    if (!any && eng) h += '<p class="empty">' + esc(U("no_data")) + "</p>";
    h += APP.bigLink("📚", t("browse_all", { s: L(c.name) }), "", "#/browse/" + sys);
    return { title: c.icon + " " + L(c.name), sub: DS.vehicleName(v) + " · " + DS.vehicleLine(v), html: h, tab: "vehicle" };
  });

  /* shared with screens-dtc.js */
  APP.ui = { dtcItem: dtcItem, procFold: procFold, specialFold: specialFold, stepsList: stepsList, recentChips: recentChips };
})();
