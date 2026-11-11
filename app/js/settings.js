/* =====================================================================
   SETTINGS — every user preference lives here, saved on the device.
   Other code reads with Settings.get("key") and reacts via onChange().
   ===================================================================== */
var Settings = (function () {
  var KEY = "es_settings_v1";
  var DEFAULTS = {
    lang: null,          // "en" | "ta" | "si"  (null = first launch, ask the user)
    level: "beginner",   // "beginner" | "advanced"
    textSize: "m",       // "s" | "m" | "l"
    theme: "auto",       // "auto" | "dark" | "light"
    units: "metric",     // "metric" | "imperial"
    voiceLang: "app",    // "app" | "en" | "ta" | "si"
    speak: false,        // read answers aloud
    vehicleId: null,     // the mechanic's current vehicle
    favorites: [],       // vehicle ids
    recent: []           // recently searched codes, newest first
  };
  var MAX_RECENT = 10;
  var state = load();
  var listeners = [];

  function load() {
    var s = {};
    try { s = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { s = {}; }
    var out = {};
    Object.keys(DEFAULTS).forEach(function (k) {
      out[k] = s[k] !== undefined ? s[k] : (Array.isArray(DEFAULTS[k]) ? [] : DEFAULTS[k]);
    });
    /* ids changed when the full vehicle catalogue arrived (app 0.4): keep the user's vehicle */
    var RENAMED = { toyota_hiace_kdh_2013_1kdftv: "toyota~hiace~2000-2016-1kd-ftv" };
    var fix = function (id) { return RENAMED[id] || (id && id.indexOf("~") < 0 ? null : id); };
    out.vehicleId = fix(out.vehicleId);
    out.favorites = out.favorites.map(fix).filter(Boolean);
    return out;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  /* push theme / text size / language onto <html> so CSS can react */
  function apply() {
    var root = document.documentElement;
    if (state.theme === "auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", state.theme);
    root.setAttribute("data-text", state.textSize);
    root.lang = state.lang || "en";
  }
  function notify(key) { listeners.forEach(function (fn) { fn(key); }); }

  function get(key) { return state[key]; }
  function set(key, value) {
    if (!(key in DEFAULTS)) return;
    state[key] = value; save(); apply(); notify(key);
  }
  function reset() {
    var keepLang = state.lang;
    Object.keys(DEFAULTS).forEach(function (k) { state[k] = Array.isArray(DEFAULTS[k]) ? [] : DEFAULTS[k]; });
    state.lang = keepLang;   // do not send the user back to the language screen
    save(); apply(); notify("*");
  }

  function addRecent(code) {
    code = String(code || "").toUpperCase().trim(); if (!code) return;
    state.recent = [code].concat(state.recent.filter(function (c) { return c !== code; })).slice(0, MAX_RECENT);
    save(); notify("recent");
  }
  function clearRecent() { state.recent = []; save(); notify("recent"); }
  function isFavorite(id) { return state.favorites.indexOf(id) >= 0; }
  function toggleFavorite(id) {
    state.favorites = isFavorite(id) ? state.favorites.filter(function (x) { return x !== id; }) : state.favorites.concat([id]);
    save(); notify("favorites");
  }

  apply();
  return {
    get: get, set: set, reset: reset, onChange: function (fn) { listeners.push(fn); },
    addRecent: addRecent, clearRecent: clearRecent, isFavorite: isFavorite, toggleFavorite: toggleFavorite
  };
})();
