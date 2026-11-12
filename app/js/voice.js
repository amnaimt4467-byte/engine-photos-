/* =====================================================================
   VOICE — speak a fault code to search, and have answers read aloud.

   Inside the Android app the browser's own speech features do not work,
   so two native plugins are used (see js/native.js):
     SpeechRecognition   listening; needs the microphone permission and the
                         phone's speech service (Google), usually with internet
     TextToSpeech        reading aloud; needs a voice for the language on the phone
   In a desktop browser the Web Speech API is used instead.
   Inside the app the browser API is never used as a fallback: it only pretends to work.

   Voice.parseCode(text) is plain logic (no device needed):
     "P zero zero eight seven"        → P0087
     "பி பூஜ்யம் பூஜ்யம் எட்டு ஏழு"      → P0087
     "පී බිංදුව බිංදුව අට හත"            → P0087
   ===================================================================== */
var Voice = (function () {
  var nativeSR = Native.plugin("SpeechRecognition"), nativeTTS = Native.plugin("TextToSpeech");
  var WebSR = Native.isApp ? null : (window.SpeechRecognition || window.webkitSpeechRecognition || null);
  var webTTS = !Native.isApp && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";

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
  function hasPopup() { return !!nativeSR; }            // the "Speak now" window exists only inside the app
  /* what a failure from the phone's recogniser means for the user:
       "none"     nothing was heard / understood, or the "Speak now" window was closed → try again
       "denied"   no microphone permission
       "network"  the speech service needs internet
       "language" the phone cannot recognise this language
       "failed"   anything else (the raw text is passed along). The plugin's "Didn't understand, please
                  try again." belongs here: it is its text for every error number it does not know,
                  which includes Android's "language not supported / not downloaded". */
  function errorKind(message) {
    var m = String(message || "").toLowerCase();
    if (/permission/.test(m)) return "denied";
    if (/network|server/.test(m)) return "network";
    if (/language/.test(m)) return "language";
    if (/no match|no speech|^0$/.test(m)) return "none";
    return "failed";
  }
  /* listen(cb, opts): cb({ texts: [...] }) on success, cb({ error: kind, detail }) otherwise.
     opts.popup = true uses the phone's own "Speak now" window (Google) instead of listening silently
     inside the app; some phones only recognise speech reliably that way. */
  function listen(cb, opts) {
    var popup = !!(opts && opts.popup);
    var lang = langInfo().bcp47, done = false;
    var finish = function (r) { if (!done) { done = true; cb(r); } };
    var fail = function (e) { var msg = (e && (e.message || e.errorMessage)) || String(e || ""); finish({ error: errorKind(msg), detail: msg }); };
    if (nativeSR) {
      nativeSR.available().then(function (a) {
        if (!a || !a.available) return finish({ error: "unavailable" });
        return nativeSR.checkPermissions().then(function (p) {
          return p.speechRecognition === "granted" ? p : nativeSR.requestPermissions();
        }).then(function (p) {
          if (p.speechRecognition !== "granted") return finish({ error: "denied" });
          return nativeSR.start({ language: lang, maxResults: 5, popup: popup, partialResults: false }).then(function (res) {
            finish(res && res.matches && res.matches.length ? { texts: res.matches } : { error: "none" });
          });
        });
      }).catch(fail);
      return;
    }
    if (!WebSR) return finish({ error: "unavailable" });
    try {
      var rec = new WebSR();
      rec.lang = lang; rec.interimResults = false; rec.maxAlternatives = 5;
      rec.onresult = function (e) { var alts = []; for (var i = 0; i < e.results[0].length; i++) alts.push(e.results[0][i].transcript); finish({ texts: alts }); };
      rec.onerror = function (e) { finish({ error: e.error === "not-allowed" || e.error === "service-not-allowed" ? "denied" : e.error === "network" ? "network" : "none", detail: e.error }); };
      rec.onend = function () { finish({ error: "none" }); };
      rec.start();
    } catch (e) { finish({ error: "unavailable" }); }
  }
  function stopListening() { if (nativeSR) nativeSR.stop().catch(function () {}); }

  /* ---------- reading aloud ---------- */
  function canSpeak() { return !!(nativeTTS || webTTS); }
  /* speak(text, cb): cb(true) when it was spoken, cb(false, "language" | "failed") when it could not be */
  function speak(text, cb) {
    var lang = langInfo().bcp47; cb = cb || function () {};
    if (nativeTTS) {
      nativeTTS.isLanguageSupported({ lang: lang }).then(function (r) {
        if (!r || !r.supported) return cb(false, "language");
        return nativeTTS.stop().catch(function () {}).then(function () {
          return nativeTTS.speak({ text: text, lang: lang, rate: 1.0, pitch: 1.0, volume: 1.0 });
        }).then(function () { cb(true); });
      }).catch(function () { cb(false, "failed"); });
      return;
    }
    if (!webTTS) return cb(false, "failed");
    try {
      var u = new SpeechSynthesisUtterance(text); u.lang = lang;
      u.onerror = function () { cb(false, "failed"); };
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); cb(true);
    } catch (e) { cb(false, "failed"); }
  }
  function stop() {
    if (nativeTTS) nativeTTS.stop().catch(function () {});
    else if (webTTS) window.speechSynthesis.cancel();
  }
  /* "P0087" → "P 0 0 8 7" so the voice reads each character */
  function spell(code) { return String(code).split("").join(" "); }

  /* ---------- what this phone can do (shown in Settings so a problem can be reported exactly) ---------- */
  function diagnose(cb) {
    var out = { app: Native.isApp, listen: nativeSR ? "plugin" : WebSR ? "browser" : "none", speak: nativeTTS ? "plugin" : webTTS ? "browser" : "none", service: null, permission: null, voices: {} };
    var jobs = [];
    if (nativeSR) {
      jobs.push(nativeSR.available().then(function (a) { out.service = !!(a && a.available); }).catch(function () { out.service = false; }));
      jobs.push(nativeSR.checkPermissions().then(function (p) { out.permission = p.speechRecognition; }).catch(function () {}));
    }
    if (nativeTTS) KB.LANGS.forEach(function (l) {
      jobs.push(nativeTTS.isLanguageSupported({ lang: l.bcp47 }).then(function (r) { out.voices[l.id] = !!(r && r.supported); }).catch(function () { out.voices[l.id] = false; }));
    });
    Promise.all(jobs).then(function () { cb(out); }, function () { cb(out); });
  }

  return { parseCode: parseCode, canListen: canListen, hasPopup: hasPopup, listen: listen, stopListening: stopListening, errorKind: errorKind,
    canSpeak: canSpeak, speak: speak, stop: stop, spell: spell, langInfo: langInfo, diagnose: diagnose };
})();
