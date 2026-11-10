/* =====================================================================
   SETTINGS SCREEN — language, level, text size, appearance, units, voice,
   my vehicles, recent searches, offline data, report wrong data, about.
   Every control writes through Settings.set(), which redraws the app.
   ===================================================================== */
(function () {
  var DS = KB.DataStore, L = KB.L, esc = KB.esc, t = APP.t;

  /* segmented control: seg("theme", [["auto","Auto"],["dark","Dark"]]) */
  function seg(key, options) {
    var cur = Settings.get(key);
    return '<div class="seg">' + options.map(function (o) {
      return '<button data-act="set:' + key + ":" + o[0] + '" class="' + (String(cur) === String(o[0]) ? "on" : "") + '" aria-pressed="' + (String(cur) === String(o[0])) + '">' + esc(o[1]) + "</button>";
    }).join("") + "</div>";
  }
  function card(icon, title, hint, body) {
    return '<div class="card set"><h3>' + icon + " " + esc(title) + "</h3>" + (hint ? '<p class="hint">' + esc(hint) + "</p>" : "") + body + "</div>";
  }

  APP.route("settings", function () {
    var h = '<div style="margin-top:.8rem"></div>';

    h += card("🌐", t("s_lang"), "", seg("lang", KB.LANGS.map(function (l) { return [l.id, l.label]; })));
    h += card("🎓", t("s_level"), t("s_level_hint"), seg("level", [["beginner", "🟢 " + KB.U("beginner")], ["advanced", "🟡 " + KB.U("advanced")]]));
    h += card("🔠", t("s_text"), "", seg("textSize", [["s", t("text_s")], ["m", t("text_m")], ["l", t("text_l")]]));
    h += card("🌗", t("s_theme"), "", seg("theme", [["auto", t("theme_auto")], ["dark", t("theme_dark")], ["light", t("theme_light")]]));
    h += card("📏", t("s_units"), "", seg("units", [["metric", t("units_metric")], ["imperial", t("units_imperial")]]) +
      '<p class="hint" style="margin:.6rem 0 0">' + esc(t("units_example")) + ': <span class="mono">' +
      esc([KB.convert(100, "Nm"), KB.convert(180, "MPa"), KB.convert(90, "C")].join(" · ")) + "</span></p>");

    /* voice */
    h += card("🔊", t("s_voice"), t("voice_note"),
      '<div class="sub">' + esc(t("s_voice_lang")) + "</div>" +
      seg("voiceLang", [["app", t("voice_app")]].concat(KB.LANGS.map(function (l) { return [l.id, l.label]; }))) +
      '<div class="sub">' + esc(t("s_speak")) + "</div>" + seg("speak", [[false, t("off")], [true, t("on")]]) +
      '<div class="row" style="margin-top:.75rem"><button class="btn" data-act="voiceTest">▶ ' + esc(t("voice_test")) + '</button></div><p class="hint" id="voiceMsg" style="margin:.5rem 0 0"></p>');

    /* my vehicles */
    var favs = Settings.get("favorites").map(DS.vehicle).filter(Boolean);
    h += card("⭐", t("s_myveh"), "", favs.length ? favs.map(function (v) {
      return '<div class="line"><a class="tx" href="#/vehicle/' + v.id + '"><b>' + esc(DS.vehicleName(v)) + "</b><small>" + esc(DS.vehicleLine(v)) + '</small></a><button class="btn" data-act="fav:' + v.id + '">' + esc(t("remove")) + "</button></div>";
    }).join("") : '<p class="hint" style="margin:0">' + esc(t("none_yet")) + "</p>");

    /* recent searches */
    var rec = Settings.get("recent");
    h += card("🕘", t("recent"), "", rec.length
      ? '<div class="chips" style="margin-top:0">' + rec.map(function (c) { return '<span class="chip code">' + esc(c) + "</span>"; }).join("") + '</div><button class="btn" data-act="clearRecent">' + esc(t("clear")) + "</button>"
      : '<p class="hint" style="margin:0">' + esc(t("none_yet")) + "</p>");

    /* offline data */
    var packs = DS.vehicles().filter(DS.hasPack), st = DTC.stats();
    if (!st) DTC.load(APP.render);                       // show the library line as soon as it is loaded
    h += card("📦", t("s_data"), t("s_data_note"),
      '<div class="line"><div class="tx"><b>' + esc(t("data_lib")) + "</b><small>" + esc(st ? t("lib_stats", { g: st.generic, b: st.brand }) + " (" + st.version + ")" : "⏳ " + t("loading")) + "</small></div></div>" +
      packs.map(function (v) {
      return '<div class="line"><div class="tx"><b>' + esc(DS.vehicleName(v)) + "</b><small>" + esc(DS.vehicleLine(v)) + "<br>" +
        esc(t("data_records", { d: DS.dtcs().length, p: DS.procedures().length, s: DS.specialFunctions().length })) + "</small></div>" + APP.vehicleTag(v) + "</div>";
    }).join(""));

    /* report wrong data */
    h += card("✉️", t("s_report"), t("s_report_hint"), '<button class="btn block" data-act="report">' + esc(t("report_send")) + "</button>");

    /* about */
    h += card("ℹ️", t("s_about"), "",
      "<p>" + esc(t("disclaimer")) + '</p><div class="sub">' + esc(t("legend")) + "</div>" + KB.legendHTML() +
      '<p class="hint" style="margin:.8rem 0 0">' + esc(t("app_name")) + " · " + esc(t("version")) + " " + APP.VERSION + " · data " + esc(DS.meta().version) + "</p>");

    h += '<button class="btn danger block" data-act="resetAll" style="margin-bottom:1rem">' + esc(t("s_reset")) + "</button>";
    return { title: t("s_title"), html: h, tab: "settings", top: true };
  });

  APP.action("clearRecent", function () { Settings.clearRecent(); });
  APP.action("resetAll", function () { if (window.confirm(t("reset_confirm"))) Settings.reset(); });

  /* speak a short sentence with the phone's own text-to-speech */
  APP.action("voiceTest", function () {
    var msg = document.getElementById("voiceMsg");
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") { if (msg) msg.textContent = "⚠ " + t("voice_none"); return; }
    var id = Settings.get("voiceLang") === "app" ? KB.getLang() : Settings.get("voiceLang");
    var lang = KB.LANGS.filter(function (l) { return l.id === id; })[0] || KB.LANGS[0];
    var u = new SpeechSynthesisUtterance(I18N.voice_sample[lang.id] || I18N.voice_sample.en);
    u.lang = lang.bcp47;
    u.onerror = function () { if (msg) msg.textContent = "⚠ " + t("voice_none"); };
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    if (msg) msg.textContent = "🔊 " + lang.label + " (" + lang.bcp47 + ")";
  });

  /* opens the phone's mail app with the details already filled in */
  APP.action("report", function () {
    var v = DS.vehicle(Settings.get("vehicleId")), rec = Settings.get("recent");
    var body = [
      "What is wrong / what should it say:", "", "",
      "---",
      "App version: " + APP.VERSION + " (data " + DS.meta().version + ")",
      "Language: " + KB.getLang(),
      "Vehicle: " + (v ? DS.vehicleName(v) + " " + DS.vehicleLine(v) : "-"),
      "Last code searched: " + (rec[0] || "-")
    ].join("\n");
    location.href = "mailto:" + encodeURIComponent(APP.CONFIG.feedbackEmail) + "?subject=" + encodeURIComponent(t("report_subject")) + "&body=" + encodeURIComponent(body);
  });
})();
