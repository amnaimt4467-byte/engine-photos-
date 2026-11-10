#!/usr/bin/env node
/* End-to-end check of the app shell in a real (headless) browser.
   Usage:  node tools/test-app.js            (needs Playwright + Chromium)
   Opens app/index.html as a plain file at phone size, drives it like a
   mechanic would, and fails loudly if anything is wrong. */
const path = require("path");
const { chromium } = require("playwright");

const URL = "file://" + path.join(__dirname, "..", "app", "index.html");
const results = [];
let page;

function ok(name, cond, detail) {
  results.push({ name, pass: !!cond, detail });
  console.log((cond ? "  ✓ " : "  ✗ ") + name + (cond || !detail ? "" : "   → " + detail));
}
const hash = () => page.evaluate(() => location.hash);
const text = (sel) => page.evaluate((s) => (document.querySelector(s) || {}).innerText || "", sel);
const setting = (k) => page.evaluate((key) => Settings.get(key), k);
const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
async function goto(h) { await page.evaluate((x) => { location.hash = x; }, h); await page.waitForTimeout(80); }
async function click(sel) { await page.click(sel); await page.waitForTimeout(80); }

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  page = await ctx.newPage();
  const errors = [], external = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("request", (r) => { if (!r.url().startsWith("file://")) external.push(r.url()); });
  page.on("dialog", (d) => d.accept());

  console.log("First launch");
  await page.goto(URL);
  ok("language screen is shown first", await page.evaluate(() => document.body.classList.contains("first")));
  ok("three language buttons", (await page.$$('[data-act^="set:lang:"]')).length === 3);
  await click('[data-act="set:lang:ta"]');
  ok("choosing Tamil opens Home in Tamil", (await text("#main")).includes("என் வாகனம்") && !(await page.evaluate(() => document.body.classList.contains("first"))));
  await page.reload();
  ok("language is remembered after restart", (await setting("lang")) === "ta" && (await text("#main")).includes("என் வாகனம்"));
  await click('[data-act="set:lang:en"]').catch(() => {});
  await page.evaluate(() => Settings.set("lang", "en"));

  console.log("Vehicle picker");
  await goto("#/pick");
  ok("picker starts with makes", (await text("#pickBody")).includes("Toyota") && (await text("#pickBody")).includes("Isuzu"));
  await click('[data-act="pick:make:Toyota"]');
  ok("Toyota → model list", (await text("#pickBody")).includes("HiAce") && (await text("#pickBody")).includes("Hilux"));
  await click('[data-act^="pick:model:HiAce"]');
  ok("HiAce → remaining levels auto-filled → vehicle page", (await hash()) === "#/vehicle/toyota_hiace_kdh_2013_1kdftv", await hash());
  ok("vehicle page shows 17 systems", (await page.$$(".tile")).length === 17);
  await click('[data-act^="set:vehicleId:"]');
  ok("'Use as my vehicle' is saved", (await setting("vehicleId")) === "toyota_hiace_kdh_2013_1kdftv");
  await click('[data-act^="fav:"]');
  ok("vehicle saved to favourites", (await setting("favorites")).length === 1);
  await goto("#/pick");
  await page.fill('[data-input="pickSearch"]', "kdh"); await page.waitForTimeout(80);
  ok("search 'kdh' finds the HiAce", (await page.$$("#pickBody a.big")).length === 1 && (await text("#pickBody")).includes("HiAce"));
  await page.fill('[data-input="pickSearch"]', "zzzz"); await page.waitForTimeout(80);
  ok("search with no match explains itself", (await text("#pickBody")).includes("No vehicle matches"));
  await page.fill('[data-input="pickSearch"]', ""); await page.waitForTimeout(80);
  await click('[data-act="pick:make:Isuzu"]');
  ok("vehicle without a data pack says so", (await hash()) === "#/vehicle/isuzu_dmax_2013_4jj1" && (await text("#main")).includes("not built yet"));

  console.log("Home");
  await goto("#/home");
  ok("home shows my vehicle", (await text("#main")).includes("Toyota HiAce"));

  console.log("Systems + DTC");
  await goto("#/system/toyota_hiace_kdh_2013_1kdftv/fuel");
  ok("fuel system lists P0087", (await text("#main")).includes("P0087"));
  await goto("#/home");
  await page.fill('form[data-search] input', "p0087"); await page.press('form[data-search] input', "Enter"); await page.waitForTimeout(80);
  ok("search p0087 (lower case) opens the code", (await hash()) === "#/dtc/P0087", await hash());
  ok("search is added to recent", (await setting("recent"))[0] === "P0087");
  for (const k of ["diag", "elec", "rep", "ver", "over"]) {
    await click('[data-act="tab:' + k + '"]');
    ok("tab '" + k + "' renders", (await text("#main")).length > 150 && (await overflow()) <= 0, "overflow " + (await overflow()));
  }
  await click('[data-act="tab:diag"]');
  ok("beginner mode hides advanced steps", (await text("#main")).includes("hidden in Beginner mode"));
  await click('[data-act="set:level:advanced"]');
  ok("'Show advanced' switches the level", (await setting("level")) === "advanced" && (await text("#main")).includes("back-leak"));
  await goto("#/dtc/P9999");
  ok("unknown code goes to a clear 'not in the app yet' page", (await hash()) === "#/find/P9999" && (await text("#main")).includes("not in the app yet"), await hash());
  await page.goBack(); await page.waitForTimeout(80);
  ok("Back from an unknown code does not bounce", (await hash()) !== "#/find/P9999" && (await hash()) !== "#/dtc/P9999", await hash());

  console.log("Settings");
  await goto("#/settings");
  await click('[data-act="set:textSize:l"]');
  ok("large text enlarges the page", (await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)) === "19px");
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.emulateMedia({ colorScheme: "dark" });
  const autoOnDarkPhone = await bg();
  await page.emulateMedia({ colorScheme: "light" });
  const autoOnLightPhone = await bg();
  ok("Auto follows the phone (dark phone ≠ light phone)", autoOnDarkPhone !== autoOnLightPhone, autoOnDarkPhone + " vs " + autoOnLightPhone);
  await click('[data-act="set:theme:dark"]');
  ok("Dark setting wins on a light-mode phone", (await bg()) === autoOnDarkPhone, await bg());
  await page.emulateMedia({ colorScheme: "dark" });
  await click('[data-act="set:theme:light"]');
  ok("Light setting wins on a dark-mode phone", (await bg()) === autoOnLightPhone, await bg());
  await click('[data-act="set:units:imperial"]');
  ok("imperial units show lb·ft / psi / °F", /lb·ft.*psi.*°F/.test(await text("#main")));
  await click('[data-act="set:speak:true"]');
  ok("'read aloud' toggle is stored as true", (await setting("speak")) === true);
  await click('[data-act="set:voiceLang:ta"]');
  await click('[data-act="voiceTest"]');
  ok("voice test reports a result", (await text("#voiceMsg")).length > 0, await text("#voiceMsg"));
  ok("favourite is listed in Settings", (await text("#main")).includes("Toyota HiAce"));
  await page.reload();
  ok("settings survive a restart", (await setting("textSize")) === "l" && (await setting("theme")) === "light" && (await setting("units")) === "imperial" && (await setting("level")) === "advanced");
  await click('[data-act="clearRecent"]');
  ok("recent searches can be cleared", (await setting("recent")).length === 0);
  await click('[data-act="resetAll"]');
  ok("reset restores defaults but keeps the language", (await setting("theme")) === "auto" && (await setting("textSize")) === "m" && (await setting("vehicleId")) === null && (await setting("lang")) === "en");

  console.log("Every screen × every language × text size (no sideways scrolling)");
  const screens = ["#/home", "#/pick", "#/vehicle/toyota_hiace_kdh_2013_1kdftv", "#/system/toyota_hiace_kdh_2013_1kdftv/special", "#/dtc", "#/dtc/P0087", "#/dtc/U0100", "#/find/rail", "#/settings", "#/soon/4"];
  let worst = 0, where = "";
  for (const lang of ["en", "ta", "si"]) for (const size of ["m", "l"]) {
    await page.evaluate(([l, s]) => { Settings.set("lang", l); Settings.set("textSize", s); Settings.set("level", "advanced"); }, [lang, size]);
    for (const s of screens) {
      await goto(s);
      for (const k of s.startsWith("#/dtc/") ? ["over", "diag", "elec", "rep", "ver"] : [null]) {
        if (k) await click('[data-act="tab:' + k + '"]');
        const o = await overflow(); if (o > worst) { worst = o; where = [lang, size, s, k].join(" "); }
      }
    }
  }
  ok("no screen is wider than the phone", worst <= 0, worst + "px at " + where);

  console.log("Health");
  ok("no JavaScript errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  ok("no network requests (fully offline)", external.length === 0, external.slice(0, 3).join(" | "));

  await browser.close();
  const failed = results.filter((r) => !r.pass);
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
