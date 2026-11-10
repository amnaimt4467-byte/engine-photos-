# Engine Specs: Automotive Diagnostic Knowledge App

An offline Android app for mechanics in **English, Tamil and Sinhala**. It brings together vehicle data, DTC codes, repair steps and manual (no-scanner) diagnosis.

Master plan: three data layers (generic DTC library → brand DTC groups → per-vehicle "Vehicle Pack"), built in phases 0–6. The first full vehicle is the Toyota HiAce KDH 2013 (1KD-FTV).

## Repository layout
```
app/                 Web UI that runs inside the Android app (offline, no external resources)
  js/settings.js       user preferences (language, level, text size, theme, units, voice, my vehicles)
  js/data.js           app data (sample records until Phase 2/3)
  js/core.js           DataStore (swap for Firebase here), badges, unit conversion
  js/i18n.js           UI text in English / Tamil / Sinhala
  js/app.js            router, header, bottom tabs
  js/screens.js        home, vehicle picker, vehicle, system, DTC
  js/screen-settings.js settings screen
tools/test-app.js    browser test of the whole app (npm test)
android/             Capacitor Android project (generated; build outputs are git-ignored)
samples/             The three layout samples (Sample_1/2/3.html) and their sources
.github/workflows/   apk.yml builds the debug APK on GitHub Actions
*.jpg                Isuzu 4JJ1 manual reference photos (for a later vehicle pack)
```

## Build the APK
- **GitHub Actions (default):** every push that touches `app/`, `android/` or the config runs **Build Android APK**. Download the APK from the run page under *Artifacts → engine-specs-debug-apk*. You can also start the build by hand from the Actions tab.
- **Locally** (needs Node 22+, JDK 21, Android SDK 36):
  ```
  npm ci
  npm run apk:debug      # → android/app/build/outputs/apk/debug/app-debug.apk
  ```

After editing anything in `app/`, run `npx cap sync android` so the Android project picks it up.

## Test
`npm test` opens `app/index.html` in a headless browser at phone size and checks first launch, the vehicle picker, DTC search and tabs, every setting, all three languages, and that no screen scrolls sideways or touches the network. It needs Playwright with Chromium.

You can also open `app/index.html` directly in any browser to try the app without building an APK.

## Status
- [x] Phase 0: project structure, Capacitor Android project, APK build workflow, placeholder app (language picker)
- [x] Phase 1: app shell (home, vehicle picker, vehicle page with 17 systems, DTC lookup on sample data) + full settings
- [ ] Phase 2: all DTC codes (generic + brand groups) with search and voice
- [ ] Phase 3: Toyota KDH 2013 / 1KD-FTV vehicle pack
- [ ] Phase 4: special functions + manual diagnosis
- [ ] Phase 5: testing with mechanics + signed release
- [ ] Phase 6: more vehicles
