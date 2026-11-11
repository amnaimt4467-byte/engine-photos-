/* =====================================================================
   VOICE — speak a fault code to search, and have answers read aloud.

   Inside the Android app the browser's own speech features do not work,
   so two native plugins are used when present:
     Capacitor.Plugins.SpeechRecognition   (listening; needs the microphone
                                            permission and the phone's speech service)
     Capacitor.Plugins.TextToSpeech        (reading aloud)
   In a desktop browser the Web Speech API is used instead.
   When neither exists, canListen() / canSpeak() are false and the buttons are hidden.

   Voice.parseCode(text) is plain logic (no device needed):
     "P zero zero eight seven"        → P0087
     "பி பூஜ்யம் பூஜ்யம் எட்டு ஏழு"      → P0087
     "පී බිංදුව බිංදුව අට හත"            → P0087
   ===================================================================== */
var Voice = (function () {
  var cap = window.Capacitor, plugins = (cap && cap.Plugins) || {};
  var nativeSR = plugins.SpeechRecognition || null, nativeTTS = plugins.TextToSpeech || null;
  var WebSR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var webTTS = "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";

  function langInfo() {
    var id = Settings.get("voiceLang") === "app" ? KB.getLang() : Settings.get("voiceLang");
    return KB.LANGS.filter(function (l) { return l.id === id; })[0] || KB.LANGS[0];
  }

  /* ---------- spoken words → code characters ---------- */
  var WORDS = {};
  function map(chars, words) { words.split(" ").forEach(function (w) { WORDS[w] = chars; }); }
  /* digits */
  map("0", "zero oh o nought ஜீரோ சைபர் பூஜ்யம் பூஜ்ஜியம் பூச்சியம் සීරෝ බිංදුව බින්දුව ශුන්‍යය ශුන්‍ය");
  map("1", "one won ஒன் ஒன்று ஒண்ணு ஒன்னு වන් එක එකයි");
  map("2", "two too டூ இரண்டு ரெண்டு ටූ දෙක දෙකයි");
  map("3", "three த்ரீ மூன்று மூணு ත්‍රී තුන තුනයි");
  map("4", "four for ஃபோர் போர் நான்கு நாலு ෆෝ හතර හතරයි");
  map("5", "five ஃபைவ் பைவ் ஐந்து அஞ்சு ෆයිව් පහ පහයි");
  map("6", "six சிக்ஸ் ஆறு සික්ස් හය හයයි");
  map("7", "seven செவன் ஏழு සෙවන් හත හතයි");
  map("8", "eight ate எய்ட் எட்டு එයිට් අට අටයි");
  map("9", "nine நைன் ஒன்பது ஒம்பது නයින් නවය නමය නවයයි");
  /* letters. Tamil writes P and B the same way, so "பி" is read as P and the B reading is offered as `alt`. */
  map("P", "p pee pea பி பீ பி. පී පි");
  map("B", "b bee be බී බි");
  map("C", "c see sea சி சீ සී සි");
  map("U", "u you யு யூ යූ යු");
  map("A", "a ay ஏ ඒ"); map("D", "d dee டி ඩී"); map("E", "e ஈ ඊ"); map("F", "f ef எஃப் එෆ්");
  var TENS = { ten: "10", eleven: "11", twelve: "12", thirteen: "13", fourteen: "14", fifteen: "15", sixteen: "16", seventeen: "17", eighteen: "18", nineteen: "19",
    twenty: "2", thirty: "3", forty: "4", fifty: "5", sixty: "6", seventy: "7", eighty: "8", ninety: "9", hundred: "00" };
  var REPEAT = { double: 2, triple: 3, "டபுள்": 2, "இரட்டை": 2, "ඩබල්": 2 };
  var AMBIGUOUS_P = { "பி": 1, "பீ": 1, "பி.": 1 };

  /* parseCode(text) → { code, alt } or null.  alt = the other reading when a Tamil "பி" could mean B */
  function parseCode(text) {
    var tokens = String(text || "").toLowerCase().replace(/[,;:!?()"']/g, " ").replace(/([a-z])\.(?=\s|$)/g, "$1").split(/[\s\-–_/]+/).filter(Boolean);
    var out = "", repeat = 1, ambiguousAt = -1;
    for (var i = 0; i < tokens.length; i++) {
      var w = tokens[i], piece = null;
      if (REPEAT[w]) { repeat = REPEAT[w]; continue; }
      if (/^[pbcu]?[0-9a-f]*\d[0-9a-f]*$/.test(w) || /^[pbcu][0-9a-f]{4}$/.test(w)) piece = w.toUpperCase();          // already digits: "p0087", "87", "0a"
      else if (TENS[w]) { piece = TENS[w]; var next = WORDS[tokens[i + 1]]; if (piece.length === 1 && !(next && /^[1-9]$/.test(next))) piece += "0"; }   // "eighty seven" → 8 + 7, "eighty" → 80
      else if (WORDS[w]) { piece = WORDS[w]; if (AMBIGUOUS_P[w]) ambiguousAt = out.length; }
      if (piece === null) { out += "|"; repeat = 1; continue; }             // not part of a code: break here
      for (var r = 0; r < repeat; r++) out += piece;
      repeat = 1;
    }
    var m = out.match(/[PBCU][0-3][0-9A-F]{3}(?![0-9A-F])/);
    if (!m) return null;
    var res = { code: m[0] };
    if (m[0][0] === "P" && ambiguousAt === m.index) res.alt = "B" + m[0].slice(1);
    return res;
  }

  /* ---------- listening ---------- */
  function canListen() { return !!(nativeSR || WebSR); }
  /* listen(cb): cb({ texts: [...] }) on success, cb({ error: "denied" | "none" | "unavailable" }) otherwise */
  function listen(cb) {
    var lang = langInfo().bcp47, done = false;
    var finish = function (r) { if (!done) { done = true; cb(r); } };
    if (nativeSR) {
      nativeSR.available().then(function (a) {
        if (!a || !a.available) return finish({ error: "unavailable" });
        return nativeSR.checkPermissions().then(function (p) {
          return p.speechRecognition === "granted" ? p : nativeSR.requestPermissions();
        }).then(function (p) {
          if (p.speechRecognition !== "granted") return finish({ error: "denied" });
          return nativeSR.start({ language: lang, maxResults: 5, popup: false, partialResults: false }).then(function (res) {
            finish(res && res.matches && res.matches.length ? { texts: res.matches } : { error: "none" });
          });
        });
      }).catch(function () { finish({ error: "none" }); });
      return;
    }
    if (!WebSR) return finish({ error: "unavailable" });
    try {
      var rec = new WebSR();
      rec.lang = lang; rec.interimResults = false; rec.maxAlternatives = 5;
      rec.onresult = function (e) { var alts = []; for (var i = 0; i < e.results[0].length; i++) alts.push(e.results[0][i].transcript); finish({ texts: alts }); };
      rec.onerror = function (e) { finish({ error: e.error === "not-allowed" || e.error === "service-not-allowed" ? "denied" : "none" }); };
      rec.onend = function () { finish({ error: "none" }); };
      rec.start();
    } catch (e) { finish({ error: "unavailable" }); }
  }
  function stopListening() { if (nativeSR && nativeSR.stop) nativeSR.stop().catch(function () {}); }

  /* ---------- reading aloud ---------- */
  function canSpeak() { return !!(nativeTTS || webTTS); }
  /* speak(text, cb): cb(true) when speech started, cb(false) when the device cannot speak this language */
  function speak(text, cb) {
    var lang = langInfo().bcp47; cb = cb || function () {};
    if (nativeTTS) {
      nativeTTS.stop().catch(function () {}).then(function () { return nativeTTS.speak({ text: text, lang: lang, rate: 1.0, pitch: 1.0, volume: 1.0 }); })
        .then(function () { cb(true); }).catch(function () { cb(false); });
      return;
    }
    if (!webTTS) return cb(false);
    try {
      var u = new SpeechSynthesisUtterance(text); u.lang = lang;
      u.onerror = function () { cb(false); };
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); cb(true);
    } catch (e) { cb(false); }
  }
  function stop() {
    if (nativeTTS) nativeTTS.stop().catch(function () {});
    else if (webTTS) window.speechSynthesis.cancel();
  }
  /* "P0087" → "P 0 0 8 7" so the voice reads each character */
  function spell(code) { return String(code).split("").join(" "); }

  return { parseCode: parseCode, canListen: canListen, listen: listen, stopListening: stopListening, canSpeak: canSpeak, speak: speak, stop: stop, spell: spell, langInfo: langInfo };
})();
