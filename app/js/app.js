/* =====================================================================
   APP SHELL — router, header, bottom tabs, shared render helpers.
   Screens live in screens.js / screen-settings.js and register themselves
   with APP.route(name, fn). A screen function returns:
     { title, sub, html, tab, top }
       tab : which bottom tab is highlighted ("home" | "vehicle" | "dtc" | "settings")
       top : true for top-level screens (no back arrow)
   Navigation uses the URL hash (#/dtc/P0087) so the Android back button
   and browser back both work.
   ===================================================================== */
var APP = (function () {
  var DS = KB.DataStore, L = KB.L, esc = KB.esc;
  var VERSION = "0.2.0";
  var CONFIG = {
    feedbackEmail: ""   // address that receives "Report wrong data" (empty = user picks the recipient)
  };

  /* t("key", {n: 3}) → UI text in the current language */
  function t(key, vars) {
    var s = L(I18N[key]) || key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.split("{" + k + "}").join(vars[k]); });
    return s;
  }

  /* ---------- router ---------- */
  var routes = {}, actions = {}, inputs = {};
  var current = null, lastHash = null;
  function route(name, fn) { routes[name] = fn; }
  function action(name, fn) { actions[name] = fn; }     // click on [data-act="name:arg"]
  function onInput(name, fn) { inputs[name] = fn; }      // typing in [data-input="name"]
  function parse() {
    var parts = (location.hash || "").replace(/^#\/?/, "").split("/").map(function (p) {
      try { return decodeURIComponent(p); } catch (e) { return p; }
    });
    return { name: parts[0] || "home", args: parts.slice(1) };
  }
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
  /* redirect without leaving a history entry (so Back does not bounce) */
  function redirect(hash) { location.replace(location.pathname + location.search + hash); return { html: "" }; }
  function back() { if (history.length > 1) history.back(); else go("#/home"); }

  function render() {
    var first = !Settings.get("lang");
    document.body.classList.toggle("first", first);
    var r = parse();
    var fn = first ? routes.first : (routes[r.name] || routes.home);
    current = fn.apply(null, r.args) || {};
    document.getElementById("main").innerHTML = current.html || "";
    document.getElementById("htitle").innerHTML = esc(current.title || t("app_name")) + (current.sub ? "<small>" + esc(current.sub) + "</small>" : "");
    var b = document.getElementById("back"); b.hidden = !!current.top; b.setAttribute("aria-label", t("back"));
    renderTabs(current.tab);
    document.title = (current.title ? current.title + " · " : "") + t("app_name");
    if (location.hash !== lastHash) { window.scrollTo(0, 0); lastHash = location.hash; }
  }
  function renderTabs(active) {
    var vid = Settings.get("vehicleId");
    var tabs = [
      ["home", "🏠", "#/home"],
      ["vehicle", "🚐", vid && DS.vehicle(vid) ? "#/vehicle/" + vid : "#/pick"],
      ["dtc", "🔎", "#/dtc"],
      ["settings", "⚙️", "#/settings"]
    ];
    document.getElementById("tabsIn").innerHTML = tabs.map(function (x) {
      return '<a href="' + x[2] + '" class="' + (active === x[0] ? "on" : "") + '"><span>' + x[1] + "</span>" + esc(t("nav_" + x[0])) + "</a>";
    }).join("");
  }

  /* ---------- shared render helpers ---------- */
  function bigLink(icon, title, sub, href, extra) {
    return '<a class="big" href="' + href + '"><span class="ic">' + icon + '</span><span class="tx"><b>' + esc(title) + "</b>" +
      (sub ? "<small>" + esc(sub) + "</small>" : "") + (extra || "") + '</span><span class="arr">›</span></a>';
  }
  function bigAct(icon, title, sub, act, extra) {
    return '<button class="big" data-act="' + esc(act) + '"><span class="ic">' + icon + '</span><span class="tx"><b>' + esc(title) + "</b>" +
      (sub ? "<small>" + esc(sub) + "</small>" : "") + (extra || "") + '</span><span class="arr">›</span></button>';
  }
  /* list of {status,text,level} or plain {en,ta,si} items */
  function list(items, ordered) {
    if (!items || !items.length) return '<p class="pending-val">—</p>';
    var tag = ordered ? "ol" : "ul";
    return "<" + tag + ' class="lst">' + items.map(function (i) {
      return "<li>" + KB.gloss(esc(L(i.text || i))) + (i.status ? " " + KB.badge(i.status, true) : "") +
        (i.level ? '<span class="lv ' + i.level + '">' + esc(KB.U(i.level)) + "</span>" : "") + "</li>";
    }).join("") + "</" + tag + ">";
  }
  function block(title, body) { return '<div class="blk"><h4>' + esc(title) + "</h4>" + body + "</div>"; }
  function fold(title, body, open) { return '<details class="x"' + (open ? " open" : "") + "><summary>" + esc(title) + "</summary><div>" + body + "</div></details>"; }
  function searchForm(value) {
    return '<form class="sbox" data-search="1"><span>🔍</span><input name="q" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="' +
      esc(KB.U("search_ph")) + '" value="' + esc(value || "") + '"><button class="btn pri">' + esc(t("search")) + "</button></form>";
  }
  function vehicleTag(v) {
    return DS.hasPack(v) ? '<span class="tag sample">◇ ' + esc(t("tag_sample")) + "</span>" : '<span class="tag planned">' + esc(t("tag_planned")) + "</span>";
  }

  /* ---------- events ---------- */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]"); if (!el) return;
    var raw = el.getAttribute("data-act"), i = raw.indexOf(":");
    var name = i < 0 ? raw : raw.slice(0, i), arg = i < 0 ? "" : raw.slice(i + 1);
    if (actions[name]) { e.preventDefault(); actions[name](arg, el); }
  });
  document.addEventListener("input", function (e) {
    var name = e.target.getAttribute && e.target.getAttribute("data-input");
    if (name && inputs[name]) inputs[name](e.target.value, e.target);
  });
  document.addEventListener("submit", function (e) {
    if (!e.target.hasAttribute("data-search")) return;
    e.preventDefault();
    var q = (e.target.elements.q.value || "").trim(); if (!q) return;
    if (DS.dtc(q)) { Settings.addRecent(q); go("#/dtc/" + q.toUpperCase()); }
    else { if (DS.looksLikeDTC(q)) Settings.addRecent(q); go("#/find/" + encodeURIComponent(q)); }
  });
  document.getElementById("back").addEventListener("click", back);
  window.addEventListener("hashchange", render);
  Settings.onChange(render);   // language / level / theme etc. → redraw, scroll position is kept

  /* set="key:value" buttons used all over Settings */
  action("set", function (arg) {
    var i = arg.indexOf(":"), key = arg.slice(0, i), v = arg.slice(i + 1);
    if (v === "true") v = true; else if (v === "false") v = false;
    Settings.set(key, v);
  });

  /* Android hardware back button (only inside the installed app) */
  (function () {
    var cap = window.Capacitor, plugin = cap && cap.Plugins && cap.Plugins.App;
    if (!plugin || !plugin.addListener) return;
    plugin.addListener("backButton", function () {
      if (!current || !current.top) back();
      else if (parse().name !== "home") go("#/home");
      else plugin.exitApp();
    });
  })();

  return {
    VERSION: VERSION, CONFIG: CONFIG, t: t, route: route, action: action, onInput: onInput, go: go, redirect: redirect, render: render, parse: parse,
    bigLink: bigLink, bigAct: bigAct, list: list, block: block, fold: fold, searchForm: searchForm, vehicleTag: vehicleTag
  };
})();
