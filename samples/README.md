# Automotive Diagnostic Knowledge System — Layout Samples

Three standalone HTML samples that show the **same** demo data in three different structures.
Open any `Sample_N.html` directly in a browser (Android Chrome / Windows Edge / Chrome). No server or internet is needed. Without internet, fonts fall back to system fonts.

| File | Structure | Best for |
|---|---|---|
| `Sample_1.html` | **Traditional vehicle database**: sidebar tree (Make → Model → Year → Engine → 17 systems), breadcrumb, table-based record sheets | Desktop and workshop PCs, technicians who browse by vehicle, very large databases |
| `Sample_2.html` | **Modern diagnostic dashboard**: KPI tiles, data-quality bar, system tiles, DTC workspace with tabs (Overview / Diagnose / Electrical / Repair / Verify) | Fast DTC lookup on tablet and desktop, experienced technicians |
| `Sample_3.html` | **Mechanic-friendly step-by-step**: big buttons, beginner/advanced switch, guided flow (Understand → Quick checks → Tests → Repair → Verify), symptom start, scanner check, glossary | Phones, less-experienced mechanics, learning on the job |

Demo vehicle: **Toyota HiAce KDH · 2013 · 1KD-FTV** only.
Sample records: 6 DTCs (P0087, P0100, P0400, U0100, C1201, B1421), 3 repair procedures, 9 special functions, 6 manual-test lessons, and a 10-term glossary, all in English, Tamil and Sinhala.

## Data status (the trust system)
Every value carries one of these badges:

- ✔ **Published spec**: standard definition (SAE DTC title, OBD-II DLC pins) or widely published spec (displacement, bore × stroke)
- ⓘ **General guidance**: general workshop practice, not vehicle-specific
- ◇ **Illustrative example**: layout example only
- ⚠ **Needs verification**: a vehicle-specific value (pinouts, voltages, torque, part numbers, reset sequences). It is **intentionally left empty** and must be filled from the official Toyota repair manual. Nothing is guessed.

Immobilizer bypass and unauthorized key access are deliberately **not** included. Only manufacturer-approved registration and reset methods are listed.

## Source layout (for development)
```
samples/
  src/kb-data.js        ← all sample data (one place; future Firestore collections)
  src/kb-core.js        ← DataStore (swap for Firebase here), i18n, status badges, search
  src/sample1.src.html  ← layout 1 UI
  src/sample2.src.html  ← layout 2 UI
  src/sample3.src.html  ← layout 3 UI
  build.js              ← inlines data + core into each layout → Sample_N.html
```
Rebuild after editing: `node samples/build.js`

**Firebase later:** only the `DataStore` methods in `kb-core.js` need to change (e.g. `dtc(code)` → Firestore `doc("dtcs", code)`). The UI code calls the DataStore only.
