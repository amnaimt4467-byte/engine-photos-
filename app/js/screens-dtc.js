/* =====================================================================
   DTC SCREENS — lookup home, search results, code page, browse by system,
   brand code group. All lookups go through DTC (js/dtc.js).

   A code page shows the best answer for the mechanic's vehicle first:
     vehicle pack → this engine's brand groups → same brand → SAE generic → other brands
   and always ends with "How to read this code", so no valid code is a dead end.
   ===================================================================== */
(function () {
  var DS = KB.DataStore, L = KB.L, U = KB.U, esc = KB.esc, badge = KB.badge, val = KB.val;
  var t = APP.t, list = APP.list, block = APP.block, fold = APP.fold, ui = APP.ui;

  function veh() { return DS.vehicle(Settings.get("vehicleId")); }
  /* screens that need the library show a short "loading" page the first time, then redraw */
  function needLib(top) {
    if (DTC.ready()) return null;
    DTC.load(APP.render);
    return { title: t("dtc_title"), html: '<p class="empty">⏳ ' + esc(t("loading")) + "</p>", tab: "dtc", top: !!top };
  }

  /* ---------- text helpers ---------- */
  /* text in the user's language; if it only exists in another language, show that with a small tag */
  function tx(obj) {
    var p = KB.pick(obj);
    return KB.gloss(esc(p.text)) + (p.text && p.lang !== KB.getLang() ? ' <span class="lg">' + p.lang.toUpperCase() + "</span>" : "");
  }
  function tlist(items, ordered) {
    var tag = ordered ? "ol" : "ul";
    return "<" + tag + ' class="lst">' + items.map(function (i) { return "<li>" + tx(i) + "</li>"; }).join("") + "</" + tag + ">";
  }
  /* the English title is what the scan tool shows, so it always stays; the translation goes underneath */
  function helper(title) {
    var lang = KB.getLang();
    return lang !== "en" && title && title[lang] && title[lang] !== title.en ? title[lang] : "";
  }
  function srcTag(hit) {
    if (hit.layer === "pack") return '<span class="tag sample">🚐 ' + esc(t("src_pack")) + "</span>";
    var e = hit.entry;
    if (e.layer === "generic") return '<span class="tag">🌐 ' + esc(t("src_generic")) + "</span>";
    return '<span class="tag">🏭 ' + esc(e.brandName) + (hit.layer === "other" ? " · " + esc(t("src_other")) : "") + "</span>";
  }
  /* one line in a list of codes */
  function entryRow(e, vehicle) {
    var h = helper(e.rec.t), who = e.layer === "generic" ? "" : e.brandName + (e.groupTitle ? " · " + e.groupTitle.split(" — ")[0] : "");
    return '<a class="ditem" href="#/dtc/' + encodeURIComponent(e.code) + '"><span class="c">' + esc(e.code) + '</span><span class="t"><b>' + esc(e.rec.t.en) + "</b>" +
      (h ? "<br>" + esc(h) : "") + (who ? '<br><small>🏭 ' + esc(who) + "</small>" : "") + (e.rec.fl ? ' <small class="mono">⚡' + esc(e.rec.fl) + "</small>" : "") + "</span></a>";
  }
  function packRow(d) { return ui.dtcItem(d); }

  /* ---------- "How to read this code" ---------- */
  function decodeBlock(d) {
    if (!d.valid) return "";
    return '<ul class="lst"><li><b class="mono">' + d.code[0] + "</b> — " + esc(t(d.family)) + '</li><li><b class="mono">' + d.code[1] + "</b> — " + esc(t(d.scope)) + "</li>" +
      (d.area ? '<li><b class="mono">' + d.code[2] + "</b> — " + esc(t(d.area)) + "</li>" : "") + "</ul>";
  }

  /* ---------- library record (generic / brand) ---------- */
  function libBody(hit) {
    var e = hit.entry, r = e.rec, h = "";
    if (r.sus) h += '<div class="notice">⚠ ' + esc(t("suspect")) + "</div>";
    if (r.cau) h += block(U("causes"), tlist(r.cau));
    if (r.sym) h += block(U("symptoms"), tlist(r.sym));
    if (r.st) h += block(U("diagnosis"), tlist(r.st, true));
    if (e.groupSteps && e.groupSteps.length) h += block(t("sys_checks"), tlist(e.groupSteps, true));
    if (r.rep) h += block(U("repair"), "<p>" + tx(r.rep) + "</p>");
    if (!r.cau && !r.sym && !r.st && !r.rep && !(e.groupSteps && e.groupSteps.length)) h += '<div class="lock">ℹ️ ' + esc(t("only_title")) + "</div>";
    if (r.rel) h += block(U("related"), '<div class="chips">' + r.rel.slice(0, 24).map(function (c) { return '<a class="chip code" href="#/dtc/' + encodeURIComponent(c) + '">' + esc(c) + "</a>"; }).join("") + "</div>");
    var src = r.src || e.groupSrc;
    if (src) h += '<p class="dim small"><b>' + esc(t("source_lbl")) + ":</b> " + esc(src) + "</p>";
    if (r.note) h += '<p class="dim small"><b>' + esc(t("note_lbl")) + ":</b> " + esc(r.note) + "</p>";
    return h;
  }
  function libHead(hit) {
    var r = hit.entry.rec, hp = helper(r.t);
    return '<div class="tt">' + esc(r.t.en) + " " + badge(r.s, true) + "</div>" + (hp ? '<div class="helper">' + esc(hp) + "</div>" : "") +
      "<div>" + srcTag(hit) + (hit.entry.groupTitle ? '<span class="tag">' + esc(hit.entry.groupTitle.split(" — ")[0]) + "</span>" : "") +
      (r.fl ? '<span class="tag">⚡ ' + esc(t("flash")) + " " + esc(r.fl) + "</span>" : "") + "</div>";
  }
  function otherFold(hit) {
    if (hit.layer === "pack") return fold("🚐 " + t("src_pack") + " — " + L(hit.pack.title), '<a class="btn" href="#/dtc/' + hit.pack.code + '">' + esc(t("open")) + "</a>");
    var e = hit.entry, who = e.layer === "generic" ? "🌐 " + t("src_generic") : "🏭 " + e.brandName;
    return fold(who + " — " + e.rec.t.en, libHead(hit) + libBody(hit));
  }

  /* ---------- vehicle-pack record (tabs) ---------- */
  var TABS = ["over", "diag", "elec", "rep", "ver"], tab = "over", tabCode = null;
  APP.action("tab", function (k) { tab = k; APP.render(); });
  function packPage(d) {
    if (tabCode !== d.code) { tabCode = d.code; tab = "over"; }
    var h = '<div class="tt">' + esc(L(d.title)) + " " + badge(d.titleStatus, true) + "</div>";
    h += '<div><span class="tag sample">🚐 ' + esc(t("src_pack")) + '</span><span class="tag ' + d.severity + '">● ' + esc(U("severity")) + ": " + esc(U("sev_" + d.severity)) + "</span>" +
      d.system.map(function (s) { var c = DS.category(s); return '<span class="tag">' + c.icon + " " + esc(L(c.name)) + "</span>"; }).join("") + "</div>";
    h += '<div class="dtabs">' + TABS.map(function (k) { return '<button data-act="tab:' + k + '" class="' + (tab === k ? "on" : "") + '">' + esc(t("t_" + k)) + "</button>"; }).join("") + "</div>";
    return h + { over: tOver, diag: tDiag, elec: tElec, rep: tRep, ver: tVer }[tab](d);
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
    if (procs.length) h += block(t("procs"), procs.map(ui.procFold).join(""));
    return h;
  }
  function tVer(d) {
    var h = block(U("verify"), list(d.verify, true));
    if (d.related.length) h += block(U("related"), '<div class="chips">' + d.related.map(function (c) { return '<a class="chip code" href="#/dtc/' + c + '">' + c + "</a>"; }).join("") + "</div>");
    return h;
  }

  /* ---------- reading a code aloud ---------- */
  var speakText = "", spokenFor = null;
  function speakBtn() { return Voice.canSpeak() ? '<button class="btn" data-act="speak">🔊 ' + esc(t("read_aloud")) + '</button> <span class="dim small" id="speakMsg"></span>' : ""; }
  function sayIt() { Voice.speak(speakText, function (ok) { var m = document.getElementById("speakMsg"); if (m) m.textContent = ok ? "" : "⚠ " + t("voice_none"); }); }
  APP.action("speak", sayIt);
  /* what is read: the code spelled out, its meaning, then up to three causes — in the voice language */
  function setSpeech(code, title, causes) {
    var parts = [Voice.spell(code) + ".", KB.pick(title).text + "."];
    if (causes && causes.length) parts.push(U("causes") + ": " + causes.slice(0, 3).map(function (c) { return KB.pick(c.text || c).text; }).join(". ") + ".");
    speakText = parts.join(" ");
    /* "Read answers aloud" setting: speak once when the page for this code opens, not on every redraw */
    if (Settings.get("speak") && Voice.canSpeak() && spokenFor !== location.hash) { spokenFor = location.hash; setTimeout(sayIt, 150); }
  }

  /* ---------- CODE PAGE ---------- */
  function codePage(raw) {
    var wait = needLib(); if (wait) return wait;
    var v = veh(), r = DTC.resolve(raw, v), d = r.decode;
    var h = '<div class="codehead"><span class="c">' + esc(r.hits.length ? r.hits[0].code : r.code) + "</span></div>";
    if (!r.hits.length) {
      if (!d.valid) return { title: t("dtc_title"), html: '<div style="margin-top:.8rem">' + APP.searchForm(raw) + '</div><div class="lock">🔎 ' + esc(t("not_code")) + "</div>", tab: "dtc" };
      h += '<div class="lock">ℹ️ ' + esc(t("not_in_lib")) + "</div>" + '<div class="card" style="margin-top:.75rem">' + decodeBlock(d) + "</div>";
      if (!d.generic && !v) h += '<div class="notice">' + esc(t("maker_hint")) + '</div><a class="btn pri block" href="#/pick">' + esc(t("choose_vehicle")) + "</a>";
      return { title: r.code, html: h, tab: "dtc" };
    }
    var first = r.hits[0], rest = r.hits.slice(1);
    if (first.layer === "other") {
      /* only other brands know this code: no meaning is "the" answer, so none is shown as the main one */
      h += '<div class="notice">' + esc(v ? t("not_for_brand", { b: DS.vehicleName(v) }) : t("maker_hint")) + "</div>" +
        (v ? "" : '<a class="btn pri block" href="#/pick" style="margin-bottom:.8rem">' + esc(t("choose_vehicle")) + "</a>");
      h += "<h3>" + esc(t("other_meanings")) + " (" + r.hits.length + ")</h3>" + r.hits.map(otherFold).join("");
      if (d.valid) h += fold("🔤 " + t("decode_title"), decodeBlock(d), true);
      return { title: first.code, html: h, tab: "dtc" };
    }
    if (first.layer === "pack") { setSpeech(first.code, first.pack.title, first.pack.causes); h += '<div style="margin:.2rem 0 .4rem">' + speakBtn() + "</div>" + packPage(first.pack); }
    else { setSpeech(first.code, first.entry.rec.t, first.entry.rec.cau); h += libHead(first) + '<div style="margin:.5rem 0 .9rem">' + speakBtn() + "</div>" + libBody(first); }
    if (rest.length) h += "<h3>" + esc(t("other_meanings")) + " (" + rest.length + ")</h3>" + rest.map(otherFold).join("");
    if (d.valid) h += fold("🔤 " + t("decode_title"), decodeBlock(d));
    var title = first.layer === "pack" ? L(first.pack.title) : first.entry.rec.t.en;
    return { title: first.code, sub: title, html: h, tab: "dtc" };
  }

  /* ---------- LOOKUP HOME ---------- */
  var SYSTEMS = ["engine", "transmission", "abs", "srs", "immobilizer", "ecu", "body", "electrical"];
  APP.route("dtc", function (code) {
    if (code) return codePage(code);
    DTC.load(DTC.ready() ? null : APP.render);          // warm the library in the background
    var v = veh(), st = DTC.stats();
    var h = '<div style="margin-top:.8rem">' + APP.searchForm("") + "</div>" + ui.recentChips();
    if (v && DS.hasPack(v)) h += "<h3>🚐 " + esc(t("pack_codes")) + "</h3>" + DS.dtcs().map(packRow).join("");
    if (v && DTC.ready()) {
      var groups = DTC.groupsFor(v);
      if (groups.length) h += "<h3>🏭 " + esc(t("for_vehicle")) + "</h3>" + groups.map(function (g) {
        var c = DS.category(g.sys);
        return APP.bigLink(c ? c.icon : "📄", g.title.split(" — ")[0], t("n_codes", { n: g.count }), "#/dtcgroup/" + g.brand + "/" + g.id);
      }).join("");
    }
    h += "<h3>📚 " + esc(t("browse_title")) + '</h3><div class="chips">' + SYSTEMS.map(function (s) { var c = DS.category(s); return '<a class="chip" href="#/browse/' + s + '">' + c.icon + " " + esc(L(c.name)) + "</a>"; }).join("") + "</div>";
    h += '<p class="dim small">' + esc(st ? t("lib_stats", { g: st.generic, b: st.brand }) : "⏳ " + t("loading")) + "</p>";
    return { title: t("dtc_title"), html: h, tab: "dtc", top: true };
  });

  /* ---------- SEARCH RESULTS (words, flash number, odd code formats) ---------- */
  APP.route("find", function (q) {
    q = q || "";
    var wait = needLib(); if (wait) return wait;
    var v = veh(), h = '<div style="margin-top:.8rem">' + APP.searchForm(q) + "</div>";
    if (DTC.resolve(q, v).hits.length) return APP.redirect("#/dtc/" + encodeURIComponent(DTC.keyOf(q)));   // e.g. "ABS-21"
    if (/^\d{1,3}$/.test(q.trim())) {
      var fl = DTC.byFlash(q.trim(), v);
      h += "<h3>⚡ " + esc(t("flash_results", { n: q.trim() })) + " (" + fl.length + ")</h3>" + (fl.length ? fl.map(function (e) { return entryRow(e, v); }).join("") : '<div class="lock">🔎 ' + esc(U("no_results")) + "</div>");
      return { title: t("dtc_title"), html: h, tab: "dtc" };
    }
    var pack = v && DS.hasPack(v) ? DS.search(q) : { dtcs: [], procedures: [], special: [] }, lib = DTC.search(q, v);
    var packCodes = pack.dtcs.map(function (d) { return d.code; });
    var seen = {};                                             // one row per code; the pack row already covers its code
    lib = lib.filter(function (e) { var k = DTC.keyOf(e.code); if (packCodes.indexOf(k) >= 0 || seen[k]) return false; seen[k] = 1; return true; });
    h += "<h3>" + esc(t("results_for")) + " “" + esc(q) + "”</h3>";
    if (!pack.dtcs.length && !lib.length && !pack.procedures.length && !pack.special.length) h += '<div class="lock">🔎 ' + esc(DTC.isCode(q) ? t("not_in_lib") : t("not_code")) + "</div>";
    h += pack.dtcs.map(packRow).join("") + lib.map(function (e) { return entryRow(e, v); }).join("");
    if (pack.procedures.length) h += "<h3>" + esc(t("procs_found")) + "</h3>" + pack.procedures.map(ui.procFold).join("");
    if (pack.special.length) h += "<h3>" + esc(U("special_title")) + "</h3>" + pack.special.map(ui.specialFold).join("");
    return { title: t("dtc_title"), html: h, tab: "dtc" };
  });

  /* ---------- BROWSE ONE SYSTEM ---------- */
  APP.route("browse", function (sys) {
    var c = DS.category(sys); if (!c) return APP.redirect("#/dtc");
    var wait = needLib(); if (wait) return wait;
    var v = veh(), entries = DTC.browse(sys, v);
    var h = '<p class="dim small" style="margin-top:.8rem">' + esc(t("n_codes", { n: entries.length })) + (v ? " · " + esc(DS.vehicleName(v)) : "") + "</p>";
    if (!v) h += '<div class="notice">' + esc(t("browse_hint")) + "</div>";
    h += entries.length ? entries.map(function (e) { return entryRow(e, v); }).join("") : '<p class="empty">' + esc(U("no_data")) + "</p>";
    return { title: c.icon + " " + L(c.name), sub: t("browse_title"), html: h, tab: "dtc" };
  });

  /* ---------- ONE BRAND CODE GROUP ---------- */
  APP.route("dtcgroup", function (brand, id) {
    var wait = needLib(); if (wait) return wait;
    var g = DTC.group(brand, id); if (!g) return APP.redirect("#/dtc");
    var h = '<div style="margin-top:.8rem"><span class="tag">🏭 ' + esc(g.brandName) + '</span><span class="tag">' + esc(t("n_codes", { n: g.entries.length })) + "</span></div>";
    if (g.steps.length) h += fold("🧭 " + t("sys_checks"), tlist(g.steps, true), true);
    h += g.entries.map(function (e) { return entryRow(e); }).join("");
    if (g.src) h += '<p class="dim small"><b>' + esc(t("source_lbl")) + ":</b> " + esc(g.src) + "</p>";
    return { title: g.title.split(" — ")[0], sub: g.brandName, html: h, tab: "dtc" };
  });

  /* ---------- suggestions while typing ---------- */
  APP.onInput("dtcSearch", function (q, input) {
    var box = input.form && input.form.parentNode.querySelector("[data-suggest]"); if (!box) return;
    var show = function () {
      if (input.value !== q) return;                         // the user kept typing
      var s = DTC.suggest(q, veh(), 8);
      box.innerHTML = s.map(function (x) { return '<a class="sg" href="#/dtc/' + encodeURIComponent(x.code) + '" data-act="recent:' + esc(x.code) + '"><b class="mono">' + esc(x.code) + "</b> " + esc(x.title.en || L(x.title)) + "</a>"; }).join("");
    };
    if (!/^[A-Za-z][0-9A-Za-z]/.test(q.trim())) { box.innerHTML = ""; return; }
    if (DTC.ready()) show(); else DTC.load(show);
  });
  APP.action("recent", function (code) { Settings.addRecent(code); APP.go("#/dtc/" + encodeURIComponent(code)); });
})();
