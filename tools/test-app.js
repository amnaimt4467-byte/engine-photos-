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
  ok("Toyota → model list", (await text("#pickBody")).includes("Hiace") && (await text("#pickBody")).includes("Hilux"));
  await click('[data-act="pick:model:Hiace"]');
  ok("Hiace → list of years / engines with a trust mark on each", (await text("#pickBody")).includes("2000-2016 · 1KD-FTV") && (await text("#pickBody")).includes("Not verified"));
  ok("no engine file is loaded until a vehicle is opened", await page.evaluate(() => !window.ENGINES));
  await click('a.big[href="#/vehicle/toyota~hiace~2000-2016-1kd-ftv"]'); await page.waitForTimeout(400);
  ok("choosing an entry opens the vehicle page", (await hash()) === "#/vehicle/toyota~hiace~2000-2016-1kd-ftv", await hash());
  ok("vehicle page shows the engine, a 'not verified' warning and its specs", (await text("#main")).includes("1KD-FTV (3.0 D-4D)") && (await text("#main")).includes("NOT been checked") && (await text("#main")).includes("2982cc"));
  ok("torque and special-function sections are present", (await text("#main")).includes("Tightening torque") && (await text("#main")).includes("Special functions and resets"));
  ok("only that brand's engine file was loaded", await page.evaluate(() => Object.keys(window.ENGINES || {}).join(",") === "toyota"));
  ok("vehicle page shows 17 systems", (await page.$$(".tile")).length === 17);
  await click('[data-act^="set:vehicleId:"]');
  ok("'Use as my vehicle' is saved", (await setting("vehicleId")) === "toyota~hiace~2000-2016-1kd-ftv");
  await click('[data-act^="fav:"]');
  ok("vehicle saved to favourites", (await setting("favorites")).length === 1);
  await goto("#/system/toyota~hiace~2000-2016-1kd-ftv/fuel"); await page.waitForTimeout(200);
  ok("a system page shows this engine's data for that system", (await text("#main")).includes("Fuel pressure") && (await text("#main")).includes("25 - 35 MPa"));
  await goto("#/pick");
  await page.fill('[data-input="pickSearch"]', "kdh"); await page.waitForTimeout(80);
  ok("search 'kdh' finds the HiAce entries", (await page.$$("#pickBody a.big")).length >= 1 && (await text("#pickBody")).includes("Hiace") && (await text("#pickBody")).includes("KDH201V"));
  await page.fill('[data-input="pickSearch"]', "4jj1"); await page.waitForTimeout(80);
  ok("search '4jj1' finds Isuzu vehicles", (await page.$$("#pickBody a.big")).length >= 1 && (await text("#pickBody")).includes("Isuzu"));
  await page.fill('[data-input="pickSearch"]', "d-max"); await page.waitForTimeout(80);
  ok("search 'd-max' finds the D-Max", (await page.$$("#pickBody a.big")).length >= 1 && /D-?Max/i.test(await text("#pickBody")));
  await page.fill('[data-input="pickSearch"]', "zzzz"); await page.waitForTimeout(80);
  ok("search with no match explains itself", (await text("#pickBody")).includes("No vehicle matches"));
  await page.fill('[data-input="pickSearch"]', ""); await page.waitForTimeout(80);
  const cat = await page.evaluate(() => KB.DataStore.catalogStats());
  ok("catalogue holds every engine and vehicle from the old app", cat.brands === 13 && cat.models === 214 && cat.vehicles === 565 && cat.engines === 259, JSON.stringify(cat));
  const broken = await page.evaluate(() => KB.DataStore.vehicles().filter((v) => !KB.DataStore.engineInfo(v.engineKey)).length);
  ok("every vehicle entry points at an engine", broken === 0, broken + " broken");
  /* another brand: its own engine file, its own fault-code groups first */
  const isuzu = await page.evaluate(() => KB.DataStore.findVehicles("isuzu 4jj1")[0].id);
  await goto("#/vehicle/" + isuzu); await page.waitForTimeout(400);
  ok("an Isuzu 4JJ1 vehicle opens with its engine data", (await text("#main")).includes("4JJ1") && (await page.$$("#main details.x")).length >= 2, isuzu);
  await page.evaluate(() => new Promise((r) => DTC.load(r)));
  const isz = await page.evaluate((id) => { const h = DTC.resolve("P0087", KB.DataStore.vehicle(id)).hits[0]; return h.layer + ":" + (h.entry && h.entry.brand); }, isuzu);
  ok("for the Isuzu, P0087 resolves to Isuzu's own code group first", isz === "engine:isuzu", isz);
  const nissan = await page.evaluate(() => KB.DataStore.vehicles().filter((v) => v.brandId === "nissan")[0].id);
  await goto("#/vehicle/" + nissan); await page.waitForTimeout(400);
  ok("a Nissan vehicle opens with its engine data", (await text("#main")).includes("Nissan") && (await page.$$("#main details.x")).length >= 1, nissan);
  /* a vehicle saved by an older app version keeps working */
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("es_settings_v1")); s.vehicleId = "toyota_hiace_kdh_2013_1kdftv"; s.favorites = ["toyota_hiace_kdh_2013_1kdftv", "isuzu_dmax_2013_4jj1"]; localStorage.setItem("es_settings_v1", JSON.stringify(s)); });
  await page.reload();
  ok("a vehicle saved by the previous app version is carried over", (await setting("vehicleId")) === "toyota~hiace~2000-2016-1kd-ftv" && (await setting("favorites")).join() === "toyota~hiace~2000-2016-1kd-ftv");

  console.log("Home");
  await goto("#/home");
  ok("home shows my vehicle", (await text("#main")).includes("Toyota Hiace"));

  console.log("Systems + DTC");
  await goto("#/system/toyota~hiace~2000-2016-1kd-ftv/fuel");
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

  console.log("DTC library (layers)");
  await page.evaluate(() => new Promise((r) => DTC.load(r)));
  const st = await page.evaluate(() => DTC.stats());
  ok("library loaded: generic + brand records", st && st.generic >= 600 && st.brand >= 2000, JSON.stringify(st));
  const top = (code) => page.evaluate((c) => { const h = DTC.resolve(c, KB.DataStore.vehicle(Settings.get("vehicleId"))).hits; return h.length ? { layer: h[0].layer, title: h[0].pack ? h[0].pack.title.en : h[0].entry.rec.t.en, n: h.length, brand: h[0].entry && h[0].entry.brand } : null; }, code);
  let r = await top("P0087");
  ok("P0087 with KDH selected → vehicle pack first", r.layer === "pack" && r.n >= 3, JSON.stringify(r));
  r = await top("P1229");
  ok("P1229 → Toyota 1KD engine group", r.layer === "engine" && r.brand === "toyota", JSON.stringify(r));
  r = await top("P0300");
  ok("P0300 → SAE generic library", r.layer === "generic" && /Misfire/.test(r.title), JSON.stringify(r));
  await goto("#/dtc/C1201");
  ok("C1201 with KDH → Toyota meaning shown first, others below", /Engine Control System Malfunction/.test(await text("#main")) && (await text("#main")).includes("Other meanings of this code"));
  await goto("#/dtc/P1229");
  ok("brand record page shows source tag, flash code and causes", /Toyota/.test(await text("#main")) && /Flash code 78/.test(await text("#main")) && /SCV stuck/.test(await text("#main")));
  await goto("#/dtc/P0300");
  ok("generic record never shows a flash code", !/Flash code/.test(await text(".tt ~ div")));
  await goto("#/dtc/P0ABC");
  ok("valid code that is not in the library → structure explained, not a dead end", (await text("#main")).includes("not in the library yet") && (await text("#main")).includes("Powertrain") && (await text("#main")).includes("hybrid"));
  await goto("#/dtc/XYZ");
  ok("something that is not a code → clear message", (await text("#main")).includes("does not look like a fault code"));
  await goto("#/find/49");
  ok("flash code search finds Toyota codes with blink code 49", /P0190/.test(await text("#main")) && /flash \(blink\) code 49/.test(await text("#main")));
  await goto("#/find/rail pressure");
  ok("word search (English) finds rail pressure codes", /P0087/.test(await text("#main")) && /P0190/.test(await text("#main")));
  await goto("#/find/" + encodeURIComponent("குறைவு"));
  ok("word search (Tamil) finds codes", (await page.$$("#main a.ditem")).length > 5);
  await goto("#/find/" + encodeURIComponent("අඩුයි"));
  ok("word search (Sinhala) finds codes", (await page.$$("#main a.ditem")).length > 5);
  await goto("#/home"); await goto("#/find/ABS-21");
  ok("non-standard code format (ABS-21) opens its page", (await hash()) === "#/dtc/ABS21", await hash());
  await page.goBack(); await page.waitForTimeout(80);
  ok("Back from a redirected search does not bounce", (await hash()) === "#/home", await hash());
  await goto("#/dtc");
  await page.fill('form[data-search] input', "P02"); await page.waitForTimeout(120);
  ok("typing shows suggestions", (await page.$$(".suggest .sg")).length >= 3);
  await click(".suggest .sg");
  ok("tapping a suggestion opens that code and records it", /^#\/dtc\/P02/.test(await hash()) && /^P02/.test((await setting("recent"))[0]), await hash());
  await goto("#/browse/abs");
  const codes = await page.$$eval("#main a.ditem .c", (els) => els.map((e) => e.textContent));
  ok("browse by system lists each code once", codes.length > 20 && new Set(codes).size === codes.length, codes.length + " rows, " + new Set(codes).size + " unique");
  await goto("#/dtcgroup/toyota/toy_1kd_crs");
  ok("brand code group page lists its codes", (await page.$$("#main a.ditem")).length === 27);
  await page.evaluate(() => Settings.set("vehicleId", null));
  await goto("#/dtc/C1201");
  ok("maker-specific code with no vehicle → asks to choose a vehicle, no brand privileged", (await text("#main")).includes("manufacturer-specific code") && !(await page.$("#main > .tt")) && (await page.$$("#main > details.x")).length >= 3);
  r = await top("P0087");
  ok("P0087 with no vehicle → generic library", r.layer === "generic", JSON.stringify(r));
  await page.evaluate(() => Settings.set("vehicleId", "toyota~hiace~2000-2016-1kd-ftv"));

  console.log("Voice");
  const spoken = [
    ["P zero zero eight seven", "P0087"], ["p0087", "P0087"], ["P double zero eight seven", "P0087"], ["P oh oh 87", "P0087"], ["pee zero zero eighty seven", "P0087"],
    ["search for P 0 3 0 0 please", "P0300"], ["code is U zero one zero zero", "U0100"], ["C one two zero one", "C1201"], ["bee one four two one", "B1421"], ["P two A zero zero", "P2A00"], ["you zero one zero zero", "U0100"],
    ["பி பூஜ்யம் பூஜ்யம் எட்டு ஏழு", "P0087"], ["பி ஜீரோ ஜீரோ எட்டு ஏழு", "P0087"], ["பி சைபர் சைபர் எய்ட் செவன்", "P0087"], ["பி பூஜ்யம் மூன்று பூஜ்யம் பூஜ்யம்", "P0300"], ["சி ஒன்று இரண்டு பூஜ்யம் ஒன்று", "C1201"],
    ["யு பூஜ்யம் ஒன்று பூஜ்யம் பூஜ்யம்", "U0100"], ["பி ஒண்ணு ரெண்டு ரெண்டு ஒம்பது", "P1229"], ["பி டபுள் பூஜ்யம் எட்டு ஏழு", "P0087"], ["பி 0087", "P0087"], ["கோட் பி பூஜ்யம் நாலு பூஜ்யம் ஒன்னு", "P0401"],
    ["පී බිංදුව බිංදුව අට හත", "P0087"], ["පී සීරෝ සීරෝ අට හත", "P0087"], ["පී බිංදුව තුන බිංදුව බිංදුව", "P0300"], ["සී එක දෙක බිංදුව එක", "C1201"], ["බී එක හතර දෙක එක", "B1421"],
    ["යූ බිංදුව එක බිංදුව බිංදුව", "U0100"], ["පී එක දෙක දෙක නවය", "P1229"], ["පී ඩබල් බිංදුව අට හත", "P0087"], ["පී 0087", "P0087"], ["පී බිංදුව හතර බිංදුව පහ", "P0405"],
    ["rail pressure", null], ["search for something", null], ["zero zero eight seven", null], ["you see one of them", null], ["எரிபொருள் அழுத்தம் குறைவு", null], ["P zero zero eight", null]
  ];
  const wrong = await page.evaluate((cases) => cases.filter(([say, want]) => { const r = Voice.parseCode(say); return (r ? r.code : null) !== want; }).map((c) => c[0]), spoken);
  ok("spoken codes are understood in English, Tamil and Sinhala (" + spoken.length + " phrases)", wrong.length === 0, "wrong: " + wrong.join(" | "));
  ok("Tamil 'பி' offers the B reading as well", (await page.evaluate(() => Voice.parseCode("பி ஒன்று நான்கு இரண்டு ஒன்று").alt)) === "B1421");
  await goto("#/dtc");
  ok("microphone button is shown exactly when the device can listen", !!(await page.$('[data-act="mic"]')) === (await page.evaluate(() => Voice.canListen())));
  /* pretend the mechanic spoke: replace the listener, then tap the microphone */
  const speakAndTap = async (result) => {
    await goto("#/dtc");
    await page.evaluate((r) => { Voice.canListen = () => true; Voice.listen = (cb) => cb(r); APP.render(); }, result);
    await click('[data-act="mic"]'); await page.waitForTimeout(150);
  };
  await speakAndTap({ texts: ["பி பூஜ்யம் பூஜ்யம் எட்டு ஏழு"] });
  ok("speaking a code in Tamil opens that code", (await hash()) === "#/dtc/P0087" && (await setting("recent"))[0] === "P0087", await hash());
  await speakAndTap({ texts: ["hmm", "P zero three zero zero"] });
  ok("a later recognition alternative with a code is used", (await hash()) === "#/dtc/P0300", await hash());
  await speakAndTap({ texts: ["பி ஒன்று நான்கு இரண்டு ஒன்று"] });
  ok("Tamil 'பி' falls back to the B code when only that one exists", (await hash()) === "#/dtc/B1421", await hash());
  await speakAndTap({ texts: ["rail pressure"] });
  ok("speaking words runs a word search", (await hash()) === "#/find/rail%20pressure", await hash());
  await speakAndTap({ error: "denied" });
  ok("microphone permission refused → clear message, stays on the page", (await hash()) === "#/dtc" && (await text(".suggest")).includes("permission"));
  await speakAndTap({ error: "none" });
  ok("nothing heard → asks to try again", (await text(".suggest")).includes("Nothing was heard"));
  await goto("#/dtc/P1229");
  const said = await page.evaluate(() => new Promise((res) => { Voice.canSpeak = () => true; Voice.speak = (t, cb) => { res(t); cb(true); }; APP.render(); document.querySelector('[data-act="speak"]').click(); }));
  ok("'Read aloud' speaks the code, its meaning and causes", /P 1 2 2 9/.test(said) && /Pump valve/.test(said) && /SCV stuck/.test(said), said);
  await page.evaluate(() => Settings.set("speak", true));
  const auto = await page.evaluate(() => new Promise((res) => { Voice.speak = (t, cb) => { res(t); cb(true); }; location.hash = "#/dtc/P0300"; setTimeout(() => res(null), 1500); }));
  ok("with 'Read answers aloud' on, opening a code speaks it once", !!auto && /P 0 3 0 0/.test(auto), String(auto));
  await page.evaluate(() => Settings.set("speak", false));
  await page.reload();

  console.log("Guides: symptoms, special functions, lessons");
  await page.evaluate((id) => Settings.set("vehicleId", id), "toyota~hiace~2000-2016-1kd-ftv");
  await goto("#/home");
  const homeLinks = await page.$$eval(".grid2 a.big", (els) => els.map((e) => e.getAttribute("href")));
  ok("the four Home buttons all lead to real screens", homeLinks.join() === "#/dtc,#/symptoms,#/special,#/learn", homeLinks.join());
  await goto("#/symptoms"); await page.waitForTimeout(300);
  ok("symptom guides: the HiAce 1KD guide is listed first for that vehicle", (await page.$eval("#main a.big", (e) => e.getAttribute("href"))) === "#/flow/kd001");
  const forMine = await page.$$eval("#main > a.big", (els) => els.map((e) => e.getAttribute("href").replace("#/flow/", "")));
  ok("a common-rail diesel gets diesel guides but no petrol or generic common-rail duplicate", forMine.includes("gen_lp_diesel") && forMine.includes("gen_nocrank") && !forMine.includes("gen_ns_pet") && !forMine.includes("gen_misfire_pet") && !forMine.includes("gen_ns_cr"), forMine.join());
  const petrol = await page.evaluate(() => KB.DataStore.vehicles().filter((v) => KB.DataStore.engineInfo(v.engineKey).ft === "pet")[0].id);
  await page.evaluate((id) => Settings.set("vehicleId", id), petrol); await goto("#/symptoms");
  const forPetrol = await page.$$eval("#main > a.big", (els) => els.map((e) => e.getAttribute("href").replace("#/flow/", "")));
  ok("a petrol vehicle gets petrol guides and no diesel ones", forPetrol.includes("gen_ns_pet") && forPetrol.includes("gen_misfire_pet") && !forPetrol.includes("gen_lp_diesel") && !forPetrol.includes("kd001"), forPetrol.join());
  await page.evaluate(() => Settings.set("vehicleId", null)); await goto("#/symptoms");
  ok("with no vehicle every guide is listed, with a hint to choose one", (await page.$$("#main a.big")).length === 13 && (await text("#main")).includes("Choose your vehicle"));
  /* walk EVERY path of EVERY flow: each answer must lead to another step, a fix, or a result */
  const walk = await page.evaluate(() => {
    let screens = 0, ends = 0; const bad = [];
    const show = (h) => { history.replaceState(null, "", h); APP.render(); };
    FLOWS.forEach((f) => {
      (function visit(path) {
        const h = "#/flow/" + f.id + (path.length ? "/" + path.join(".") : "");
        show(h); screens++;
        const main = document.getElementById("main");
        if (main.querySelector(".endcard")) { ends++; if (!main.querySelector(".endcard .plain").textContent.trim()) bad.push(h + " empty end"); return; }
        const answers = main.querySelectorAll("a.big.res");
        if (!answers.length || !main.querySelector("h2").textContent.trim()) return bad.push(h + " dead end");
        for (let i = 0; i < answers.length; i++) visit(path.concat([i]));
      })([]);
    });
    show("#/symptoms");
    return { screens, ends, bad };
  });
  ok("every path of all 13 guides ends in a fix or a result (" + walk.screens + " screens, " + walk.ends + " endings)", walk.bad.length === 0 && walk.ends > 80, walk.bad.slice(0, 4).join(" | "));
  await goto("#/flow/gen_nocrank");
  ok("a guide step shows the tool, the instruction and the answers", (await text("#main")).includes("Measure voltage") && (await text("#main")).includes("What did you find?") && (await page.$$("a.big.res")).length >= 2);
  await click("a.big.res.to-fix"); 
  ok("choosing a faulty result opens the 'Do this' screen with after-repair checks", /^#\/flow\/gen_nocrank\/\d$/.test(await hash()) && (await text("#main")).includes("Do this") && (await text("#main")).includes("After the repair, check"), await hash());
  await page.goBack(); await page.waitForTimeout(80);
  ok("Back returns to the step", (await hash()) === "#/flow/gen_nocrank", await hash());
  await goto("#/special");
  ok("special functions without a vehicle: asks for one, bypass notice shown", (await text("#main")).includes("Choose your vehicle") && (await text("#main")).includes("never provides immobilizer bypass"));
  await page.evaluate((id) => Settings.set("vehicleId", id), "toyota~hiace~2000-2016-1kd-ftv"); await goto("#/special"); await page.waitForTimeout(400);
  ok("special functions for the HiAce: demo wizard entries and the engine's own functions", (await page.$$('#main a.big[href^="#/sfrun/"]')).length === 9 && (await text("#main")).includes("Injector Compensation Code") && (await text("#main")).includes("NOT been checked"));
  await goto("#/sfrun/injector_comp");
  ok("a scanner-only function asks about the scanner first", (await text("#main")).includes("needs a scanner"));
  await click('a.btn[href="#/sfrun/injector_comp/no"]');
  ok("answering 'No' explains it cannot be done by hand", (await text("#main")).includes("cannot be done correctly by hand"));
  await goto("#/sfrun/injector_comp/go/0");
  ok("the wizard shows one step at a time with its trust mark", (await text("#main")).includes("Step 1 of 4") && !!(await page.$("#main .st")));
  await goto("#/sfrun/injector_comp/go/3");
  ok("the last step offers Finish", (await text("#main")).includes("Step 4 of 4") && (await text("#main")).includes("Finish"));
  /* a Nissan whose engine record lists the NATS key registration (not every Nissan engine does) */
  await page.evaluate(() => new Promise((r) => KB.DataStore.loadEngine(KB.DataStore.vehicles().filter((v) => v.brandId === "nissan")[0].engineKey, r)));
  const nis = await page.evaluate(() => KB.DataStore.vehicles().filter((v) => { const e = v.brandId === "nissan" && KB.DataStore.engine(v.engineKey); return e && e.sections.special_functions && e.sections.special_functions.rows.some((r) => /NATS/.test(r[0])); })[0].id);
  await page.evaluate((id) => Settings.set("vehicleId", id), nis); await goto("#/special"); await page.waitForTimeout(400);
  ok("special functions for a Nissan: its own list, no demo pack", (await page.$$("#main details.x")).length >= 3 && (await page.$$('#main a.big[href^="#/sfrun/"]')).length === 0 && (await text("#main")).includes("NATS"), nis);
  await goto("#/learn");
  ok("six testing lessons are listed", (await page.$$('#main a.big[href^="#/lesson/"]')).length === 6);
  await goto("#/lesson/voltage");
  ok("the voltage lesson has a drawing and numbered steps", !!(await page.$("#main .illus svg")) && (await page.$$("#main .check")).length === 3);
  ok("no screen says 'coming in a later update' any more", await page.evaluate(() => !Object.keys(I18N).some((k) => k.startsWith("soon_"))));
  await page.evaluate((id) => Settings.set("vehicleId", id), "toyota~hiace~2000-2016-1kd-ftv");

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
  ok("favourite is listed in Settings", (await text("#main")).includes("Toyota Hiace"));
  await page.reload();
  ok("settings survive a restart", (await setting("textSize")) === "l" && (await setting("theme")) === "light" && (await setting("units")) === "imperial" && (await setting("level")) === "advanced");
  await click('[data-act="clearRecent"]');
  ok("recent searches can be cleared", (await setting("recent")).length === 0);
  await click('[data-act="resetAll"]');
  ok("reset restores defaults but keeps the language", (await setting("theme")) === "auto" && (await setting("textSize")) === "m" && (await setting("vehicleId")) === null && (await setting("lang")) === "en");

  console.log("Every screen × every language × text size (no sideways scrolling)");
  const screens = ["#/home", "#/pick", "#/vehicle/toyota~hiace~2000-2016-1kd-ftv", "#/system/toyota~hiace~2000-2016-1kd-ftv/special", "#/dtc", "#/dtc/P0087", "#/dtc/U0100",
    "#/vehicle/nissan~NISSANID", "#/system/toyota~hiace~2000-2016-1kd-ftv/special", "#/system/toyota~hiace~2000-2016-1kd-ftv/wiring", "#/system/toyota~hiace~2000-2016-1kd-ftv/ecu", "#/dtc/P1229", "#/dtc/P0300", "#/dtc/C1241", "#/dtc/P0ABC", "#/find/rail", "#/find/49", "#/browse/engine", "#/dtcgroup/toyota/toyota_abs", "#/settings",
    "#/symptoms", "#/flow/kd001", "#/flow/gen_ns_cr/0", "#/flow/snd_noise", "#/flow/gen_nocrank/1", "#/special", "#/sfrun/injector_comp", "#/sfrun/abs_bleed/go/1", "#/learn", "#/lesson/voltage", "#/lesson/connector"];
  await page.evaluate(() => Settings.set("vehicleId", "toyota~hiace~2000-2016-1kd-ftv"));
  let worst = 0, where = "";
  for (const lang of ["en", "ta", "si"]) for (const size of ["m", "l"]) {
    await page.evaluate(([l, s]) => { Settings.set("lang", l); Settings.set("textSize", s); Settings.set("level", "advanced"); }, [lang, size]);
    for (const s of screens) {
      await goto(s.replace("nissan~NISSANID", nissan)); if (/vehicle|system|special|flow|symptoms/.test(s)) await page.waitForTimeout(250);
      await page.evaluate(() => document.querySelectorAll("details").forEach((d) => { d.open = true; }));
      for (const k of (await page.$(".dtabs")) ? ["over", "diag", "elec", "rep", "ver"] : [null]) {
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
