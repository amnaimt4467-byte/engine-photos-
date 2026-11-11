/* =====================================================================
   GUIDE SCREENS — the three Home buttons that walk the mechanic through a job:

     #/symptoms            "I see a problem": pick a symptom guide
     #/flow/<id>/<path>    one step at a time: what to do → what did you find? → next step / fix / done
     #/special             reset and special functions for the selected vehicle
     #/sfrun/<id>/…        a demo-pack function as a wizard (scanner question, then step by step)
     #/learn, #/lesson/<id>  multimeter testing lessons, "when do I need a scanner", glossary

   A flow position is kept in the URL (<path> = the answers chosen so far, e.g. "0.1"),
   so the Back button always returns to the previous step.
   ===================================================================== */
(function () {
  var DS = KB.DataStore, L = KB.L, U = KB.U, esc = KB.esc, badge = KB.badge;
  var t = APP.t, fold = APP.fold, ui = APP.ui;

  function veh() { return DS.vehicle(Settings.get("vehicleId")); }
  /* text in the user's language; a small tag shows when only another language exists */
  function tx(o) {
    var p = KB.pick(o);
    return esc(p.text) + (p.text && p.lang !== KB.getLang() ? ' <span class="lg">' + p.lang.toUpperCase() + "</span>" : "") + (o && o.u ? " " + badge("pending", true) : "");
  }
  function plain(o) { return KB.pick(o).text; }

  /* ---------- flows: loaded on first use ---------- */
  var loadingFlows = false;
  function needFlows(tab) {
    if (window.FLOWS) return null;
    if (!loadingFlows) {
      loadingFlows = true;
      var s = document.createElement("script"); s.src = "data/flows.js";
      s.onload = s.onerror = function () { loadingFlows = false; if (!window.FLOWS) window.FLOWS = []; APP.render(); };
      document.head.appendChild(s);
    }
    return { title: t("sym_title"), html: '<p class="empty">⏳ ' + esc(t("loading")) + "</p>", tab: tab || "home" };
  }
  function flowById(id) { for (var i = 0; i < FLOWS.length; i++) if (FLOWS[i].id === id) return FLOWS[i]; return null; }
  /* does this guide fit the vehicle?  fuel classes: cr, mech, d (diesel, type unknown), pet, ev */
  function fits(f, v) {
    if (!v) return false;
    var a = f.applies, ft = (DS.engineInfo(v.engineKey) || {}).ft;
    if (a.skip && a.skip.indexOf(v.engineKey) >= 0) return false;
    if (a.engines) return a.engines.indexOf(v.engineKey) >= 0;
    if (a.fuel === "ice") return ft !== "ev";
    if (a.fuel === "dsl") return ft === "cr" || ft === "mech" || ft === "d";
    if (a.fuel === "cr" || a.fuel === "mech") return ft === a.fuel || ft === "d";
    return a.fuel === ft;
  }
  function flowRow(f) {
    return APP.bigLink(f.group === "snd" ? "👂" : f.applies.engines ? "🎯" : "🩺", plain(f.title), f.vehicle + " · " + t("n_steps", { n: f.steps.length }), "#/flow/" + f.id);
  }

  /* ---------- "I see a problem": list of guides ---------- */
  APP.route("symptoms", function () {
    var wait = needFlows(); if (wait) return wait;
    var v = veh(), h = '<div class="notice" style="margin-top:.8rem">ⓘ ' + esc(t("flow_note")) + "</div>";
    if (!v) {
      h += '<p class="dim">' + esc(t("sym_hint")) + '</p><a class="btn pri block" href="#/pick" style="margin-bottom:1rem">' + esc(t("choose_vehicle")) + "</a>";
      h += "<h3>" + esc(t("sym_all")) + "</h3>" + FLOWS.map(flowRow).join("");
    } else {
      var mine = FLOWS.filter(function (f) { return fits(f, v); }), rest = FLOWS.filter(function (f) { return !fits(f, v); });
      /* a guide written for this exact engine goes first */
      mine.sort(function (a, b) { return (a.applies.engines ? 0 : 1) - (b.applies.engines ? 0 : 1); });
      h += "<h3>🚐 " + esc(t("sym_for_vehicle")) + '</h3><p class="dim small">' + esc(DS.vehicleName(v) + " · " + DS.vehicleLine(v)) + "</p>" + mine.map(flowRow).join("");
      if (rest.length) h += fold("📚 " + t("sym_other") + " (" + rest.length + ")", rest.map(flowRow).join(""));
    }
    return { title: t("sym_title"), html: h, tab: "home" };
  });

  /* ---------- one flow ---------- */
  var TOOL = { eye: "👁", ear: "👂", v: "🔋", ohm: "Ω", scan: "📟", work: "🔧" };
  function longest(f) {                        // deepest path, for the progress bar
    var byN = {}; f.steps.forEach(function (s) { byN[s.n] = s; });
    return (function depth(n) { var m = 0; byN[n].res.forEach(function (r) { if (r.step != null) m = Math.max(m, depth(r.step)); }); return 1 + m; })(f.start);
  }
  var speakText = "";
  APP.action("speakStep", function () { Voice.speak(speakText); });
  APP.route("flow", function (id, path) {
    var wait = needFlows(); if (wait) return wait;
    var f = flowById(id); if (!f) return APP.redirect("#/symptoms");
    var byN = {}; f.steps.forEach(function (s) { byN[s.n] = s; });
    var answers = path ? path.split(".").map(Number) : [], step = byN[f.start], end = null;
    for (var i = 0; i < answers.length; i++) {
      var r = step.res[answers[i]]; if (!r) return APP.redirect("#/flow/" + f.id);
      if (r.step != null) step = byN[r.step]; else { end = r; break; }
    }
    var depth = answers.length + (end ? 0 : 1), total = longest(f), base = "#/flow/" + f.id;
    var h = '<div class="prog"><i style="width:' + Math.min(100, Math.round(((end ? total : depth - 0.5) / total) * 100)) + '%"></i></div>';
    var restart = answers.length ? '<a class="btn" href="' + base + '">↺ ' + esc(t("start_again")) + "</a>" : "";
    var speakBtn = Voice.canSpeak() ? '<button class="btn" data-act="speakStep">🔊 ' + esc(t("read_aloud")) + "</button>" : "";

    if (end) {
      var fix = !!end.fix, body = end.fix || end.done;
      speakText = plain(body);
      h += '<div class="endcard ' + (fix ? "fix" : "ok") + '"><div class="ic">' + (fix ? "🔧" : "✅") + "</div><h2>" + esc(t(fix ? "fix_title" : "done_title")) + '</h2><p class="plain">' + tx(body) + "</p></div>";
      if (fix && f.confirm.length) h += "<h3>🏁 " + esc(t("then_check")) + '</h3><ol class="lst">' + f.confirm.map(function (c) { return "<li>" + tx(c) + "</li>"; }).join("") + "</ol>";
      h += '<div class="row" style="margin-top:1rem">' + restart + speakBtn + '<a class="btn pri" href="#/symptoms">' + esc(t("sym_title_short")) + "</a></div>";
    } else {
      speakText = plain(step.title) + ". " + step.acts.map(plain).join(" ") + (step.note ? " " + plain(step.note) : "");
      h += '<div class="stepname"><span class="tag">' + TOOL[step.tool] + " " + esc(t("tool_" + step.tool)) + "</span><span>" + esc(t("step_n", { n: depth })) + "</span></div>";
      h += "<h2>" + tx(step.title) + "</h2>" + step.acts.map(function (a) { return '<p class="plain">' + tx(a) + "</p>"; }).join("");
      if (step.note) h += '<div class="lock">💡 ' + tx(step.note) + "</div>";
      h += "<h3>" + esc(t("what_found")) + "</h3>" + step.res.map(function (r, k) {
        var kind = r.step != null ? "" : r.fix ? " to-fix" : " to-ok";
        return '<a class="big res' + kind + '" href="' + base + "/" + answers.concat([k]).join(".") + '"><span class="tx"><b>' + tx(r.label) + '</b></span><span class="arr">›</span></a>';
      }).join("");
      if (restart || speakBtn) h += '<div class="row" style="margin-top:.6rem">' + restart + speakBtn + "</div>";
    }
    h += fold("ⓘ " + t("flow_about"), "<p>" + esc(t("flow_note")) + '</p><p class="dim small">' + esc(f.source) + "</p>");
    return { title: plain(f.title), sub: f.vehicle, html: h, tab: "home" };
  });

  /* ---------- Reset / special functions ---------- */
  APP.route("special", function () {
    var v = veh(), g = DS.scannerGuide();
    var h = '<div class="safety" style="margin-top:.8rem">🔐 ' + esc(U("no_bypass")) + "</div>";
    if (!v) {
      h += '<p class="dim">' + esc(t("sf_choose")) + '</p><a class="btn pri block" href="#/pick" style="margin-bottom:1rem">' + esc(t("choose_vehicle")) + "</a>";
    } else {
      var eng = DS.engine(v.engineKey);
      if (!eng) DS.loadEngine(v.engineKey, APP.render);
      h += '<p class="small"><b>' + esc(DS.vehicleName(v)) + '</b> <span class="dim">' + esc(DS.vehicleLine(v)) + "</span></p>";
      if (DS.hasPack(v)) {
        h += "<h3>◇ " + esc(t("sf_demo")) + "</h3>" + DS.specialFunctions().map(function (s) {
          var tag = s.needsScanner === true ? "📟 " + U("scanner_req") : s.needsScanner === false ? "✋ " + U("scanner_no") : "❔ " + U("scanner_maybe");
          return APP.bigLink(s.needsScanner === true ? "📟" : s.needsScanner === false ? "✋" : "❔", L(s.title), tag + " · " + U(s.level), "#/sfrun/" + s.id);
        }).join("");
      }
      h += "<h3>🛠️ " + esc(t("sf_engine")) + "</h3>";
      if (!eng) h += '<p class="empty">⏳ ' + esc(t("loading_engine")) + "</p>";
      else if (!eng.sections.special_functions) h += '<p class="empty">' + esc(U("no_data")) + "</p>";
      else {
        h += ui.trustBanner(v) + eng.sections.special_functions.rows.map(function (r) {
          return fold("🛠️ " + (typeof r[0] === "string" ? r[0] : L(r[0])), ui.node(r[1]));
        }).join("");
      }
    }
    h += fold("📟 " + t("when_scanner"), '<p><b class="okc">✋ ' + esc(U("manual_ok")) + "</b></p>" + APP.list(g.manualOk) + '<p><b class="warnc">📟 ' + esc(U("scanner_needed")) + "</b></p>" + APP.list(g.scannerNeeded), !v);
    return { title: t("sf_title"), html: h, tab: "home" };
  });

  /* a demo-pack function as a wizard:  #/sfrun/<id>            → scanner question (when one is required)
                                         #/sfrun/<id>/no         → "cannot be done by hand"
                                         #/sfrun/<id>/go/<step>  → one step at a time */
  APP.route("sfrun", function (id, mode, stepArg) {
    var s = null; DS.specialFunctions().forEach(function (x) { if (x.id === id) s = x; });
    if (!s) return APP.redirect("#/special");
    var base = "#/sfrun/" + s.id;
    var h = '<div style="margin-top:.8rem"><span class="lv ' + s.level + '" style="margin-left:0">' + esc(U(s.level)) + "</span></div><h2>" + esc(L(s.title)) + '</h2><div class="card"><b>' + esc(U("why")) + "</b><br>" + esc(L(s.why)) + "</div>";
    if (s.group === "key" || s.group === "remote") h += '<div class="safety">🔐 ' + esc(U("no_bypass")) + "</div>";
    if (s.needsScanner === true && !mode) {
      h += '<div class="card plain"><b>📟 ' + esc(t("have_scanner")) + '</b></div><div class="row"><a class="btn" href="' + base + '/no">' + esc(t("no")) + '</a><a class="btn pri" href="' + base + '/go/0">' + esc(t("yes_continue")) + "</a></div>";
      return { title: t("sf_title"), html: h, tab: "home" };
    }
    if (mode === "no") {
      h += '<div class="lock">ℹ️ ' + esc(t("no_scan_msg")) + '</div><div class="row" style="margin-top:1rem"><a class="btn pri" href="#/special">' + esc(t("sf_title")) + "</a></div>";
      return { title: t("sf_title"), html: h, tab: "home" };
    }
    var i = Math.max(0, Math.min(s.steps.length - 1, parseInt(stepArg, 10) || 0)), st = s.steps[i];
    h += '<div class="prog"><i style="width:' + Math.round(((i + 1) / s.steps.length) * 100) + '%"></i></div>';
    h += '<div class="card"><div class="stepname"><b>' + esc(t("step_of", { a: i + 1, b: s.steps.length })) + "</b>" + badge(st.status) + '</div><p class="plain">' + esc(L(st.text)) + "</p></div>";
    h += '<div class="row">' + (i > 0 ? '<a class="btn" href="' + base + "/go/" + (i - 1) + '">← ' + esc(t("prev_step")) + "</a>" : "") +
      (i < s.steps.length - 1 ? '<a class="btn pri" href="' + base + "/go/" + (i + 1) + '">' + esc(t("next")) + " →</a>" : '<a class="btn pri" href="#/special">✓ ' + esc(t("finish")) + "</a>") + "</div>";
    return { title: t("sf_title"), html: h, tab: "home" };
  });

  /* ---------- Learn testing ---------- */
  APP.route("learn", function () {
    var g = DS.scannerGuide();
    var h = '<h2 style="margin-top:.8rem">' + esc(t("learn_pick")) + "</h2>" + DS.manualTests().map(function (m) { return APP.bigLink(m.icon, L(m.title), L(m.intro), "#/lesson/" + m.id); }).join("");
    h += fold("📟 " + t("when_scanner"), '<p><b class="okc">✋ ' + esc(U("manual_ok")) + "</b></p>" + APP.list(g.manualOk) + '<p><b class="warnc">📟 ' + esc(U("scanner_needed")) + "</b></p>" + APP.list(g.scannerNeeded));
    h += fold("📖 " + U("glossary"), '<table class="tbl kv"><tbody>' + DS.glossary().map(function (x) { return '<tr><th class="mono">' + esc(x.term) + "</th><td>" + esc(L(x.text)) + "</td></tr>"; }).join("") + "</tbody></table>");
    return { title: t("learn_title"), html: h, tab: "home" };
  });
  APP.route("lesson", function (id) {
    var m = null; DS.manualTests().forEach(function (x) { if (x.id === id) m = x; });
    if (!m) return APP.redirect("#/learn");
    var h = '<h2 style="margin-top:.8rem">' + m.icon + " " + esc(L(m.title)) + " " + badge("general", true) + '</h2><p class="plain">' + esc(L(m.intro)) + "</p>";
    if (m.id === "voltage" || m.id === "vdrop") h += '<div class="illus">' + meterSVG(m.id) + "<small>" + esc(t("illus")) + "</small></div>";
    h += m.steps.map(function (s, k) { return '<div class="check"><span class="n">' + (k + 1) + "</span><span>" + esc(L(s)) + "</span></div>"; }).join("");
    return { title: t("learn_title"), html: h, tab: "home" };
  });
  /* simple, generic multimeter hook-up drawing (not vehicle-specific); colours follow the theme */
  function meterSVG(kind) {
    var drop = kind === "vdrop";
    return '<svg viewBox="0 0 360 170" width="360" role="img" aria-label="multimeter connection">' +
      '<rect x="20" y="30" width="90" height="120" rx="12" class="m-body"/><rect x="32" y="44" width="66" height="30" rx="4" fill="#9fe39f"/>' +
      '<text x="65" y="65" text-anchor="middle" font-family="monospace" font-size="15" fill="#123">' + (drop ? "0.08 V" : "12.6 V") + "</text>" +
      '<text x="65" y="100" text-anchor="middle" font-size="12" class="m-text">V⎓</text>' +
      '<circle cx="45" cy="130" r="6" fill="#111" stroke="#888"/><circle cx="85" cy="130" r="6" fill="#d33" stroke="#888"/>' +
      (drop
        ? '<rect x="200" y="50" width="130" height="18" rx="4" class="m-part"/><text x="265" y="44" text-anchor="middle" font-size="11" class="m-text">ground wire / strap</text>' +
          '<path d="M85 130 C140 130 180 60 205 59" stroke="#d33" stroke-width="3" fill="none"/><path d="M45 130 C120 160 300 140 325 66" class="m-lead" stroke-width="3" fill="none"/>' +
          '<text x="265" y="100" text-anchor="middle" font-size="11" class="m-text">load ON</text>'
        : '<rect x="220" y="60" width="110" height="70" rx="8" class="m-part"/><text x="275" y="100" text-anchor="middle" font-size="13" class="m-text">12 V battery</text>' +
          '<text x="244" y="55" font-size="16" fill="#e55">+</text><text x="300" y="55" font-size="16" class="m-text">−</text>' +
          '<path d="M85 130 C150 130 200 40 248 62" stroke="#d33" stroke-width="3" fill="none"/><path d="M45 130 C120 165 280 150 305 62" class="m-lead" stroke-width="3" fill="none"/>') +
      "</svg>";
  }

  /* guides that fit a vehicle, for the vehicle page (returns [] until the flows are loaded) */
  APP.ui.flowsFor = function (v) { return window.FLOWS ? FLOWS.filter(function (f) { return fits(f, v); }) : []; };
})();
