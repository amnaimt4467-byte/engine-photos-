# Engine Specs: Automotive Diagnostic Knowledge App

An offline Android app for mechanics in **English, Tamil and Sinhala**: vehicles and engines, fault codes (DTC), repair steps, and voice search.

## What is in the app (version 0.4.0)

| Area | Content |
|---|---|
| Vehicles and engines | 13 makes, 214 models, 565 year/engine entries, 259 engines (specs, fuel pressure, valve clearance, torque, sensors, ECM, special functions, common problems) |
| Fault codes | 670 SAE generic codes, 58 brand code groups with 1,677 codes, 446 other brand-specific codes |
| Demo pack | Toyota HiAce 1KD-FTV: 6 sample DTCs with the full 15-field layout, 3 procedures, 9 special functions |
| Voice | Speak a code in English, Tamil or Sinhala; have a code page read aloud |
| Settings | Language, level, text size, appearance, units, voice, my vehicles, recent searches, offline data, report wrong data |

### How far the data can be trusted
Every value carries a mark, shown in the app:

- ✔ **Published**: standard definition or a value checked against the manual
- 📄 **Cited source**: quotes a source but is not re-checked against the official manual
- ⓘ **General guidance**: workshop practice, not vehicle-specific
- ⚠ **Needs verification**: not confirmed. Most engine data is in this state: of the 259 engines, 43 are "cited source" and 216 "needs verification". **Confirm torque, clearance, pressure and voltage values in the repair manual.**

Immobilizer bypass and unauthorized key access are not included. Only manufacturer-approved registration and reset methods are listed.

## How a fault code is looked up
For the mechanic's selected vehicle, in this order:

1. the vehicle's own data pack
2. the brand code groups listed for that engine
3. other records of the same brand
4. the SAE generic library
5. what other brands mean by the same code
6. the code's structure (P/B/C/U, generic or manufacturer, area), so a valid code always gets an answer

The generic layer shows only generic content. Lines that belong to one vehicle's manual (connector pins, wire colours, dealer-tool steps, exact voltages, blink codes) stay in `data-src/` for that vehicle's pack.

## Repository layout
```
app/                    Web UI that runs inside the Android app (offline, no external resources)
  index.html, css/app.css
  js/settings.js          user preferences
  js/data.js              demo pack, the 17 system categories, glossary
  js/core.js              DataStore (vehicles, engines, demo pack), badges, units
  js/i18n.js              UI text in English / Tamil / Sinhala
  js/dtc.js               layered fault-code lookup
  js/voice.js             spoken code → search, read aloud
  js/app.js               router, header, tabs, search box
  js/screens.js           home, vehicle picker, vehicle page, system page
  js/screens-dtc.js       DTC lookup, results, code page, browse
  js/screen-settings.js   settings
  data/                   GENERATED from data-src/ (catalog.js, dtc-lib.js, engines/*.js)
data-src/               Source of truth for data: edit here, then run `npm run data`
  generic/*.json          SAE generic codes
  brand/*.json            brand code groups and brand-specific codes
  engine-groups.json      which code groups apply to which engine
  engines/*.json          engine records
  vehicles.json           make → model → year/engine entries
  i18n/                   translation memory, spec labels, keep-English list, todo lists
  review/conflicts.md     records a person should check
tools/
  migrate-v34.js          one-time: DTC data out of the old single-file app
  migrate-v34-engines.js  one-time: engines and vehicles out of the old app
  validate.js             checks data-src/
  build-data.js           data-src/ → app/data/
  lib/dtc-glossary.js     Tamil / Sinhala helper lines for DTC titles
  test-app.js             browser test of the whole app
android/                Capacitor Android project (build outputs are git-ignored)
samples/                The three early layout samples
.github/workflows/      apk.yml builds the debug APK
*.jpg                   Isuzu 4JJ1 manual reference photos (for a later vehicle pack)
```

## Commands
| Command | What it does |
|---|---|
| `npm run data` | validate `data-src/`, then rebuild `app/data/` |
| `npm test` | drive the app in a headless browser at phone size (needs Playwright + Chromium) |
| `npx cap sync android` | copy `app/` and plugins into the Android project |
| `npm run apk:debug` | build the APK locally (needs JDK 21 and Android SDK 36) |

You can open `app/index.html` directly in a browser to try the app without building an APK.

## Build the APK
Every push that touches `app/`, `data-src/`, `tools/`, `android/` or the config runs **Build Android APK** on GitHub Actions. Download the APK from the run page under *Artifacts → engine-specs-debug-apk*.

## Adding or correcting data
1. Edit the JSON in `data-src/` (or add translations in `data-src/i18n/`).
2. Run `npm run data`. It stops if a record is malformed and prints language coverage.
3. Run `npm test`.

When a value has been checked against the official repair manual, set its status to `published` and name the manual in `source`.

## Status
- [x] Phase 0: project structure, Android project, APK build
- [x] Phase 1: app shell and settings
- [x] Phase 2: fault-code library, layered search, translations, voice
- [x] Phase 3a: all engines and the vehicle catalogue from the old app (unverified data is marked)
- [ ] Phase 3b: Toyota HiAce KDH / 1KD-FTV pack from the official repair manual (pins, wiring, verified values)
- [ ] Phase 4: symptom-based diagnosis, special-function wizard, testing lessons
- [ ] Phase 5: testing with mechanics, signed release
- [ ] Phase 6: verify and translate the other engines, one manual at a time
