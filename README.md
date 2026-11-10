# Engine Specs: Automotive Diagnostic Knowledge App

An offline Android app for mechanics in **English, Tamil and Sinhala**. It brings together vehicle data, DTC codes, repair steps and manual (no-scanner) diagnosis.

Master plan: three data layers (generic DTC library → brand DTC groups → per-vehicle "Vehicle Pack"), built in phases 0–6. The first full vehicle is the Toyota HiAce KDH 2013 (1KD-FTV).

## Repository layout
```
app/                 Web UI that runs inside the Android app (offline, no external resources)
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

## Status
- [x] Phase 0: project structure, Capacitor Android project, APK build workflow, placeholder app (language picker)
- [ ] Phase 1: app shell + full settings
- [ ] Phase 2: all DTC codes (generic + brand groups) with search and voice
- [ ] Phase 3: Toyota KDH 2013 / 1KD-FTV vehicle pack
- [ ] Phase 4: special functions + manual diagnosis
- [ ] Phase 5: testing with mechanics + signed release
- [ ] Phase 6: more vehicles
