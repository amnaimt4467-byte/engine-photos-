/* =====================================================================
   SCREENS — first launch, home, vehicle picker, vehicle page, system page,
   DTC list / search results / DTC detail, and "coming soon" placeholders.
   ===================================================================== */
(function () {
  var DS = KB.DataStore, L = KB.L, U = KB.U, esc = KB.esc, badge = KB.badge, val = KB.val;
  var t = APP.t, list = APP.list, block = APP.block, fold = APP.fold;

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
    return '<div class="card vehicle"><span class="ic">🚐</span><div class="tx"><b>' + esc(DS.vehicleName(v)) + "</b><small>" + esc(DS.vehicleLine(v)) + "</small></div></div>";
  }
  function recentChips() {
    var r = Settings.get("recent"); if (!r.length) return "";
    return '<div class="chips"><span class="dim" style="align-self:center;font-size:.85rem">' + esc(t("recent")) + ":</span>" +
      r.map(function (c) { return '<a class="chip code' + (DS.dtc(c) ? "" : " ghost") + '" href="' + (DS.dtc(c) ? "#/dtc/" + c : "#/find/" + encodeURIComponent(c)) + '">' + esc(c) + "</a>"; }).join("") + "</div>";
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
    h += '<div class="notice">' + esc(L(DS.meta().notice)) + "</div>";
    return { title: t("app_name"), html: h, tab: "home", top: true };
  });

  APP.route("soon", function (n) {
    var h = '<div class="empty"><div style="font-size:3rem">🚧</div><h2>' + esc(t("soon_title")) + "</h2><p>" + esc(t("soon_body", { n: n || "" })) + '</p><a class="btn pri" href="#/home">' + esc(t("go_home")) + "</a></div>";
    return { title: t("soon_title"), html: h, tab: "home" };
  });

  /* ---------------- VEHICLE PICKER ----------------
     Make → Model → Chassis → Year → Engine. A level with only one possible
     value is filled in automatically, so the mechanic taps as little as possible. */
  var LEVELS = ["make", "model", "chassis", "year", "engine"];
  var sel = {};
  function distinct(vehicles, key) {
    var seen = [];
    vehicles.forEach(function (v) { var x = String(v[key]); if (seen.indexOf(x) < 0) seen.push(x); });
    return seen;
  }
  /* fill single-choice levels; returns the next level the user must choose, or null when done */
  function advance() {
    for (var i = 0; i < LEVELS.length; i++) {
      var k = LEVELS[i]; if (k in sel) continue;
      var opts = distinct(DS.vehiclesWhere(sel), k);
      if (opts.length === 1) { sel[k] = opts[0]; continue; }
      return k;
    }
    return null;
  }
  function vehicleRow(v) {
    return APP.bigLink("🚐", DS.vehicleName(v), DS.vehicleLine(v), "#/vehicle/" + v.id, "<div>" + APP.vehicleTag(v) + "</div>");
  }
  function pickerBody() {
    var level = advance(), pool = DS.vehiclesWhere(sel);
    var h = "";
    var chosen = LEVELS.filter(function (k) { return k in sel && sel[k] !== ""; });
    if (chosen.length) {
      h += '<div class="path">' + chosen.map(function (k) { return '<span class="chip on">' + esc(sel[k]) + "</span>"; }).join("<span class=\"dim\">›</span>") +
        '<button class="chip" data-act="pickReset">↺ ' + esc(t("pick_restart")) + "</button></div>";
    }
    if (!level) return h + pool.map(vehicleRow).join("");
    h += "<h3>" + esc(t("pick_" + level)) + "</h3>";
    distinct(pool, level).forEach(function (opt) {
      var probe = {}; Object.keys(sel).forEach(function (k) { probe[k] = sel[k]; }); probe[level] = opt;
      var n = DS.vehiclesWhere(probe).length;
      h += APP.bigAct(level === "make" ? "🏭" : level === "year" ? "📅" : level === "engine" ? "⚙️" : "🚐", opt || "—", t("n_vehicles", { n: n }), "pick:" + level + ":" + opt);
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
    if (!advance()) {                       // every level decided → open that vehicle
      var found = DS.vehiclesWhere(sel); sel = {};
      if (found.length === 1) return APP.go("#/vehicle/" + found[0].id);
    }
    APP.render();
  });
  APP.action("pickReset", function () { sel = {}; APP.render(); });
  APP.onInput("pickSearch", function (q) {
    var box = document.getElementById("pickBody"); if (!box) return;
    if (!q.trim()) { box.innerHTML = pickerBody(); return; }
    var found = DS.findVehicles(q);
    box.innerHTML = found.length ? found.map(vehicleRow).join("") : '<p class="empty">' + esc(t("pick_none")) + "</p>";
  });

  /* ---------------- VEHICLE PAGE ---------------- */
  APP.route("vehicle", function (id) {
    var v = DS.vehicle(id); if (!v) { sel = {}; return { title: t("pick_title"), html: '<div id="pickBody">' + pickerBody() + "</div>", tab: "vehicle" }; }
    var mine = Settings.get("vehicleId") === v.id, fav = Settings.isFavorite(v.id);
    var h = '<div style="margin-top:.8rem">' + vehicleCard(v) + "</div><div>" + APP.vehicleTag(v) + "</div>";
    h += '<div class="row" style="margin:.6rem 0 1rem">' +
      (mine ? '<span class="btn on">✓ ' + esc(t("is_current")) + "</span>" : '<button class="btn pri" data-act="set:vehicleId:' + v.id + '">' + esc(t("use_vehicle")) + "</button>") +
      '<button class="btn' + (fav ? " on" : "") + '" data-act="fav:' + v.id + '">' + (fav ? "★ " + esc(t("fav_remove")) : "☆ " + esc(t("fav_add"))) + "</button></div>";
    if (!DS.hasPack(v)) return { title: DS.vehicleName(v), sub: DS.vehicleLine(v), html: h + '<div class="lock">📦 ' + esc(t("no_pack")) + "</div>", tab: "vehicle" };

    h += fold("📋 " + U("specs"), '<table class="tbl"><tbody>' + v.specs.map(function (s) {
      return "<tr><td>" + esc(L(s.k)) + "</td><td>" + (s.v ? esc(s.v) : val("", "pending")) + "</td><td>" + badge(s.status, true) + "</td></tr>";
    }).join("") + "</tbody></table>", true);
    h += "<h3>" + esc(t("systems")) + '</h3><div class="tiles">' + DS.categories().map(function (c) {
      var n = DS.categoryCounts(c.id), tot = n.dtc + n.proc + n.special;
      return '<a class="tile' + (tot ? "" : " empty-t") + '" href="#/system/' + v.id + "/" + c.id + '"><span class="ic">' + c.icon + '</span><span class="nm">' + esc(L(c.name)) + '</span><span class="ct">' + (tot ? "📄 " + tot : "—") + "</span></a>";
    }).join("") + "</div>";
    h += '<div class="notice">' + esc(L(DS.meta().notice)) + "</div>";
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
    var dt = DS.dtcsBySystem(sys), pr = sys === "repair" ? DS.procedures() : DS.proceduresBySystem(sys), sp = sys === "special" ? DS.specialFunctions() : DS.specialBySystem(sys);
    var h = "";
    if (!dt.length && !pr.length && !sp.length) h = '<p class="empty">' + esc(U("no_data")) + "</p>";
    if (dt.length) h += "<h3>DTC</h3>" + dt.map(dtcItem).join("");
    if (pr.length) h += "<h3>" + esc(t("procs")) + "</h3>" + pr.map(procFold).join("");
    if (sp.length) h += "<h3>" + esc(U("special_title")) + "</h3>" + ((sys === "key" || sys === "remote" || sys === "special") ? '<div class="safety">🔐 ' + esc(U("no_bypass")) + "</div>" : "") + sp.map(specialFold).join("");
    return { title: c.icon + " " + L(c.name), sub: DS.vehicleName(v) + " · " + DS.vehicleLine(v), html: h, tab: "vehicle" };
  });

  /* ---------------- DTC: list, search results, detail ---------------- */
  APP.route("dtc", function (code) {
    if (code) return dtcDetail(code);
    var h = '<div style="margin-top:.8rem">' + APP.searchForm("") + "</div>" + recentChips() +
      "<h3>" + esc(t("dtc_in_app")) + "</h3>" + DS.dtcs().map(dtcItem).join("") + '<div class="lock">ℹ️ ' + esc(t("dtc_more")) + "</div>";
    return { title: t("dtc_title"), html: h, tab: "dtc", top: true };
  });
  APP.route("find", function (q) {
    q = q || "";
    var r = DS.search(q);
    var h = '<div style="margin-top:.8rem">' + APP.searchForm(q) + "</div><h3>" + esc(t("results_for")) + " “" + esc(q) + "”</h3>";
    if (!r.dtcs.length && !r.procedures.length && !r.special.length) h += '<div class="lock">🔎 ' + esc(DS.looksLikeDTC(q) ? t("not_found") : U("no_results")) + "</div>";
    if (r.dtcs.length) h += r.dtcs.map(dtcItem).join("");
    if (r.procedures.length) h += "<h3>" + esc(t("procs")) + "</h3>" + r.procedures.map(procFold).join("");
    if (r.special.length) h += "<h3>" + esc(U("special_title")) + "</h3>" + r.special.map(specialFold).join("");
    return { title: t("dtc_title"), html: h, tab: "dtc" };
  });

  var TABS = ["over", "diag", "elec", "rep", "ver"], tab = "over", tabCode = null;
  APP.action("tab", function (k) { tab = k; APP.render(); });
  function dtcDetail(code) {
    var d = DS.dtc(code);
    if (!d) return APP.redirect("#/find/" + encodeURIComponent(code));
    if (tabCode !== d.code) { tabCode = d.code; tab = "over"; }
    var h = '<div class="codehead"><span class="c">' + d.code + '</span><span class="tt">' + esc(L(d.title)) + " " + badge(d.titleStatus, true) + "</span></div>";
    h += '<div><span class="tag ' + d.severity + '">● ' + esc(U("severity")) + ": " + esc(U("sev_" + d.severity)) + "</span>" +
      d.system.map(function (s) { var c = DS.category(s); return '<span class="tag">' + c.icon + " " + esc(L(c.name)) + "</span>"; }).join("") + "</div>";
    h += '<div class="dtabs">' + TABS.map(function (k) { return '<button data-act="tab:' + k + '" class="' + (tab === k ? "on" : "") + '">' + esc(t("t_" + k)) + "</button>"; }).join("") + "</div>";
    h += { over: tOver, diag: tDiag, elec: tElec, rep: tRep, ver: tVer }[tab](d);
    return { title: d.code, sub: L(d.title), html: h, tab: "dtc" };
  }
  function tOver(d) {
    var h = d.safety ? '<div class="safety"><b>⚠ ' + esc(U("safety")) + "</b><br>" + esc(L(d.safety)) + "</div>" : "";
    h += block(U("description"), "<p>" + KB.gloss(esc(L(d.meaning))) + "</p>");
    h += block(U("applic"), "<p>" + esc(L(d.applicability.text)) + " " + badge(d.applicability.status, true) + "</p>");
    return h + block(U("causes"), list(d.causes)) + block(U("symptoms"), list(d.symptoms));
  }
  function tDiag(d) {
    var beginner = Settings.get("level") !== "advanced";
    var steps = beginner ? d.diagnosis.filter(function (s) { return s.level !== "advanced"; }) : d.diagnosis;
    var hidden = d.diagnosis.length - steps.length;
    var h = block(U("diagnosis"), list(steps, true));
    if (hidden) h += '<div class="lock">🔒 ' + esc(t("adv_hidden", { n: hidden })) + '<div class="row" style="margin-top:.6rem"><button class="btn" data-act="set:level:advanced">' + esc(t("show_adv")) + "</button></div></div>";
    if (!beginner) {
      if (d.sensorTest.length) h += block(U("sensor"), list(d.sensorTest));
      if (d.scanner.length) h += block(U("scanner"), list(d.scanner));
    }
    return h;
  }
  function tElec(d) {
    var h = block(U("wiring"), list(d.wiring)), p = d.pins, m = d.meterValues;
    h += block(U("pins"), p.rows.length ? badge(p.status) + '<table class="tbl"><thead><tr><th>' + esc(U("item")) + "</th><th>" + esc(U("connector")) + "</th><th>" + esc(U("pin")) + "</th></tr></thead><tbody>" +
      p.rows.map(function (r) { return "<tr><td>" + esc(r.item) + "</td><td>" + val(r.connector, r.connector ? "" : "pending") + "</td><td>" + val(r.pin, r.pin ? "" : "pending") + "</td></tr>"; }).join("") + "</tbody></table>" : val("", "pending"));
    h += block(U("meter"), m.rows.length ? badge(m.status) + '<table class="tbl"><thead><tr><th>' + esc(U("test")) + "</th><th>" + esc(U("expected")) + "</th></tr></thead><tbody>" +
      m.rows.map(function (r) { return "<tr><td>" + esc(L(r.test)) + "</td><td>" + val(r.expected, r.expected ? m.status : "pending") + "</td></tr>"; }).join("") + "</tbody></table>" : val("", "pending"));
    return h;
  }
  function tRep(d) {
    var h = block(U("repair"), list(d.repair, true));
    h += block(U("parts"), d.parts.length ? '<table class="tbl"><tbody>' + d.parts.map(function (p) { return "<tr><td>" + esc(L(p.name)) + "</td><td>" + val(p.partNo, p.status) + "</td></tr>"; }).join("") + "</tbody></table>" : "<p>—</p>");
    var beginner = Settings.get("level") !== "advanced";
    var procs = DS.procedures().filter(function (p) { return p.relatedDtc.indexOf(d.code) >= 0 && (!beginner || p.level === "beginner"); });
    if (procs.length) h += block(t("procs"), procs.map(procFold).join(""));
    return h;
  }
  function tVer(d) {
    var h = block(U("verify"), list(d.verify, true));
    if (d.related.length) h += block(U("related"), '<div class="chips">' + d.related.map(function (c) {
      return DS.dtc(c) ? '<a class="chip code" href="#/dtc/' + c + '">' + c + "</a>" : '<span class="chip code ghost">' + c + "</span>";
    }).join("") + "</div>");
    return h;
  }
})();
