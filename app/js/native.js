/* =====================================================================
   NATIVE — access to the Android plugins when the app runs inside the APK.

   js/vendor/capacitor.js (the @capacitor/core runtime) is loaded first and every
   plugin is taken by name through registerPlugin, the documented way. Android also
   injects window.Capacitor.Plugins.<Name> objects itself, which 0.5.1 relied on.
   Everything that needs to know "am I inside the app?" asks here, so that browser
   features that only pretend to work inside an Android app are never used there.

     Native.isApp          true inside the installed app, false in a browser
     Native.plugin("App")  the plugin, or null when it is not available
   ===================================================================== */
var Native = (function () {
  var cap = window.Capacitor || null;
  var isApp = !!(cap && typeof cap.isNativePlatform === "function" && cap.isNativePlatform());
  var cache = {};
  function plugin(name) {
    if (!isApp) return null;
    if (name in cache) return cache[name];
    var p = null;
    try { if (cap.isPluginAvailable(name)) p = cap.registerPlugin(name); } catch (e) { p = null; }
    cache[name] = p;
    return p;
  }
  return { isApp: isApp, plugin: plugin };
})();
