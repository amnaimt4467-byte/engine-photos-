/* =====================================================================
   KB CORE — data access + shared helpers (started as samples/src/kb-core.js)
   - DataStore: the ONLY place the UI reads data from. Today it reads the
     inline KB_DATA object; later swap the bodies for Firebase/Firestore
     calls (same method names, same return shapes) without touching UI.
   - Language: taken from Settings (js/settings.js must load first)
   - Status badges: published / general / example / pending
   ===================================================================== */
var KB = (function () {
  var LANGS = [
    { id: "en", label: "English", short: "EN", flag: "🇬🇧", bcp47: "en-US" },
    { id: "ta", label: "தமிழ்", short: "த", flag: "🇱🇰", bcp47: "ta-IN" },
    { id: "si", label: "සිංහල", short: "සි", flag: "🇱🇰", bcp47: "si-LK" }
  ];

  /* ---------- language (stored in Settings) ---------- */
  var lang = Settings.get("lang") || "en";
  Settings.onChange(function () { lang = Settings.get("lang") || "en"; });
  function setLang(l) { Settings.set("lang", l); }
  function getLang() { return lang; }

  /* L(obj): pick current language with English fallback */
  function L(obj) {
    if (obj == null) return "";
    if (typeof obj === "string") return obj;
    return obj[lang] || obj.en || obj.ta || obj.si || "";
  }
  /* pick(obj) → { text, lang }: like L() but also says which language was really used,
     so the screen can mark text that is not yet translated into the user's language */
  function pick(obj) {
    if (obj == null) return { text: "", lang: lang };
    if (typeof obj === "string") return { text: obj, lang: lang };
    var order = [lang, "en", "ta", "si"];
    for (var i = 0; i < order.length; i++) if (obj[order[i]]) return { text: obj[order[i]], lang: order[i] };
    return { text: "", lang: lang };
  }

  /* common UI strings shared by every layout */
  var UI = {
    search_ph: { en: "Enter DTC code or keyword (e.g. P0087, rail pressure)", ta: "DTC code அல்லது சொல் (எ.கா. P0087, rail pressure)", si: "DTC code හෝ වචනය (උදා. P0087, rail pressure)" },
    no_results: { en: "No matching records in the sample data.", ta: "மாதிரி டேட்டாவில் பொருந்தும் பதிவு இல்லை.", si: "සාම්පල දත්තවල ගැළපෙන වාර්තා නැත." },
    dtc: { en: "DTC Code", ta: "DTC Code", si: "DTC Code" },
    description: { en: "Fault Description", ta: "பழுது விளக்கம்", si: "දෝෂ විස්තරය" },
    system: { en: "Affected System", ta: "பாதிக்கப்பட்ட அமைப்பு", si: "බලපෑමට ලක් වූ පද්ධතිය" },
    causes: { en: "Possible Causes", ta: "சாத்தியமான காரணங்கள்", si: "විය හැකි හේතු" },
    symptoms: { en: "Symptoms", ta: "அறிகுறிகள்", si: "රෝග ලක්ෂණ" },
    diagnosis: { en: "Diagnostic Procedure", ta: "கண்டறியும் முறை", si: "රෝග විනිශ්චය ක්‍රමය" },
    wiring: { en: "Wiring Inspection", ta: "வயரிங் சோதனை", si: "වයරින් පරීක්ෂාව" },
    pins: { en: "Connector & Pin Details", ta: "Connector & Pin விவரம்", si: "Connector සහ Pin විස්තර" },
    sensor: { en: "Sensor Testing Method", ta: "சென்சார் சோதனை முறை", si: "සංවේදක පරීක්ෂා ක්‍රමය" },
    meter: { en: "Multimeter Values (vehicle-specific)", ta: "மல்டிமீட்டர் மதிப்புகள் (வாகனத்திற்கு உரியது)", si: "මල්ටිමීටර අගයන් (වාහනයට විශේෂිත)" },
    scanner: { en: "Scanner Testing Method", ta: "Scanner சோதனை முறை", si: "Scanner පරීක්ෂා ක්‍රමය" },
    repair: { en: "Repair Procedure", ta: "ரிப்பேர் முறை", si: "අලුත්වැඩියා ක්‍රමය" },
    parts: { en: "Parts Information", ta: "பாகங்கள் தகவல்", si: "කොටස් තොරතුරු" },
    verify: { en: "After-Repair Verification", ta: "ரிப்பேருக்கு பின் சரிபார்ப்பு", si: "අලුත්වැඩියාවෙන් පසු තහවුරු කිරීම" },
    related: { en: "Related DTC Codes", ta: "தொடர்புடைய DTC Codes", si: "අදාළ DTC Codes" },
    safety: { en: "Safety Warning", ta: "பாதுகாப்பு எச்சரிக்கை", si: "ආරක්ෂක අනතුරු ඇඟවීම" },
    applic: { en: "Applicability", ta: "பொருந்தும் தன்மை", si: "අදාළත්වය" },
    item: { en: "Item", ta: "பொருள்", si: "අයිතමය" },
    connector: { en: "Connector", ta: "Connector", si: "Connector" },
    pin: { en: "Pin", ta: "Pin", si: "Pin" },
    ecm_pin: { en: "ECM pin", ta: "ECM pin", si: "ECM pin" },
    test: { en: "Test", ta: "சோதனை", si: "පරීක්ෂාව" },
    expected: { en: "Expected", ta: "எதிர்பார்க்கும் மதிப்பு", si: "අපේක්ෂිත අගය" },
    part_no: { en: "Part No.", ta: "பாக எண்", si: "කොටස් අංකය" },
    beginner: { en: "Beginner", ta: "ஆரம்ப நிலை", si: "ආරම්භක" },
    advanced: { en: "Advanced", ta: "மேம்பட்ட நிலை", si: "උසස්" },
    scanner_req: { en: "Scanner required", ta: "Scanner தேவை", si: "Scanner අවශ්‍යයි" },
    scanner_no: { en: "No scanner needed", ta: "Scanner தேவையில்லை", si: "Scanner අවශ්‍ය නැත" },
    scanner_maybe: { en: "Depends on vehicle", ta: "வாகனத்தைப் பொறுத்தது", si: "වාහනය අනුව" },
    time: { en: "Time", ta: "நேரம்", si: "කාලය" },
    tools: { en: "Tools", ta: "கருவிகள்", si: "මෙවලම්" },
    steps: { en: "Steps", ta: "படிகள்", si: "පියවර" },
    why: { en: "Why / when", ta: "ஏன் / எப்போது", si: "ඇයි / කවදා" },
    severity: { en: "Severity", ta: "தீவிரம்", si: "බරපතලකම" },
    sev_high: { en: "High", ta: "அதிகம்", si: "ඉහළ" },
    sev_medium: { en: "Medium", ta: "நடுத்தரம்", si: "මධ්‍යම" },
    sev_low: { en: "Low", ta: "குறைவு", si: "අඩු" },
    specs: { en: "Engine Specifications", ta: "எஞ்சின் விவரக்குறிப்புகள்", si: "එන්ජින් පිරිවිතර" },
    manual_title: { en: "Manual Diagnosis (No Scanner)", ta: "Scanner இல்லாமல் கண்டறிதல்", si: "Scanner නොමැතිව රෝග විනිශ්චය" },
    special_title: { en: "Special Functions & Resets", ta: "சிறப்பு செயல்பாடுகள் & Reset", si: "විශේෂ කාර්යයන් සහ Reset" },
    manual_ok: { en: "Manual testing is possible for", ta: "Scanner இல்லாமல் செய்யக்கூடியவை", si: "Scanner නොමැතිව කළ හැකි දේ" },
    scanner_needed: { en: "A scanner is necessary for", ta: "Scanner கட்டாயம் தேவைப்படுபவை", si: "Scanner අනිවාර්යයෙන් අවශ්‍ය දේ" },
    glossary: { en: "Glossary — terms explained", ta: "சொல் விளக்கம்", si: "පද විවරණය" },
    no_data: { en: "No records yet for this category — structure is ready for data.", ta: "இந்த பிரிவில் இன்னும் பதிவுகள் இல்லை — டேட்டா சேர்க்க அமைப்பு தயார்.", si: "මෙම කාණ්ඩයේ තවම වාර්තා නැත — දත්ත සඳහා ව්‍යුහය සූදානම්." },
    pending_val: { en: "Not yet verified — add from Toyota RM", ta: "இன்னும் சரிபார்க்கவில்லை — Toyota RM-இல் இருந்து சேர்க்கவும்", si: "තවම තහවුරු කර නැත — Toyota RM වෙතින් එක් කරන්න" },
    legend: { en: "Data status", ta: "டேட்டா நிலை", si: "දත්ත තත්ත්වය" },
    no_bypass: { en: "This app never provides immobilizer bypass or unauthorized key access. Only manufacturer-approved registration and reset methods are listed.", ta: "இந்த app immobilizer bypass அல்லது அங்கீகரிக்கப்படாத key access-ஐ ஒருபோதும் வழங்காது. உற்பத்தியாளர் அங்கீகரித்த பதிவு / reset முறைகள் மட்டுமே.", si: "මෙම app එක කිසිවිටෙක immobilizer bypass හෝ අනවසර key access ලබා නොදේ. නිෂ්පාදක අනුමත ලියාපදිංචි / reset ක්‍රම පමණි." }
  };
  function U(key) { return L(UI[key]) || key; }

  /* ---------- status badges ---------- */
  var STATUS = {
    published: { cls: "st-pub", icon: "✔", label: { en: "Published spec", ta: "வெளியிடப்பட்ட தகவல்", si: "ප්‍රකාශිත පිරිවිතර" }, tip: { en: "Standard definition or widely published specification.", ta: "நிலையான வரையறை அல்லது பரவலாக வெளியிடப்பட்ட தகவல்.", si: "සම්මත අර්ථ දැක්වීම හෝ පුළුල්ව ප්‍රකාශිත පිරිවිතර." } },
    general:   { cls: "st-gen", icon: "ⓘ", label: { en: "General guidance", ta: "பொது வழிகாட்டல்", si: "සාමාන්‍ය මාර්ගෝපදේශ" }, tip: { en: "General workshop practice — not specific to this vehicle.", ta: "பொது workshop நடைமுறை — இந்த வாகனத்திற்கு மட்டும் உரியதல்ல.", si: "සාමාන්‍ය workshop පිළිවෙත — මෙම වාහනයට විශේෂිත නොවේ." } },
    example:   { cls: "st-ex",  icon: "◇", label: { en: "Illustrative example", ta: "உதாரணம் மட்டும்", si: "නිදර්ශන උදාහරණය" }, tip: { en: "Layout example only.", ta: "வடிவமைப்பு உதாரணம் மட்டும்.", si: "පිරිසැලසුම් උදාහරණය පමණි." } },
    sourced:   { cls: "st-src", icon: "📄", label: { en: "Cited source", ta: "மேற்கோள் மூலம்", si: "උපුටා දැක්වූ මූලාශ්‍රය" }, tip: { en: "Taken from a cited source; not yet checked against the official manual for your vehicle.", ta: "குறிப்பிட்ட மூலத்திலிருந்து எடுக்கப்பட்டது; உங்கள் வாகனத்தின் அதிகாரப்பூர்வ manual-உடன் இன்னும் சரிபார்க்கப்படவில்லை.", si: "උපුටා දැක්වූ මූලාශ්‍රයකින් ගන්නා ලදී; ඔබේ වාහනයේ නිල manual එක සමඟ තවම පරීක්ෂා කර නැත." } },
    pending:   { cls: "st-pend", icon: "⚠", label: { en: "Needs verification", ta: "சரிபார்க்க வேண்டும்", si: "තහවුරු කළ යුතුයි" }, tip: { en: "Vehicle-specific — intentionally empty until taken from the official repair manual.", ta: "வாகனத்திற்கு உரியது — அதிகாரப்பூர்வ repair manual-இல் இருந்து எடுக்கும் வரை காலியாக.", si: "වාහනයට විශේෂිතයි — නිල repair manual එකෙන් ගන්නා තුරු හිස්ව." } }
  };
  function badge(status, compact) {
    var s = STATUS[status] || STATUS.example;
    return '<span class="st ' + s.cls + '" title="' + esc(L(s.tip)) + '">' + s.icon +
      (compact ? "" : " " + esc(L(s.label))) + "</span>";
  }
  function legendHTML() {
    return Object.keys(STATUS).map(function (k) {
      return '<span class="legend-item">' + badge(k) + '<small>' + esc(L(STATUS[k].tip)) + "</small></span>";
    }).join("");
  }
  /* value cell: shows the value or a clear "pending" marker — never a guess */
  function val(v, status) {
    if (status === "pending" || v === "" || v == null) {
      return '<span class="pending-val">⚠ ' + esc(U("pending_val")) + "</span>";
    }
    return esc(v);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- DataStore (swap for Firebase later) ---------- */
  var D = KB_DATA;
  function byId(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; }
  function textOf(o) { /* all languages flattened, for search */
    if (!o) return "";
    if (typeof o === "string") return o;
    if (o.en || o.ta || o.si) return [o.en, o.ta, o.si].join(" ");
    if (Array.isArray(o)) return o.map(textOf).join(" ");
    if (typeof o === "object") return Object.keys(o).map(function (k) { return textOf(o[k]); }).join(" ");
    return "";
  }

  var DataStore = {
    meta: function () { return D.meta; },
    vehicles: function () { return D.vehicles; },
    vehicle: function (id) { return byId(D.vehicles, id); },
    hasPack: function (v) { return !!(v && v.pack); },
    vehicleName: function (v) { return v ? [v.make, v.model].join(" ") : ""; },
    vehicleLine: function (v) { return v ? [v.chassis, v.year, v.engine, v.fuel].filter(Boolean).join(" · ") : ""; },
    /* picker: vehicles matching the choices made so far, e.g. {make:"Toyota", model:"Hilux"} */
    vehiclesWhere: function (sel) {
      return D.vehicles.filter(function (v) {
        return Object.keys(sel).every(function (k) { return String(v[k]) === String(sel[k]); });
      });
    },
    /* picker: free-text search over make / model / chassis / engine / year */
    findVehicles: function (q) {
      var words = String(q || "").toLowerCase().split(/\s+/).filter(Boolean);
      if (!words.length) return [];
      return D.vehicles.filter(function (v) {
        var hay = [v.make, v.model, v.chassis, v.engine, v.year].join(" ").toLowerCase();
        return words.every(function (w) { return hay.indexOf(w) >= 0; });
      });
    },
    categories: function () { return D.categories; },
    category: function (id) { return byId(D.categories, id); },
    dtcs: function () { return D.dtcs; },
    dtc: function (code) { return byId(D.dtcs, String(code || "").toUpperCase().trim()); },
    dtcsBySystem: function (sys) { return D.dtcs.filter(function (d) { return d.system.indexOf(sys) >= 0; }); },
    procedures: function () { return D.procedures; },
    procedure: function (id) { return byId(D.procedures, id); },
    proceduresBySystem: function (sys) { return D.procedures.filter(function (p) { return p.system === sys; }); },
    specialFunctions: function () { return D.specialFunctions; },
    specialBySystem: function (sys) { return D.specialFunctions.filter(function (s) { return s.group === sys; }); },
    manualTests: function () { return D.manualTests; },
    scannerGuide: function () { return D.scannerGuide; },
    symptoms: function () { return D.symptoms; },
    glossary: function () { return D.glossary; },
    /* counts per category, for dashboards */
    categoryCounts: function (sys) {
      var n = { dtc: this.dtcsBySystem(sys).length, proc: this.proceduresBySystem(sys).length, special: this.specialBySystem(sys).length };
      if (sys === "repair") n.proc = D.procedures.length;
      if (sys === "special") n.special = D.specialFunctions.length;
      return n;
    },
    /* search: exact DTC first, then code prefix, then keyword in any language */
    search: function (q) {
      q = String(q || "").trim();
      if (!q) return { dtcs: [], procedures: [], special: [] };
      var up = q.toUpperCase(), low = q.toLowerCase();
      var exact = D.dtcs.filter(function (d) { return d.code === up; });
      var prefix = D.dtcs.filter(function (d) { return d.code !== up && d.code.indexOf(up) === 0; });
      var kw = D.dtcs.filter(function (d) {
        return exact.indexOf(d) < 0 && prefix.indexOf(d) < 0 && textOf([d.title, d.meaning, d.causes, d.symptoms]).toLowerCase().indexOf(low) >= 0;
      });
      return {
        dtcs: exact.concat(prefix, kw),
        procedures: D.procedures.filter(function (p) { return textOf([p.title, p.steps]).toLowerCase().indexOf(low) >= 0 || p.relatedDtc.indexOf(up) >= 0; }),
        special: D.specialFunctions.filter(function (s) { return textOf([s.title, s.why]).toLowerCase().indexOf(low) >= 0; })
      };
    },
    looksLikeDTC: function (q) { return /^[PBCU][0-9A-F]{4}$/i.test(String(q || "").trim()); }
  };

  /* glossary auto-linking: wraps known terms with a tooltip */
  function gloss(html) {
    D.glossary.forEach(function (g) {
      var re = new RegExp("\\b(" + g.term.replace(/[-]/g, "\\-") + ")\\b");
      html = html.replace(re, '<abbr class="gl" title="' + esc(L(g.text)) + '">$1</abbr>');
    });
    return html;
  }

  /* ---------- units (Settings: metric / imperial) ----------
     Data is stored in metric. convert(value, "Nm" | "MPa" | "C" | "L") returns
     display text in the unit system the mechanic chose. */
  var UNIT = {
    Nm:  { metric: ["N·m", 1, 0],  imperial: ["lb·ft", 0.737562, 0] },
    MPa: { metric: ["MPa", 1, 0],  imperial: ["psi", 145.038, 0] },
    kPa: { metric: ["kPa", 1, 0],  imperial: ["psi", 0.145038, 0] },
    C:   { metric: ["°C", 1, 0],   imperial: ["°F", 1.8, 32] },
    L:   { metric: ["L", 1, 0],    imperial: ["US qt", 1.05669, 0] },
    mm:  { metric: ["mm", 1, 0],   imperial: ["in", 0.0393701, 0] }
  };
  function convert(value, unit) {
    var sys = Settings.get("units") === "imperial" ? "imperial" : "metric";
    var u = UNIT[unit]; if (!u) return value + " " + unit;
    var n = value * u[sys][1] + u[sys][2];
    var digits = Math.abs(n) >= 100 ? 0 : Math.abs(n) >= 10 ? 1 : 2;
    return Number(n.toFixed(digits)).toLocaleString("en-US") + " " + u[sys][0];
  }

  return {
    LANGS: LANGS, setLang: setLang, getLang: getLang,
    L: L, pick: pick, U: U, UI: UI, badge: badge, legendHTML: legendHTML, val: val, esc: esc, gloss: gloss,
    STATUS: STATUS, DataStore: DataStore, convert: convert
  };
})();
