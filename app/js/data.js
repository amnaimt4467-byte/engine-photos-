/* =====================================================================
   Automotive Engine & Vehicle Diagnostic Knowledge System
   APP DATA — Phase 1 still ships the SAMPLE records (started as a copy of
   samples/src/kb-data.js). Phase 2 replaces the DTC part with the full
   generic + brand libraries; Phase 3 adds the real KDH vehicle pack.
   ---------------------------------------------------------------------
   Every text field is { en, ta, si }.
   Every record / value carries a STATUS so the app can show the mechanic
   how far the information can be trusted:

     "published" : standard definition or widely published spec
                   (e.g. SAE J2012 DTC title, engine displacement)
     "general"   : general workshop guidance, NOT vehicle-specific
     "example"   : illustrative example to show the layout only
     "pending"   : vehicle-specific value intentionally left EMPTY —
                   must be filled from the Toyota repair manual (RM)
                   before use. Never guess these.

   Firebase-ready: each top-level array is a future Firestore collection;
   each object has a stable "id" that can become the document id.
   ===================================================================== */
var t = function (en, ta, si) { return { en: en, ta: ta, si: si }; };

var KB_DATA = {
  meta: {
    version: "sample-0.1",
    demoVehicleId: "toyota_hiace_kdh_2013_1kdftv",
    notice: t(
      "SAMPLE DATA. Vehicle-specific values marked 'Needs verification' are intentionally empty and must be taken from the official Toyota repair manual.",
      "இது மாதிரி டேட்டா மட்டும். 'சரிபார்க்க வேண்டும்' என்று குறிக்கப்பட்ட வாகன அளவுகள் வேண்டுமென்றே காலியாக விடப்பட்டுள்ளன — Toyota repair manual-இல் இருந்து மட்டுமே நிரப்ப வேண்டும்.",
      "මෙය සාම්පල දත්ත පමණි. 'තහවුරු කළ යුතුයි' ලෙස සලකුණු කළ වාහන අගයන් හිතාමතාම හිස්ව තබා ඇත — Toyota repair manual එකෙන් පමණක් පුරවන්න."
    )
  },

  /* ---------- 1. VEHICLE TREE: make → model → year → engine ---------- */
  vehicles: [
    {
      id: "toyota_hiace_kdh_2013_1kdftv",
      make: "Toyota",
      model: "HiAce (H200 series)",
      chassis: "KDH",
      year: 2013,
      engine: "1KD-FTV",
      fuel: "Diesel",
      pack: "sample",   // "sample" = demo records only · null = no data pack yet
      specs: [
        { k: t("Displacement", "எஞ்சின் கொள்ளளவு", "එන්ජින් ධාරිතාව"), v: "2,982 cc", status: "published" },
        { k: t("Layout", "அமைப்பு", "සැකැස්ම"), v: "Inline 4-cyl, DOHC 16-valve", status: "published" },
        { k: t("Bore × Stroke", "Bore × Stroke", "Bore × Stroke"), v: "96.0 × 103.0 mm", status: "published" },
        { k: t("Firing order", "Firing order", "Firing order"), v: "1-3-4-2", status: "published" },
        { k: t("Fuel system", "எரிபொருள் அமைப்பு", "ඉන්ධන පද්ධතිය"), v: "Common-rail direct injection (Denso)", status: "published" },
        { k: t("Aspiration", "காற்று உள்ளீடு", "වාතය ඇතුළුවීම"), v: "Turbocharged (intercooler / turbo type depends on variant)", status: "pending" },
        { k: t("Power / Torque", "Power / Torque", "Power / Torque"), v: "", status: "pending" },
        { k: t("Compression ratio", "Compression ratio", "Compression ratio"), v: "", status: "pending" },
        { k: t("Engine oil capacity", "எஞ்சின் ஆயில் அளவு", "එන්ජින් ඔයිල් ප්‍රමාණය"), v: "", status: "pending" },
        { k: t("Injector type", "Injector வகை", "Injector වර්ගය"), v: "", status: "pending" }
      ]
    },
    /* Planned vehicles: listed so the picker shows how more makes will look.
       They have NO data pack yet (pack: null) — nothing is shown for them. */
    { id: "toyota_hilux_2016_1gdftv", make: "Toyota", model: "Hilux", chassis: "", year: 2016, engine: "1GD-FTV", fuel: "Diesel", pack: null, specs: [] },
    { id: "isuzu_dmax_2013_4jj1", make: "Isuzu", model: "D-Max", chassis: "", year: 2013, engine: "4JJ1-TCX", fuel: "Diesel", pack: null, specs: [] }
  ],

  /* ---------- 2. SYSTEM CATEGORIES (same list for every vehicle) ---------- */
  categories: [
    { id: "engine",      icon: "⚙️", name: t("Engine System", "எஞ்சின் அமைப்பு", "එන්ජින් පද්ධතිය") },
    { id: "electrical",  icon: "🔌", name: t("Electrical System", "மின் அமைப்பு", "විදුලි පද්ධතිය") },
    { id: "body",        icon: "🚐", name: t("Body Control System", "Body Control அமைப்பு", "Body Control පද්ධතිය") },
    { id: "abs",         icon: "🛑", name: t("ABS / Brake System", "ABS / பிரேக் அமைப்பு", "ABS / තිරිංග පද්ධතිය") },
    { id: "srs",         icon: "🎈", name: t("Airbag / SRS System", "Airbag / SRS அமைப்பு", "Airbag / SRS පද්ධතිය") },
    { id: "ac",          icon: "❄️", name: t("Air Conditioning System", "ஏசி அமைப்பு", "වායු සමීකරණ පද්ධතිය") },
    { id: "ecu",         icon: "🧠", name: t("ECU / ECM System", "ECU / ECM அமைப்பு", "ECU / ECM පද්ධතිය") },
    { id: "immobilizer", icon: "🔐", name: t("Immobilizer System", "Immobilizer அமைப்பு", "Immobilizer පද්ධතිය") },
    { id: "key",         icon: "🔑", name: t("Key Programming", "Key Programming", "Key Programming") },
    { id: "remote",      icon: "📡", name: t("Remote Control System", "Remote Control அமைப்பு", "Remote Control පද්ධතිය") },
    { id: "cluster",     icon: "📟", name: t("Dashboard / Instrument Cluster", "டாஷ்போர்டு / மீட்டர்", "ඩෑෂ්බෝඩ් / මීටර් පුවරුව") },
    { id: "special",     icon: "🛠️", name: t("Special Functions", "சிறப்பு செயல்பாடுகள்", "විශේෂ කාර්යයන්") },
    { id: "fuel",        icon: "⛽", name: t("Fuel System", "எரிபொருள் அமைப்பு", "ඉන්ධන පද්ධතිය") },
    { id: "transmission",icon: "🔧", name: t("Transmission System", "கியர்பாக்ஸ் அமைப்பு", "ගියර් පද්ධතිය") },
    { id: "wiring",      icon: "〰️", name: t("Wiring Diagrams", "வயரிங் டயகிராம்", "වයරින් රූප සටහන්") },
    { id: "sensors",     icon: "📍", name: t("Sensor Systems", "சென்சார் அமைப்புகள்", "සංවේදක පද්ධති") },
    { id: "repair",      icon: "📘", name: t("Repair Procedures", "ரிப்பேர் முறைகள்", "අලුත්වැඩියා ක්‍රම") }
  ],

  /* ---------- 3. DTC RECORDS ---------- */
  dtcs: [
    {
      id: "P0087",
      code: "P0087",
      system: ["fuel", "engine"],
      severity: "high",
      titleStatus: "published",
      title: t("Fuel Rail / System Pressure – Too Low",
               "Fuel Rail / System அழுத்தம் – மிகக் குறைவு",
               "Fuel Rail / පද්ධති පීඩනය – ඉතා අඩුයි"),
      meaning: t(
        "The ECM sees that the actual common-rail pressure is lower than the pressure it is asking for. The high-pressure pump cannot build or hold enough pressure.",
        "ECM கேட்கும் அழுத்தத்தை விட common-rail-இல் உள்ள உண்மையான அழுத்தம் குறைவாக இருக்கிறது. High-pressure pump போதுமான அழுத்தத்தை உருவாக்கவோ தக்கவைக்கவோ முடியவில்லை.",
        "ECM ඉල්ලන පීඩනයට වඩා common-rail එකේ සැබෑ පීඩනය අඩුයි. High-pressure pump එකට ප්‍රමාණවත් පීඩනයක් සෑදීමට හෝ රඳවා ගැනීමට නොහැක."
      ),
      applicability: { status: "published", text: t("Common on 1KD-FTV common-rail engines.", "1KD-FTV common-rail எஞ்சின்களில் பொதுவாக வரும் code.", "1KD-FTV common-rail එන්ජින්වල සුලබ code එකකි.") },
      causes: [
        { status: "general", text: t("Clogged fuel filter or water in fuel", "Fuel filter அடைப்பு அல்லது டீசலில் தண்ணீர்", "Fuel filter අවහිර වීම හෝ ඩීසල්වල ජලය") },
        { status: "general", text: t("Air entering on the suction side (loose clamp, cracked hose, low fuel level)", "Suction பக்கம் காற்று நுழைவு (தளர்ந்த clamp, விரிசல் hose, டேங்கில் டீசல் குறைவு)", "Suction පැත්තෙන් වාතය ඇතුළු වීම (ලිහිල් clamp, ඉරිතැලුණු hose, ඉන්ධන මට්ටම අඩු)") },
        { status: "general", text: t("Suction Control Valve (SCV) fault or wiring problem", "Suction Control Valve (SCV) பழுது அல்லது வயரிங் பிரச்சனை", "Suction Control Valve (SCV) දෝෂය හෝ වයරින් ගැටලුව") },
        { status: "general", text: t("Worn supply (high-pressure) pump", "Supply (high-pressure) pump தேய்மானம்", "Supply (high-pressure) pump ගෙවී යාම") },
        { status: "general", text: t("Injector internal leakage (too much return fuel)", "Injector உள் கசிவு (return fuel அதிகம்)", "Injector අභ්‍යන්තර කාන්දුව (return fuel වැඩියි)") },
        { status: "general", text: t("Rail pressure sensor or its wiring giving a wrong signal", "Rail pressure sensor அல்லது அதன் வயரிங் தவறான signal தருவது", "Rail pressure sensor හෝ එහි වයරින් වැරදි signal එකක් දීම") }
      ],
      symptoms: [
        t("Hard starting or no start", "ஸ்டார்ட் ஆக கஷ்டம் / ஸ்டார்ட் ஆகாது", "ස්ටාර්ට් වීමට අපහසුයි / ස්ටාර්ට් නොවේ"),
        t("Low power / limp mode", "பவர் குறைவு / limp mode", "බලය අඩුයි / limp mode"),
        t("Engine stalls under load", "லோட்டில் எஞ்சின் நின்றுவிடும்", "බර යටතේ එන්ජිම නතර වේ"),
        t("Check-engine light (MIL) ON", "Check-engine லைட் (MIL) எரியும்", "Check-engine ලයිට් (MIL) දැල්වේ")
      ],
      safety: t(
        "Common-rail pressure is extremely high. Never loosen injection pipes while the engine is running. Wait after shut-down before opening any high-pressure line. Fuel spray can penetrate skin.",
        "Common-rail அழுத்தம் மிக அதிகம். எஞ்சின் ஓடும்போது injection pipe-ஐ ஒருபோதும் தளர்த்த வேண்டாம். நிறுத்திய பிறகு சிறிது நேரம் காத்திருந்து தான் high-pressure line-ஐ திறக்கவும். டீசல் spray தோலுக்குள் ஊடுருவும் அபாயம் உண்டு.",
        "Common-rail පීඩනය අතිශයින් ඉහළයි. එන්ජිම ධාවනය වන විට injection pipe කිසිවිටෙක ලිහිල් නොකරන්න. නැවැත්වූ පසු high-pressure line විවෘත කිරීමට පෙර රැඳී සිටින්න. ඉන්ධන spray එක සමට විනිවිද යා හැක."
      ),
      diagnosis: [
        { level: "beginner", status: "general", text: t("Check fuel level and fuel quality. Drain the water separator.", "டீசல் அளவு மற்றும் தரத்தை பார்க்கவும். Water separator-ஐ drain செய்யவும்.", "ඉන්ධන මට්ටම සහ ගුණාත්මකභාවය පරීක්ෂා කරන්න. Water separator එක drain කරන්න.") },
        { level: "beginner", status: "general", text: t("Inspect suction-side hoses and clamps for air leaks or wetness.", "Suction பக்க hose, clamp-களில் காற்று கசிவு / ஈரம் உள்ளதா பார்க்கவும்.", "Suction පැත්තේ hose සහ clamp වල වාත කාන්දු හෝ තෙත් බව පරීක්ෂා කරන්න.") },
        { level: "beginner", status: "general", text: t("Replace / inspect the fuel filter, then bleed air with the hand priming pump.", "Fuel filter-ஐ சோதிக்கவும் / மாற்றவும், பிறகு hand priming pump மூலம் காற்றை வெளியேற்றவும்.", "Fuel filter එක පරීක්ෂා කරන්න / මාරු කරන්න, පසුව hand priming pump එකෙන් වාතය ඉවත් කරන්න.") },
        { level: "advanced", status: "general", text: t("With a scanner, compare ACTUAL rail pressure with TARGET rail pressure at idle and during a snap-throttle. (Item names vary by scan tool.)", "Scanner மூலம் idle மற்றும் throttle அழுத்தும்போது ACTUAL rail pressure-ஐ TARGET rail pressure உடன் ஒப்பிடவும். (Scanner-க்கு ஏற்ப பெயர்கள் மாறும்.)", "Scanner එකෙන් idle හා throttle එක ඉක්මනින් තද කරන විට ACTUAL rail pressure එක TARGET rail pressure සමඟ සසඳන්න. (Scanner අනුව නම් වෙනස් වේ.)") },
        { level: "advanced", status: "general", text: t("Perform an injector back-leak (return quantity) comparison test between cylinders.", "சிலிண்டர்களுக்கு இடையே injector back-leak (return அளவு) ஒப்பீட்டு சோதனை செய்யவும்.", "සිලින්ඩර් අතර injector back-leak (return ප්‍රමාණය) සංසන්දන පරීක්ෂණය කරන්න.") },
        { level: "advanced", status: "general", text: t("Check SCV and rail-pressure-sensor wiring and connectors (see Wiring Inspection).", "SCV மற்றும் rail pressure sensor வயரிங், connector-களை சோதிக்கவும் (Wiring Inspection பார்க்கவும்).", "SCV සහ rail pressure sensor වයරින් සහ connector පරීක්ෂා කරන්න (Wiring Inspection බලන්න).") }
      ],
      wiring: [
        { status: "general", text: t("Look for chafed harness near the supply pump and rail; check connector locks and corrosion.", "Supply pump, rail அருகே harness தேய்வு உள்ளதா; connector lock மற்றும் துரு பார்க்கவும்.", "Supply pump සහ rail අසල harness ගෙවී ඇත්දැයි, connector lock සහ මලකඩ පරීක්ෂා කරන්න.") },
        { status: "general", text: t("Do a wiggle test on the harness while watching rail pressure on the scanner.", "Scanner-இல் rail pressure பார்த்தபடி harness-ஐ அசைத்து (wiggle test) சோதிக்கவும்.", "Scanner එකේ rail pressure බලමින් harness එක සොලවා (wiggle test) පරීක්ෂා කරන්න.") }
      ],
      pins: { status: "pending", rows: [
        { item: "Rail pressure sensor — 5 V supply", connector: "", pin: "", ecmPin: "" },
        { item: "Rail pressure sensor — signal", connector: "", pin: "", ecmPin: "" },
        { item: "Rail pressure sensor — ground", connector: "", pin: "", ecmPin: "" },
        { item: "SCV — control (+ / −)", connector: "", pin: "", ecmPin: "" }
      ] },
      sensorTest: [
        { status: "general", text: t("Rail pressure sensors are usually 3-wire: 5 V reference, ground, signal. Back-probe with the connector plugged in; do not pierce insulation.", "Rail pressure sensor பொதுவாக 3-wire: 5 V reference, ground, signal. Connector இணைத்தபடியே back-probe செய்யவும்; insulation-ஐ குத்த வேண்டாம்.", "Rail pressure sensor සාමාන්‍යයෙන් 3-wire: 5 V reference, ground, signal. Connector එක සවි කර තිබියදී back-probe කරන්න; insulation සිදුරු නොකරන්න.") }
      ],
      meterValues: { status: "pending", rows: [
        { test: t("Sensor 5 V supply (ignition ON)", "Sensor 5 V supply (ignition ON)", "Sensor 5 V supply (ignition ON)"), expected: "" },
        { test: t("Sensor signal at idle", "Idle-இல் sensor signal", "Idle හිදී sensor signal"), expected: "" },
        { test: t("SCV coil resistance (20 °C)", "SCV coil resistance (20 °C)", "SCV coil resistance (20 °C)"), expected: "" }
      ] },
      scanner: [
        { status: "general", text: t("Read freeze-frame data first: engine speed, coolant temp, rail pressure when the code set.", "முதலில் freeze-frame data பார்க்கவும்: code வந்தபோது RPM, coolant temp, rail pressure.", "මුලින්ම freeze-frame data කියවන්න: code එක සැකසුණු විට RPM, coolant temp, rail pressure.") },
        { status: "general", text: t("Monitor actual vs target rail pressure; a large gap that grows with load points to supply-side problems.", "Actual vs target rail pressure கண்காணிக்கவும்; லோடு அதிகரிக்கும்போது இடைவெளி அதிகரித்தால் supply பக்க பிரச்சனை.", "Actual vs target rail pressure නිරීක්ෂණය කරන්න; බර වැඩි වන විට පරතරය වැඩි වේ නම් supply පැත්තේ ගැටලුවකි.") }
      ],
      repair: [
        { status: "general", text: t("Fix the root cause found (filter, air leak, SCV, pump, injector).", "கண்டறிந்த மூல காரணத்தை சரிசெய்யவும் (filter, air leak, SCV, pump, injector).", "සොයාගත් මූල හේතුව නිවැරදි කරන්න (filter, air leak, SCV, pump, injector).") },
        { status: "pending", text: t("After supply-pump replacement, a pump initialization / learning with a scanner may be required — confirm in RM.", "Supply pump மாற்றிய பின் scanner மூலம் pump initialization / learning தேவைப்படலாம் — RM-இல் உறுதிசெய்யவும்.", "Supply pump මාරු කිරීමෙන් පසු scanner එකෙන් pump initialization / learning අවශ්‍ය විය හැක — RM හි තහවුරු කරන්න.") },
        { status: "general", text: t("After injector replacement, register the injector compensation codes (see Special Functions).", "Injector மாற்றிய பின் injector compensation code-களை பதிவு செய்யவும் (Special Functions பார்க்கவும்).", "Injector මාරු කිරීමෙන් පසු injector compensation codes ලියාපදිංචි කරන්න (Special Functions බලන්න).") }
      ],
      parts: [
        { name: t("Fuel filter element", "Fuel filter element", "Fuel filter element"), partNo: "", status: "pending" },
        { name: t("Suction Control Valve (SCV)", "Suction Control Valve (SCV)", "Suction Control Valve (SCV)"), partNo: "", status: "pending" },
        { name: t("Supply pump assembly", "Supply pump assembly", "Supply pump assembly"), partNo: "", status: "pending" },
        { name: t("Fuel rail pressure sensor", "Fuel rail pressure sensor", "Fuel rail pressure sensor"), partNo: "", status: "pending" }
      ],
      verify: [
        t("Clear the DTC and start the engine.", "DTC-ஐ clear செய்து எஞ்சினை ஸ்டார்ட் செய்யவும்.", "DTC එක clear කර එන්ජිම ස්ටාර්ට් කරන්න."),
        t("Idle until normal temperature, then road test with full-load acceleration.", "சாதாரண வெப்பநிலை வரை idle செய்து, பிறகு full-load acceleration-உடன் road test செய்யவும்.", "සාමාන්‍ය උෂ්ණත්වය දක්වා idle කර, පසුව full-load acceleration සමඟ road test කරන්න."),
        t("Re-check actual vs target rail pressure and confirm the DTC does not return.", "Actual vs target rail pressure மீண்டும் பார்த்து DTC திரும்ப வரவில்லை என உறுதிசெய்யவும்.", "Actual vs target rail pressure නැවත බලා DTC එක නැවත නොඑන බව තහවුරු කරන්න.")
      ],
      related: ["P0088", "P0093", "P0190", "P0627"]
    },

    {
      id: "P0100",
      code: "P0100",
      system: ["engine", "sensors"],
      severity: "medium",
      titleStatus: "published",
      title: t("Mass or Volume Air Flow Sensor Circuit", "Mass Air Flow (MAF) சென்சார் சர்க்யூட்", "Mass Air Flow (MAF) සංවේදක පරිපථය"),
      meaning: t(
        "The ECM sees a MAF signal that is out of range or missing — usually an electrical (circuit) fault, not a dirty sensor.",
        "ECM-க்கு வரும் MAF signal வரம்புக்கு வெளியே அல்லது இல்லை — பெரும்பாலும் மின் (circuit) பழுது, அழுக்கான சென்சார் அல்ல.",
        "ECM ට ලැබෙන MAF signal එක පරාසයෙන් පිටත හෝ නැත — සාමාන්‍යයෙන් විදුලි (circuit) දෝෂයකි, අපිරිසිදු සංවේදකයක් නොවේ."
      ),
      applicability: { status: "pending", text: t("Confirm exact Toyota DTC definition for this vehicle in RM.", "இந்த வாகனத்திற்கான சரியான Toyota DTC விளக்கத்தை RM-இல் உறுதிசெய்யவும்.", "මෙම වාහනය සඳහා නිවැරදි Toyota DTC අර්ථය RM හි තහවුරු කරන්න.") },
      causes: [
        { status: "general", text: t("Open or short in MAF wiring / connector", "MAF வயரிங் / connector-இல் open அல்லது short", "MAF වයරින් / connector එකේ open හෝ short") },
        { status: "general", text: t("MAF sensor internal failure", "MAF சென்சார் உள் பழுது", "MAF සංවේදකයේ අභ්‍යන්තර දෝෂය") },
        { status: "general", text: t("Blown fuse / poor ground for the sensor supply", "Sensor supply fuse போனது / ground மோசம்", "Sensor supply fuse පිපිරීම / දුර්වල ground") }
      ],
      symptoms: [
        t("Low power, poor acceleration", "பவர் குறைவு, pickup மோசம்", "බලය අඩුයි, ත්වරණය දුර්වලයි"),
        t("Black smoke", "கருப்பு புகை", "කළු දුම"),
        t("MIL ON", "MIL எரியும்", "MIL දැල්වේ")
      ],
      safety: t("Do not touch the hot-wire element. Clean only with dedicated MAF cleaner spray.", "Hot-wire பகுதியை தொட வேண்டாம். MAF cleaner spray மட்டுமே பயன்படுத்தவும்.", "Hot-wire කොටස ස්පර්ශ නොකරන්න. MAF cleaner spray පමණක් භාවිතා කරන්න."),
      diagnosis: [
        { level: "beginner", status: "general", text: t("Check the connector is fully locked and pins are clean.", "Connector சரியாக lock ஆகியுள்ளதா, pin-கள் சுத்தமா என பார்க்கவும்.", "Connector එක හොඳින් lock වී ඇත්දැයි, pins පිරිසිදු දැයි පරීක්ෂා කරන්න.") },
        { level: "beginner", status: "general", text: t("Check the fuse feeding the sensor (see Manual Diagnosis → Fuse check).", "Sensor-க்கு power தரும் fuse-ஐ சோதிக்கவும் (Manual Diagnosis → Fuse check).", "සංවේදකයට බලය දෙන fuse එක පරීක්ෂා කරන්න (Manual Diagnosis → Fuse check).") },
        { level: "advanced", status: "general", text: t("Back-probe supply, ground and signal; compare with RM values.", "Supply, ground, signal-ஐ back-probe செய்து RM மதிப்புகளுடன் ஒப்பிடவும்.", "Supply, ground සහ signal back-probe කර RM අගයන් සමඟ සසඳන්න.") },
        { level: "advanced", status: "general", text: t("Do a voltage-drop test on the ground circuit.", "Ground circuit-இல் voltage-drop சோதனை செய்யவும்.", "Ground පරිපථයේ voltage-drop පරීක්ෂණය කරන්න.") }
      ],
      wiring: [ { status: "general", text: t("Inspect harness between air-cleaner and ECM for rubbing or rodent damage.", "Air-cleaner முதல் ECM வரை harness தேய்வு / எலி கடி உள்ளதா பார்க்கவும்.", "Air-cleaner සිට ECM දක්වා harness ගෙවීම / මීයන්ගේ හානි පරීක්ෂා කරන්න.") } ],
      pins: { status: "pending", rows: [
        { item: "MAF — power supply", connector: "", pin: "", ecmPin: "" },
        { item: "MAF — signal", connector: "", pin: "", ecmPin: "" },
        { item: "MAF — ground", connector: "", pin: "", ecmPin: "" }
      ] },
      sensorTest: [ { status: "general", text: t("A good MAF signal rises smoothly as engine speed rises. A flat or jumpy signal indicates a fault.", "நல்ல MAF signal, RPM உயரும்போது சீராக உயரும். நிலையாக அல்லது துள்ளினால் பழுது.", "හොඳ MAF signal එකක් RPM වැඩි වන විට සුමටව ඉහළ යයි. නොවෙනස්ව හෝ පැනීම් ඇත්නම් දෝෂයකි.") } ],
      meterValues: { status: "pending", rows: [
        { test: t("Supply voltage (ignition ON)", "Supply voltage (ignition ON)", "Supply voltage (ignition ON)"), expected: "" },
        { test: t("Signal at idle", "Idle-இல் signal", "Idle හිදී signal"), expected: "" }
      ] },
      scanner: [ { status: "general", text: t("Watch MAF value (g/s) at idle and at 2,500 rpm; compare with a known-good vehicle or RM.", "Idle மற்றும் 2,500 rpm-இல் MAF மதிப்பு (g/s) பார்த்து, நல்ல வாகனம் அல்லது RM உடன் ஒப்பிடவும்.", "Idle හා 2,500 rpm හිදී MAF අගය (g/s) බලා හොඳ වාහනයක් හෝ RM සමඟ සසඳන්න.") } ],
      repair: [ { status: "general", text: t("Repair wiring / connector, or replace the MAF sensor if circuit is good.", "வயரிங் / connector சரிசெய்யவும்; circuit நன்றாக இருந்தால் MAF சென்சாரை மாற்றவும்.", "වයරින් / connector අලුත්වැඩියා කරන්න; පරිපථය හොඳ නම් MAF සංවේදකය මාරු කරන්න.") } ],
      parts: [ { name: t("MAF sensor", "MAF சென்சார்", "MAF සංවේදකය"), partNo: "", status: "pending" } ],
      verify: [ t("Clear DTC, road test, confirm MAF readings are stable.", "DTC clear செய்து road test, MAF மதிப்பு நிலையாக உள்ளதா உறுதிசெய்யவும்.", "DTC clear කර road test කර, MAF අගයන් ස්ථාවර බව තහවුරු කරන්න.") ],
      related: ["P0101", "P0102", "P0103", "P0400"]
    },

    {
      id: "P0400",
      code: "P0400",
      system: ["engine"],
      severity: "medium",
      titleStatus: "published",
      title: t("Exhaust Gas Recirculation (EGR) Flow", "Exhaust Gas Recirculation (EGR) ஓட்டம்", "Exhaust Gas Recirculation (EGR) ප්‍රවාහය"),
      meaning: t("EGR flow is not what the ECM expects — usually a carbon-blocked or stuck EGR valve or a clogged EGR cooler.", "ECM எதிர்பார்க்கும் அளவுக்கு EGR ஓட்டம் இல்லை — பெரும்பாலும் carbon அடைத்த / மாட்டிக்கொண்ட EGR valve அல்லது அடைத்த EGR cooler.", "ECM බලාපොරොත්තු වන EGR ප්‍රවාහය නැත — සාමාන්‍යයෙන් carbon වලින් අවහිර වූ / සිරවූ EGR valve එකක් හෝ අවහිර EGR cooler එකක්."),
      applicability: { status: "pending", text: t("EGR actuator type (vacuum or electric) depends on engine version — confirm in RM.", "EGR actuator வகை (vacuum / electric) எஞ்சின் version-க்கு ஏற்ப மாறும் — RM-இல் உறுதிசெய்யவும்.", "EGR actuator වර්ගය (vacuum / electric) එන්ජින් version අනුව වෙනස් වේ — RM හි තහවුරු කරන්න.") },
      causes: [
        { status: "general", text: t("Carbon build-up in EGR valve / intake", "EGR valve / intake-இல் carbon சேர்வு", "EGR valve / intake හි carbon එකතු වීම") },
        { status: "general", text: t("Clogged EGR cooler", "EGR cooler அடைப்பு", "EGR cooler අවහිර වීම") },
        { status: "general", text: t("EGR actuator, vacuum line or wiring fault", "EGR actuator, vacuum line அல்லது வயரிங் பழுது", "EGR actuator, vacuum line හෝ වයරින් දෝෂය") }
      ],
      symptoms: [ t("Rough idle", "Idle சீராக இல்லை", "Idle අස්ථාවරයි"), t("Black smoke, low power", "கருப்பு புகை, பவர் குறைவு", "කළු දුම, බලය අඩුයි"), t("MIL ON", "MIL எரியும்", "MIL දැල්වේ") ],
      safety: t("EGR parts are very hot after running. Let the engine cool.", "எஞ்சின் ஓடிய பின் EGR பகுதிகள் மிகவும் சூடாக இருக்கும். குளிர விடவும்.", "ධාවනයෙන් පසු EGR කොටස් ඉතා උණුසුම්ය. එන්ජිම සිසිල් වීමට ඉඩ දෙන්න."),
      diagnosis: [
        { level: "beginner", status: "general", text: t("Check vacuum hoses / connector on the EGR actuator.", "EGR actuator-இல் vacuum hose / connector சோதிக்கவும்.", "EGR actuator හි vacuum hose / connector පරීක්ෂා කරන්න.") },
        { level: "advanced", status: "general", text: t("Use scanner active test to command EGR and watch MAF change.", "Scanner active test மூலம் EGR-ஐ இயக்கி MAF மாற்றத்தை கவனிக்கவும்.", "Scanner active test එකෙන් EGR ක්‍රියාත්මක කර MAF වෙනස නිරීක්ෂණය කරන්න.") },
        { level: "advanced", status: "general", text: t("Remove and inspect EGR valve and cooler for carbon.", "EGR valve, cooler-ஐ கழற்றி carbon உள்ளதா பார்க்கவும்.", "EGR valve සහ cooler ගලවා carbon තිබේදැයි පරීක්ෂා කරන්න.") }
      ],
      wiring: [ { status: "general", text: t("Check actuator connector and harness near the hot exhaust side.", "Hot exhaust பக்கம் அருகே actuator connector, harness சோதிக்கவும்.", "උණුසුම් exhaust පැත්ත අසල actuator connector සහ harness පරීක්ෂා කරන්න.") } ],
      pins: { status: "pending", rows: [ { item: "EGR actuator / position sensor", connector: "", pin: "", ecmPin: "" } ] },
      sensorTest: [ { status: "general", text: t("If an EGR position sensor is fitted, its signal should change smoothly as the valve opens.", "EGR position sensor இருந்தால், valve திறக்கும்போது signal சீராக மாற வேண்டும்.", "EGR position sensor එකක් ඇත්නම්, valve එක විවෘත වන විට signal සුමටව වෙනස් විය යුතුය.") } ],
      meterValues: { status: "pending", rows: [ { test: t("Actuator resistance / position signal", "Actuator resistance / position signal", "Actuator resistance / position signal"), expected: "" } ] },
      scanner: [ { status: "general", text: t("Active test: EGR open/close; MAF reading should drop when EGR opens.", "Active test: EGR open/close; EGR திறக்கும்போது MAF மதிப்பு குறைய வேண்டும்.", "Active test: EGR open/close; EGR විවෘත වන විට MAF අගය අඩු විය යුතුය.") } ],
      repair: [ { status: "general", text: t("Clean or replace EGR valve; clean intake; replace cooler if blocked.", "EGR valve-ஐ சுத்தம் / மாற்றவும்; intake சுத்தம்; cooler அடைத்திருந்தால் மாற்றவும்.", "EGR valve පිරිසිදු කරන්න / මාරු කරන්න; intake පිරිසිදු කරන්න; cooler අවහිර නම් මාරු කරන්න.") } ],
      parts: [ { name: t("EGR valve assembly", "EGR valve assembly", "EGR valve assembly"), partNo: "", status: "pending" }, { name: t("EGR gaskets", "EGR gasket-கள்", "EGR gaskets"), partNo: "", status: "pending" } ],
      verify: [ t("Clear DTC, run active test again, road test.", "DTC clear, active test மீண்டும், road test.", "DTC clear කර, active test නැවත කර, road test කරන්න.") ],
      related: ["P0100", "P0401", "P0403"]
    },

    {
      id: "U0100",
      code: "U0100",
      system: ["ecu", "electrical"],
      severity: "high",
      titleStatus: "published",
      title: t("Lost Communication With ECM / PCM", "ECM / PCM உடன் தொடர்பு இழப்பு", "ECM / PCM සමඟ සන්නිවේදනය අහිමි විය"),
      meaning: t("Another control unit cannot hear the engine ECM on the network (CAN).", "Network (CAN)-இல் மற்ற control unit-களுக்கு எஞ்சின் ECM-இன் தகவல் கிடைக்கவில்லை.", "Network (CAN) එකේ වෙනත් control unit වලට එන්ජින් ECM එකේ පණිවිඩ නොලැබේ."),
      applicability: { status: "pending", text: t("Confirm which network type this vehicle uses in RM.", "இந்த வாகனம் எந்த network வகை என்பதை RM-இல் உறுதிசெய்யவும்.", "මෙම වාහනය භාවිතා කරන network වර්ගය RM හි තහවුරු කරන්න.") },
      causes: [
        { status: "general", text: t("ECM has no power or ground (fuse, relay, ground point)", "ECM-க்கு power / ground இல்லை (fuse, relay, ground point)", "ECM ට power / ground නැත (fuse, relay, ground point)") },
        { status: "general", text: t("CAN wires open, shorted, or corroded connector", "CAN wire open / short அல்லது connector துரு", "CAN wire open / short හෝ connector මලකඩ") },
        { status: "general", text: t("Low battery voltage during cranking", "Cranking-இல் பேட்டரி voltage குறைவு", "Cranking අතරතුර බැටරි voltage අඩුයි") }
      ],
      symptoms: [ t("No start or multiple warning lights", "ஸ்டார்ட் ஆகாது / பல warning lights", "ස්ටාර්ට් නොවේ / බොහෝ warning lights"), t("Scanner cannot connect to engine ECM", "Scanner எஞ்சின் ECM-உடன் இணையாது", "Scanner එකට එන්ජින් ECM එකට සම්බන්ධ විය නොහැක") ],
      safety: t("Disconnect the battery before measuring network resistance.", "Network resistance அளக்கும் முன் பேட்டரியை துண்டிக்கவும்.", "Network resistance මැනීමට පෙර බැටරිය විසන්ධි කරන්න."),
      diagnosis: [
        { level: "beginner", status: "general", text: t("Check battery voltage and ECM fuses first.", "முதலில் பேட்டரி voltage, ECM fuse-களை சோதிக்கவும்.", "මුලින්ම බැටරි voltage සහ ECM fuses පරීක්ෂා කරන්න.") },
        { level: "advanced", status: "general", text: t("Battery disconnected: measure resistance between DLC pin 6 (CAN-H) and pin 14 (CAN-L). About 60 Ω = both terminators OK; about 120 Ω = one terminator/branch open.", "பேட்டரி துண்டித்து: DLC pin 6 (CAN-H) மற்றும் pin 14 (CAN-L) இடையே resistance அளக்கவும். சுமார் 60 Ω = இரண்டு terminator சரி; சுமார் 120 Ω = ஒன்று open.", "බැටරිය විසන්ධි කර: DLC pin 6 (CAN-H) සහ pin 14 (CAN-L) අතර resistance මනින්න. ආසන්න 60 Ω = terminators දෙකම හොඳයි; ආසන්න 120 Ω = එකක් open.") }
      ],
      wiring: [ { status: "general", text: t("Inspect ECM ground points and the main CAN junction connector.", "ECM ground point-கள், main CAN junction connector-ஐ சோதிக்கவும்.", "ECM ground points සහ ප්‍රධාන CAN junction connector පරීක්ෂා කරන්න.") } ],
      pins: { status: "published", rows: [
        { item: "DLC (OBD-II) — CAN-H", connector: "DLC3 (SAE J1962)", pin: "6", ecmPin: "" },
        { item: "DLC (OBD-II) — CAN-L", connector: "DLC3 (SAE J1962)", pin: "14", ecmPin: "" },
        { item: "DLC (OBD-II) — Battery +", connector: "DLC3 (SAE J1962)", pin: "16", ecmPin: "" },
        { item: "DLC (OBD-II) — Chassis / Signal ground", connector: "DLC3 (SAE J1962)", pin: "4 / 5", ecmPin: "" }
      ] },
      sensorTest: [],
      meterValues: { status: "general", rows: [
        { test: t("CAN-H ↔ CAN-L resistance (battery off)", "CAN-H ↔ CAN-L resistance (பேட்டரி off)", "CAN-H ↔ CAN-L resistance (බැටරිය off)"), expected: "≈ 60 Ω (standard high-speed CAN)" }
      ] },
      scanner: [ { status: "general", text: t("Run a network/health check to see which units respond.", "எந்த unit பதில் தருகிறது என்று network/health check இயக்கவும்.", "ප්‍රතිචාර දක්වන units මොනවාදැයි බැලීමට network/health check එකක් කරන්න.") } ],
      repair: [ { status: "general", text: t("Restore ECM power/ground or repair CAN wiring.", "ECM power/ground-ஐ சரிசெய்யவும் அல்லது CAN வயரிங் சரிசெய்யவும்.", "ECM power/ground යථා තත්ත්වයට පත් කරන්න හෝ CAN වයරින් අලුත්වැඩියා කරන්න.") } ],
      parts: [],
      verify: [ t("Clear all DTCs in all units, cycle ignition, re-scan.", "எல்லா unit-களிலும் DTC clear, ignition off/on, மீண்டும் scan.", "සියලු units වල DTC clear කර, ignition off/on කර, නැවත scan කරන්න.") ],
      related: ["U0101", "U0121", "U0155"]
    },

    {
      id: "C1201",
      code: "C1201",
      system: ["abs"],
      severity: "low",
      titleStatus: "published",
      title: t("Engine Control System Malfunction (Toyota ABS/VSC)", "Engine Control System பழுது (Toyota ABS/VSC)", "Engine Control System දෝෂය (Toyota ABS/VSC)"),
      meaning: t("The brake/VSC ECU stores this because the engine ECM reported a fault. Repair the engine DTC first.", "எஞ்சின் ECM பழுது தெரிவித்ததால் brake/VSC ECU இதை பதிவு செய்கிறது. முதலில் எஞ்சின் DTC-ஐ சரிசெய்யவும்.", "එන්ජින් ECM දෝෂයක් වාර්තා කළ නිසා brake/VSC ECU මෙය සටහන් කරයි. මුලින්ම එන්ජින් DTC එක නිවැරදි කරන්න."),
      applicability: { status: "pending", text: t("Only on vehicles equipped with VSC — confirm for this model.", "VSC உள்ள வாகனங்களில் மட்டும் — இந்த model-க்கு உறுதிசெய்யவும்.", "VSC ඇති වාහනවල පමණි — මෙම model එක සඳහා තහවුරු කරන්න.") },
      causes: [ { status: "general", text: t("Any engine ECM DTC is present", "எஞ்சின் ECM-இல் ஏதாவது DTC உள்ளது", "එන්ජින් ECM හි ඕනෑම DTC එකක් ඇත") } ],
      symptoms: [ t("ABS / VSC / slip warning light ON", "ABS / VSC / slip warning லைட் எரியும்", "ABS / VSC / slip warning ලයිට් දැල්වේ") ],
      safety: null,
      diagnosis: [ { level: "beginner", status: "general", text: t("Read engine DTCs, repair them, then clear codes in both ECUs.", "எஞ்சின் DTC-களை படித்து சரிசெய்து, இரண்டு ECU-விலும் code clear செய்யவும்.", "එන්ජින් DTC කියවා නිවැරදි කර, ECU දෙකෙහිම codes clear කරන්න.") } ],
      wiring: [], pins: { status: "pending", rows: [] }, sensorTest: [], meterValues: { status: "pending", rows: [] },
      scanner: [ { status: "general", text: t("Scan both engine and ABS/VSC systems.", "எஞ்சின், ABS/VSC இரண்டையும் scan செய்யவும்.", "එන්ජින් සහ ABS/VSC දෙකම scan කරන්න.") } ],
      repair: [ { status: "general", text: t("No ABS part replacement needed for this code alone.", "இந்த code-க்கு மட்டும் ABS பாகம் மாற்ற வேண்டியதில்லை.", "මෙම code එකට පමණක් ABS කොටස් මාරු කිරීම අවශ්‍ය නැත.") } ],
      parts: [],
      verify: [ t("Clear codes, drive above 20 km/h, confirm light stays off.", "Code clear செய்து 20 km/h-க்கு மேல் ஓட்டி லைட் அணைந்தே உள்ளதா பார்க்கவும்.", "Codes clear කර 20 km/h ට වඩා ධාවනය කර ලයිට් නිවී පවතින බව තහවුරු කරන්න.") ],
      related: ["P0087", "P0100"]
    },

    {
      id: "B1421",
      code: "B1421",
      system: ["ac", "sensors"],
      severity: "low",
      titleStatus: "published",
      title: t("Solar Sensor Circuit (Toyota A/C)", "Solar Sensor சர்க்யூட் (Toyota A/C)", "Solar Sensor පරිපථය (Toyota A/C)"),
      meaning: t("The A/C amplifier sees an open/short in the solar (sunlight) sensor circuit.", "A/C amplifier-க்கு solar (சூரிய ஒளி) சென்சார் circuit-இல் open/short தெரிகிறது.", "A/C amplifier එකට solar (හිරු එළිය) සංවේදක පරිපථයේ open/short එකක් පෙනේ."),
      applicability: { status: "pending", text: t("Only with automatic A/C. Note: this code can set when testing in a dark workshop — confirm in RM.", "Automatic A/C உள்ள வாகனங்களில் மட்டும். இருட்டான workshop-இல் சோதிக்கும்போதும் இந்த code வரலாம் — RM-இல் உறுதிசெய்யவும்.", "Automatic A/C ඇති විට පමණි. අඳුරු workshop එකක පරීක්ෂා කරන විටද මෙම code එක සැකසිය හැක — RM හි තහවුරු කරන්න.") },
      causes: [ { status: "general", text: t("Sensor connector loose, wiring open, sensor failed", "Sensor connector தளர்வு, வயரிங் open, sensor பழுது", "Sensor connector ලිහිල්, වයරින් open, සංවේදකය දෝෂ සහිතයි") } ],
      symptoms: [ t("Usually none, or A/C auto mode feels wrong", "பொதுவாக அறிகுறி இல்லை, அல்லது A/C auto mode சரியில்லை", "සාමාන්‍යයෙන් රෝග ලක්ෂණ නැත, හෝ A/C auto mode වැරදියි") ],
      safety: null,
      diagnosis: [ { level: "beginner", status: "general", text: t("Shine a bright light on the sensor and re-check the code.", "Sensor மீது பிரகாசமான ஒளி காட்டி code-ஐ மீண்டும் சோதிக்கவும்.", "සංවේදකයට දීප්තිමත් ආලෝකයක් යොමු කර code එක නැවත පරීක්ෂා කරන්න.") } ],
      wiring: [], pins: { status: "pending", rows: [] }, sensorTest: [], meterValues: { status: "pending", rows: [] },
      scanner: [], repair: [], parts: [],
      verify: [ t("Clear code with sensor exposed to light.", "Sensor-க்கு ஒளி படும் நிலையில் code clear செய்யவும்.", "සංවේදකයට ආලෝකය වැටෙන විට code එක clear කරන්න.") ],
      related: []
    }
  ],

  /* ---------- 4. REPAIR PROCEDURES ---------- */
  procedures: [
    {
      id: "fuel_filter_bleed",
      system: "fuel",
      level: "beginner",
      title: t("Fuel filter replacement and air bleeding", "Fuel filter மாற்றம் மற்றும் காற்று வெளியேற்றம்", "Fuel filter මාරු කිරීම සහ වාතය ඉවත් කිරීම"),
      time: "30–45 min",
      tools: t("Filter wrench, drain tray, rags", "Filter wrench, drain tray, துணி", "Filter wrench, drain tray, රෙදි"),
      warning: t("Diesel on hot exhaust is a fire risk. Keep the area clean and dry.", "சூடான exhaust மேல் டீசல் பட்டால் தீ அபாயம். இடத்தை சுத்தமாக வைக்கவும்.", "උණුසුම් exhaust මත ඩීසල් වැටීම ගිනි අවදානමකි. ප්‍රදේශය පිරිසිදුව තබා ගන්න."),
      steps: [
        { status: "general", text: t("Turn ignition OFF. Place drain tray under the filter.", "Ignition OFF செய்யவும். Filter-க்கு கீழே drain tray வைக்கவும்.", "Ignition OFF කරන්න. Filter එකට යටින් drain tray එක තබන්න.") },
        { status: "general", text: t("Drain water from the separator, disconnect the water-warning sensor connector (if fitted).", "Separator-இல் இருந்து தண்ணீர் வடிக்கவும், water-warning sensor connector-ஐ துண்டிக்கவும் (இருந்தால்).", "Separator එකෙන් ජලය බැහැර කර, water-warning sensor connector එක ගලවන්න (ඇත්නම්).") },
        { status: "general", text: t("Remove the old filter element. Lightly oil the new O-ring with clean diesel.", "பழைய filter element-ஐ கழற்றவும். புதிய O-ring-க்கு சுத்தமான டீசல் தடவவும்.", "පැරණි filter element එක ගලවන්න. නව O-ring එකට පිරිසිදු ඩීසල් ස්වල්පයක් ආලේප කරන්න.") },
        { status: "pending", text: t("Fit new filter and tighten to the specified torque.", "புதிய filter பொருத்தி குறிப்பிட்ட torque-க்கு இறுக்கவும்.", "නව filter එක සවි කර නියමිත torque එකට තද කරන්න."), value: "" },
        { status: "general", text: t("Operate the hand priming pump until it becomes firm.", "Hand priming pump கடினமாகும் வரை அழுத்தவும்.", "Hand priming pump එක තද වන තුරු ක්‍රියාත්මක කරන්න.") },
        { status: "general", text: t("Start engine, check for leaks, clear any fuel-related DTCs.", "எஞ்சின் ஸ்டார்ட் செய்து கசிவு பார்க்கவும், fuel தொடர்பான DTC-களை clear செய்யவும்.", "එන්ජිම ස්ටාර්ට් කර කාන්දු පරීක්ෂා කර, ඉන්ධන ආශ්‍රිත DTC clear කරන්න.") }
      ],
      relatedDtc: ["P0087"]
    },
    {
      id: "maf_inspect_clean",
      system: "sensors",
      level: "beginner",
      title: t("MAF sensor inspection and cleaning", "MAF சென்சார் சோதனை மற்றும் சுத்தம்", "MAF සංවේදකය පරීක්ෂා කිරීම සහ පිරිසිදු කිරීම"),
      time: "15 min",
      tools: t("MAF cleaner spray, screwdriver", "MAF cleaner spray, screwdriver", "MAF cleaner spray, screwdriver"),
      warning: t("Never touch or brush the sensing element.", "Sensing element-ஐ தொடவோ brush செய்யவோ வேண்டாம்.", "Sensing element එක ස්පර්ශ කිරීම හෝ brush කිරීම කිසිසේත් නොකරන්න."),
      steps: [
        { status: "general", text: t("Ignition OFF, disconnect the MAF connector.", "Ignition OFF, MAF connector துண்டிக்கவும்.", "Ignition OFF, MAF connector එක ගලවන්න.") },
        { status: "general", text: t("Remove the sensor from the air duct.", "Air duct-இல் இருந்து சென்சாரை கழற்றவும்.", "Air duct එකෙන් සංවේදකය ඉවත් කරන්න.") },
        { status: "general", text: t("Spray MAF cleaner only; let it dry fully (no compressed air).", "MAF cleaner மட்டும் spray செய்து முழுமையாக உலர விடவும் (compressed air வேண்டாம்).", "MAF cleaner පමණක් spray කර සම්පූර්ණයෙන් වියළීමට ඉඩ දෙන්න (compressed air එපා).") },
        { status: "general", text: t("Refit, reconnect, clear DTC and road test.", "மீண்டும் பொருத்தி, connector இணைத்து, DTC clear செய்து road test.", "නැවත සවි කර, connector සම්බන්ධ කර, DTC clear කර road test කරන්න.") }
      ],
      relatedDtc: ["P0100"]
    },
    {
      id: "egr_clean",
      system: "engine",
      level: "advanced",
      title: t("EGR valve removal and cleaning", "EGR valve கழற்றல் மற்றும் சுத்தம்", "EGR valve ගැලවීම සහ පිරිසිදු කිරීම"),
      time: "1–2 h",
      tools: t("Socket set, scraper, carbon cleaner, new gaskets", "Socket set, scraper, carbon cleaner, புதிய gasket", "Socket set, scraper, carbon cleaner, නව gaskets"),
      warning: t("Work only on a cold engine. Always fit new gaskets.", "குளிர்ந்த எஞ்சினில் மட்டும் வேலை செய்யவும். எப்போதும் புதிய gasket பொருத்தவும்.", "සිසිල් එන්ජිමක පමණක් වැඩ කරන්න. සැමවිටම නව gaskets සවි කරන්න."),
      steps: [
        { status: "general", text: t("Disconnect battery negative.", "பேட்டரி negative-ஐ துண்டிக்கவும்.", "බැටරි negative විසන්ධි කරන්න.") },
        { status: "pending", text: t("Remove EGR valve (component removal order from RM).", "EGR valve-ஐ கழற்றவும் (பாகங்கள் கழற்றும் வரிசை RM-இல் இருந்து).", "EGR valve ගලවන්න (කොටස් ගැලවීමේ අනුපිළිවෙල RM වෙතින්).") },
        { status: "general", text: t("Clean carbon from valve and port; do not damage the valve seat.", "Valve மற்றும் port-இல் carbon சுத்தம்; valve seat-ஐ சேதப்படுத்த வேண்டாம்.", "Valve සහ port හි carbon පිරිසිදු කරන්න; valve seat එකට හානි නොකරන්න.") },
        { status: "pending", text: t("Refit with new gaskets, tighten to specified torque.", "புதிய gasket உடன் பொருத்தி குறிப்பிட்ட torque-க்கு இறுக்கவும்.", "නව gaskets සමඟ සවි කර නියමිත torque එකට තද කරන්න."), value: "" },
        { status: "general", text: t("Clear DTC and run EGR active test.", "DTC clear செய்து EGR active test இயக்கவும்.", "DTC clear කර EGR active test කරන්න.") }
      ],
      relatedDtc: ["P0400"]
    }
  ],

  /* ---------- 5. SPECIAL FUNCTIONS & RESET PROCEDURES ---------- */
  specialFunctions: [
    {
      id: "injector_comp",
      group: "ecu",
      title: t("Injector Compensation Code Registration", "Injector Compensation Code பதிவு", "Injector Compensation Code ලියාපදිංචිය"),
      needsScanner: true,
      level: "advanced",
      why: t("Each 1KD-FTV injector has a printed correction code. After replacing an injector or the ECM, the codes must be written to the ECM, otherwise smoke, knock or rough idle can occur.", "ஒவ்வொரு 1KD-FTV injector-இலும் அச்சிடப்பட்ட correction code உள்ளது. Injector அல்லது ECM மாற்றிய பின் இந்த code-களை ECM-இல் எழுத வேண்டும், இல்லையெனில் புகை, knock அல்லது rough idle வரலாம்.", "සෑම 1KD-FTV injector එකකම මුද්‍රිත correction code එකක් ඇත. Injector හෝ ECM මාරු කළ පසු මෙම codes ECM එකට ලිවිය යුතුය, නැතිනම් දුම, knock හෝ අස්ථාවර idle ඇති විය හැක."),
      steps: [
        { status: "general", text: t("Before removal, record the code printed on each injector and its cylinder number.", "கழற்றும் முன் ஒவ்வொரு injector-இல் உள்ள code மற்றும் சிலிண்டர் எண்ணை எழுதி வைக்கவும்.", "ගැලවීමට පෙර, එක් එක් injector එකේ මුද්‍රිත code එක සහ සිලින්ඩර් අංකය සටහන් කරන්න.") },
        { status: "pending", text: t("Connect the scan tool and open the injector-compensation utility (exact menu path: confirm in tool / RM).", "Scan tool இணைத்து injector-compensation utility-ஐ திறக்கவும் (சரியான menu path: tool / RM-இல் உறுதிசெய்யவும்).", "Scan tool එක සම්බන්ධ කර injector-compensation utility එක විවෘත කරන්න (නිවැරදි menu path: tool / RM හි තහවුරු කරන්න).") },
        { status: "general", text: t("Enter the code for each cylinder carefully and confirm.", "ஒவ்வொரு சிலிண்டருக்கும் code-ஐ கவனமாக உள்ளிட்டு உறுதிசெய்யவும்.", "එක් එක් සිලින්ඩරය සඳහා code එක ප්‍රවේශමෙන් ඇතුළත් කර තහවුරු කරන්න.") },
        { status: "general", text: t("Cycle ignition, start engine, check idle quality and DTCs.", "Ignition off/on, எஞ்சின் ஸ்டார்ட், idle தரம் மற்றும் DTC சோதிக்கவும்.", "Ignition off/on කර, එන්ජිම ස්ටාර්ට් කර, idle ගුණාත්මකභාවය සහ DTC පරීක්ෂා කරන්න.") }
      ]
    },
    {
      id: "pump_learning",
      group: "fuel",
      title: t("Supply Pump Initialization / Learning", "Supply Pump Initialization / Learning", "Supply Pump Initialization / Learning"),
      needsScanner: true,
      level: "advanced",
      why: t("After pump or ECM replacement the ECM may need to re-learn pump characteristics.", "Pump அல்லது ECM மாற்றிய பின் ECM pump பண்புகளை மீண்டும் கற்க வேண்டியிருக்கலாம்.", "Pump හෝ ECM මාරු කළ පසු ECM එකට pump ලක්ෂණ නැවත ඉගෙන ගැනීමට අවශ්‍ය විය හැක."),
      steps: [ { status: "pending", text: t("Procedure and conditions to be added from RM.", "செயல்முறை மற்றும் நிபந்தனைகள் RM-இல் இருந்து சேர்க்கப்பட வேண்டும்.", "ක්‍රියාපටිපාටිය සහ කොන්දේසි RM වෙතින් එක් කළ යුතුය.") } ]
    },
    {
      id: "key_registration",
      group: "key",
      title: t("Key Registration (authorized method)", "Key பதிவு (அங்கீகரிக்கப்பட்ட முறை)", "Key ලියාපදිංචිය (අනුමත ක්‍රමය)"),
      needsScanner: true,
      level: "advanced",
      why: t("New or additional keys must be registered to the immobilizer using the manufacturer-approved procedure and tool. Bypass or unauthorized methods are NOT provided in this app.", "புதிய / கூடுதல் key-களை உற்பத்தியாளர் அங்கீகரித்த முறை மற்றும் tool மூலம் immobilizer-இல் பதிவு செய்ய வேண்டும். Bypass அல்லது அங்கீகரிக்கப்படாத முறைகள் இந்த app-இல் இல்லை.", "නව / අමතර keys නිෂ්පාදක අනුමත ක්‍රමය සහ tool එක භාවිතයෙන් immobilizer එකට ලියාපදිංචි කළ යුතුය. Bypass හෝ අනවසර ක්‍රම මෙම app එකේ නොමැත."),
      steps: [
        { status: "general", text: t("Verify vehicle ownership documents before any key work.", "Key வேலைக்கு முன் வாகன உரிமை ஆவணங்களை சரிபார்க்கவும்.", "ඕනෑම key වැඩකට පෙර වාහන හිමිකම් ලේඛන තහවුරු කරන්න.") },
        { status: "pending", text: t("Registration procedure depends on immobilizer type — add from RM.", "பதிவு முறை immobilizer வகையைப் பொறுத்தது — RM-இல் இருந்து சேர்க்கவும்.", "ලියාපදිංචි ක්‍රමය immobilizer වර්ගය මත රඳා පවතී — RM වෙතින් එක් කරන්න.") }
      ]
    },
    {
      id: "remote_sync",
      group: "remote",
      title: t("Remote Key Synchronization", "Remote Key Synchronization", "Remote Key Synchronization"),
      needsScanner: null,
      level: "beginner",
      why: t("Some Toyota remotes can be added with a door / ignition sequence; others need a scanner.", "சில Toyota remote-களை door / ignition வரிசை மூலம் சேர்க்கலாம்; மற்றவைக்கு scanner தேவை.", "සමහර Toyota remotes door / ignition අනුපිළිවෙලකින් එක් කළ හැක; අනෙක් ඒවාට scanner අවශ්‍යයි."),
      steps: [ { status: "pending", text: t("Vehicle-specific sequence to be added from RM.", "வாகனத்திற்கான வரிசை RM-இல் இருந்து சேர்க்கப்பட வேண்டும்.", "වාහනයට අදාළ අනුපිළිවෙල RM වෙතින් එක් කළ යුතුය.") } ]
    },
    {
      id: "oil_reset",
      group: "cluster",
      title: t("Oil Maintenance / Service Reminder Reset", "Oil Maintenance / Service Reminder Reset", "Oil Maintenance / Service Reminder Reset"),
      needsScanner: false,
      level: "beginner",
      why: t("Usually done from the meter buttons; method depends on cluster type.", "பொதுவாக மீட்டர் பட்டன் மூலம் செய்யலாம்; முறை cluster வகையைப் பொறுத்தது.", "සාමාන්‍යයෙන් මීටර් බොත්තම් මගින් කළ හැක; ක්‍රමය cluster වර්ගය මත රඳා පවතී."),
      steps: [ { status: "pending", text: t("Button sequence to be added from owner's manual / RM.", "பட்டன் வரிசை owner's manual / RM-இல் இருந்து சேர்க்கப்பட வேண்டும்.", "බොත්තම් අනුපිළිවෙල owner's manual / RM වෙතින් එක් කළ යුතුය.") } ]
    },
    {
      id: "abs_bleed",
      group: "abs",
      title: t("ABS Brake Bleeding", "ABS பிரேக் Bleeding", "ABS තිරිංග Bleeding"),
      needsScanner: null,
      level: "advanced",
      why: t("Normal bleeding is enough when the ABS actuator was not opened; after actuator replacement a scanner-assisted bleed may be required.", "ABS actuator திறக்கப்படவில்லை என்றால் சாதாரண bleeding போதும்; actuator மாற்றிய பின் scanner உதவியுடன் bleed தேவைப்படலாம்.", "ABS actuator එක විවෘත නොකළේ නම් සාමාන්‍ය bleeding ප්‍රමාණවත්; actuator මාරු කිරීමෙන් පසු scanner සහාය ඇති bleed එකක් අවශ්‍ය විය හැක."),
      steps: [
        { status: "general", text: t("Use only the brake fluid grade specified on the reservoir cap.", "Reservoir மூடியில் குறிப்பிட்ட brake fluid மட்டுமே பயன்படுத்தவும்.", "Reservoir මූඩියේ සඳහන් brake fluid වර්ගය පමණක් භාවිතා කරන්න.") },
        { status: "pending", text: t("Wheel bleeding order and scanner steps to be added from RM.", "Wheel bleeding வரிசை மற்றும் scanner படிகள் RM-இல் இருந்து சேர்க்கப்பட வேண்டும்.", "රෝද bleeding අනුපිළිවෙල සහ scanner පියවර RM වෙතින් එක් කළ යුතුය.") }
      ]
    },
    {
      id: "ecu_reset",
      group: "ecu",
      title: t("ECU Reset / Initialization", "ECU Reset / Initialization", "ECU Reset / Initialization"),
      needsScanner: false,
      level: "beginner",
      why: t("Disconnecting the battery clears stored DTCs and some learned values. Some systems then need relearning (idle, windows, clock, radio).", "பேட்டரி துண்டித்தால் DTC-கள் மற்றும் சில learned values அழியும். அதன் பிறகு சில அமைப்புகளுக்கு relearning தேவை (idle, window, clock, radio).", "බැටරිය විසන්ධි කිරීමෙන් DTC සහ සමහර learned values මැකී යයි. පසුව සමහර පද්ධති නැවත ඉගෙනීම අවශ්‍යයි (idle, windows, clock, radio)."),
      steps: [
        { status: "general", text: t("Write down DTCs and freeze-frame data BEFORE disconnecting.", "துண்டிக்கும் முன் DTC மற்றும் freeze-frame data-வை எழுதி வைக்கவும்.", "විසන්ධි කිරීමට පෙර DTC සහ freeze-frame data සටහන් කරන්න.") },
        { status: "general", text: t("Ignition OFF, disconnect battery negative terminal.", "Ignition OFF, பேட்டரி negative terminal துண்டிக்கவும்.", "Ignition OFF, බැටරි negative terminal විසන්ධි කරන්න.") },
        { status: "pending", text: t("Waiting time and post-reset relearn steps: confirm in RM.", "காத்திருக்கும் நேரம், reset-க்கு பின் relearn படிகள்: RM-இல் உறுதிசெய்யவும்.", "රැඳී සිටිය යුතු කාලය සහ reset පසු relearn පියවර: RM හි තහවුරු කරන්න.") }
      ]
    },
    {
      id: "steering_angle",
      group: "abs",
      title: t("Steering Angle Sensor Calibration", "Steering Angle Sensor Calibration", "Steering Angle Sensor Calibration"),
      needsScanner: true, level: "advanced",
      why: t("Required only on vehicles with VSC after alignment or steering work.", "VSC உள்ள வாகனங்களில் alignment / steering வேலைக்கு பின் மட்டும் தேவை.", "VSC ඇති වාහනවල alignment / steering වැඩෙන් පසු පමණක් අවශ්‍යයි."),
      steps: [ { status: "pending", text: t("Confirm equipment and procedure in RM.", "உபகரணம் மற்றும் முறையை RM-இல் உறுதிசெய்யவும்.", "උපකරණ සහ ක්‍රියාපටිපාටිය RM හි තහවුරු කරන්න.") } ]
    },
    {
      id: "battery_reg",
      group: "electrical",
      title: t("Battery Registration", "Battery Registration", "Battery Registration"),
      needsScanner: true, level: "beginner",
      why: t("Normally used on vehicles with a battery-monitoring sensor. Applicability to this vehicle must be confirmed.", "பொதுவாக battery-monitoring sensor உள்ள வாகனங்களில் பயன்படும். இந்த வாகனத்திற்கு பொருந்துமா என உறுதிசெய்ய வேண்டும்.", "සාමාන්‍යයෙන් battery-monitoring sensor ඇති වාහනවල භාවිතා වේ. මෙම වාහනයට අදාළ දැයි තහවුරු කළ යුතුය."),
      steps: [ { status: "pending", text: t("Confirm in RM whether this applies.", "இது பொருந்துமா என RM-இல் உறுதிசெய்யவும்.", "මෙය අදාළ දැයි RM හි තහවුරු කරන්න.") } ]
    }
  ],

  /* ---------- 6. MANUAL DIAGNOSIS (no scanner) — general guidance ---------- */
  manualTests: [
    {
      id: "voltage", icon: "🔋",
      title: t("Voltage checking", "Voltage சோதனை", "Voltage පරීක්ෂාව"),
      intro: t("Measures electrical pressure. Meter on DC Volts, black lead to good ground, red lead to the point.", "மின் அழுத்தத்தை அளக்கிறது. மீட்டரை DC Volts-இல் வைத்து, கருப்பு lead நல்ல ground-இல், சிவப்பு lead சோதிக்கும் இடத்தில்.", "විදුලි පීඩනය මනී. මීටරය DC Volts හි තබා, කළු lead එක හොඳ ground එකකට, රතු lead එක පරීක්ෂා කරන ස්ථානයට."),
      steps: [
        t("Battery, engine off (12 V system, rested): about 12.4–12.7 V means charged.", "பேட்டரி, எஞ்சின் off (12 V, ஓய்வில்): சுமார் 12.4–12.7 V என்றால் charge உள்ளது.", "බැටරිය, එන්ජිම off (12 V, විවේකයේ): ආසන්න 12.4–12.7 V නම් charge වී ඇත."),
        t("Engine running: about 13.5–14.7 V means the alternator is charging.", "எஞ்சின் ஓடும்போது: சுமார் 13.5–14.7 V என்றால் alternator charge செய்கிறது.", "එන්ජිම ධාවනය වන විට: ආසන්න 13.5–14.7 V නම් alternator එක charge කරයි."),
        t("Sensor supply: many sensors use a 5 V reference from the ECM — confirm the exact value in RM.", "Sensor supply: பல sensor-கள் ECM-இல் இருந்து 5 V reference பயன்படுத்தும் — சரியான மதிப்பை RM-இல் பார்க்கவும்.", "Sensor supply: බොහෝ සංවේදක ECM වෙතින් 5 V reference එකක් භාවිතා කරයි — නිවැරදි අගය RM හි බලන්න.")
      ]
    },
    {
      id: "vdrop", icon: "📉",
      title: t("Voltage-drop test", "Voltage-drop சோதனை", "Voltage-drop පරීක්ෂාව"),
      intro: t("Finds bad grounds and corroded connections while the circuit is working.", "Circuit இயங்கும்போதே மோசமான ground, துருப்பிடித்த இணைப்புகளை கண்டுபிடிக்கும்.", "පරිපථය ක්‍රියාත්මක වන විටම නරක ground සහ මලකඩ සම්බන්ධතා සොයා ගනී."),
      steps: [
        t("Put both meter leads on the two ends of the same wire or ground path, with the load ON.", "Load ON நிலையில், மீட்டர் lead இரண்டையும் ஒரே wire அல்லது ground path-இன் இரு முனைகளில் வைக்கவும்.", "Load ON කර, මීටර lead දෙකම එකම wire එකක හෝ ground path එකක කෙළවර දෙකට තබන්න."),
        t("General guide: a ground path should drop only a few tenths of a volt; more means resistance.", "பொது வழிகாட்டி: ground path-இல் சில பத்தில் ஒரு volt மட்டுமே drop ஆக வேண்டும்; அதிகம் என்றால் resistance உள்ளது.", "සාමාන්‍ය මාර්ගෝපදේශය: ground path එකක volt දශම කිහිපයක් පමණක් අඩු විය යුතුය; වැඩි නම් resistance ඇත.")
      ]
    },
    {
      id: "resistance", icon: "Ω",
      title: t("Resistance checking", "Resistance சோதனை", "Resistance පරීක්ෂාව"),
      intro: t("Always with power OFF and component disconnected.", "எப்போதும் power OFF செய்து, பாகத்தை துண்டித்த பிறகு மட்டும்.", "සැමවිටම power OFF කර, කොටස විසන්ධි කර පමණි."),
      steps: [
        t("Meter on Ω. Touch leads together first — note the lead resistance.", "மீட்டரை Ω-இல் வைக்கவும். முதலில் lead-களை ஒன்றாக தொட்டு lead resistance-ஐ குறிக்கவும்.", "මීටරය Ω හි තබන්න. මුලින්ම lead එකට ස්පර්ශ කර lead resistance සටහන් කරන්න."),
        t("Measure across the component terminals; compare with the RM value at the stated temperature.", "பாகத்தின் terminal-களுக்கு இடையே அளந்து, குறிப்பிட்ட வெப்பநிலையில் RM மதிப்புடன் ஒப்பிடவும்.", "කොටසේ terminals අතර මැන, සඳහන් උෂ්ණත්වයේ RM අගය සමඟ සසඳන්න.")
      ]
    },
    {
      id: "continuity", icon: "🔗",
      title: t("Continuity testing", "Continuity சோதனை", "Continuity පරීක්ෂාව"),
      intro: t("Checks that a wire is not broken from one end to the other.", "ஒரு wire ஒரு முனையிலிருந்து மறுமுனை வரை உடையவில்லை என சோதிக்கிறது.", "Wire එකක් එක් කෙළවරක සිට අනෙක් කෙළවර දක්වා කැඩී නැති බව පරීක්ෂා කරයි."),
      steps: [
        t("Disconnect both ends (sensor and ECM connector).", "இரு முனைகளையும் துண்டிக்கவும் (sensor மற்றும் ECM connector).", "කෙළවර දෙකම විසන්ධි කරන්න (සංවේදකය සහ ECM connector)."),
        t("Beep / near 0 Ω = wire OK. Then check each wire to ground — it must NOT beep (no short).", "Beep / சுமார் 0 Ω = wire சரி. பிறகு ஒவ்வொரு wire-ஐயும் ground-க்கு சோதிக்கவும் — beep வரக்கூடாது (short இல்லை).", "Beep / ආසන්න 0 Ω = wire හොඳයි. පසුව එක් එක් wire ground එකට පරීක්ෂා කරන්න — beep නොවිය යුතුය (short නැත).")
      ]
    },
    {
      id: "fuse_relay", icon: "🧯",
      title: t("Fuse and relay checking", "Fuse மற்றும் relay சோதனை", "Fuse සහ relay පරීක්ෂාව"),
      intro: t("Test fuses in place with a test light or meter on BOTH test points — a fuse can look OK but be open.", "Test light அல்லது மீட்டர் மூலம் fuse-ஐ அதன் இடத்திலேயே இரண்டு test point-களிலும் சோதிக்கவும் — பார்வைக்கு சரியாக தெரிந்தாலும் open ஆக இருக்கலாம்.", "Test light එකක් හෝ මීටරයක් මගින් fuse එක එහි ස්ථානයේම test points දෙකේම පරීක්ෂා කරන්න — පෙනුමට හොඳ වුවත් open විය හැක."),
      steps: [
        t("Power on both sides = fuse OK. Power on one side only = fuse blown.", "இரண்டு பக்கமும் power = fuse சரி. ஒரு பக்கம் மட்டும் = fuse போனது.", "පැති දෙකේම power = fuse හොඳයි. එක පැත්තක පමණක් = fuse පිපිරී ඇත."),
        t("Relay: swap with an identical relay, or bench-test coil and contacts.", "Relay: அதே வகை relay-உடன் மாற்றிப் பார்க்கவும், அல்லது coil, contact-ஐ bench-test செய்யவும்.", "Relay: සමාන relay එකක් සමඟ මාරු කර බලන්න, හෝ coil සහ contacts bench-test කරන්න."),
        t("Never replace a fuse with a higher rating.", "அதிக rating உள்ள fuse-ஐ ஒருபோதும் போட வேண்டாம்.", "කිසිවිටෙක වැඩි rating ඇති fuse එකක් දමන්න එපා.")
      ]
    },
    {
      id: "connector", icon: "🔌",
      title: t("Wiring and connector inspection", "வயரிங் மற்றும் connector சோதனை", "වයරින් සහ connector පරීක්ෂාව"),
      intro: t("Most electrical faults are in wiring and connectors, not in the part itself.", "பெரும்பாலான மின் பழுதுகள் வயரிங், connector-இல் தான் இருக்கும், பாகத்தில் அல்ல.", "බොහෝ විදුලි දෝෂ ඇත්තේ වයරින් සහ connector වල මිස කොටසේම නොවේ."),
      steps: [
        t("Look for green/white corrosion, pushed-back pins, broken locks.", "பச்சை/வெள்ளை துரு, பின்னால் தள்ளப்பட்ட pin, உடைந்த lock-களை பார்க்கவும்.", "කොළ/සුදු මලකඩ, පිටුපසට තල්ලු වූ pins, කැඩුණු locks බලන්න."),
        t("Pin-drag test: the correct size test pin should feel a light, even grip.", "Pin-drag சோதனை: சரியான அளவு test pin லேசான, சீரான பிடிப்பை உணர வேண்டும்.", "Pin-drag පරීක්ෂාව: නිවැරදි ප්‍රමාණයේ test pin එකට සැහැල්ලු, ඒකාකාර ග්‍රහණයක් දැනිය යුතුය."),
        t("Never pierce insulation with probes — use back-probe pins.", "Probe மூலம் insulation-ஐ ஒருபோதும் குத்த வேண்டாம் — back-probe pin பயன்படுத்தவும்.", "Probe වලින් insulation කිසිවිටෙක සිදුරු නොකරන්න — back-probe pins භාවිතා කරන්න.")
      ]
    }
  ],

  scannerGuide: {
    manualOk: [
      t("Fuses, relays, battery and charging", "Fuse, relay, பேட்டரி மற்றும் charging", "Fuse, relay, බැටරිය සහ charging"),
      t("Power / ground / continuity of wiring", "வயரிங் power / ground / continuity", "වයරින් power / ground / continuity"),
      t("Sensor resistance and supply voltage (when RM values are known)", "Sensor resistance மற்றும் supply voltage (RM மதிப்பு தெரிந்தால்)", "Sensor resistance සහ supply voltage (RM අගයන් දන්නා විට)"),
      t("Mechanical checks: leaks, hoses, filters", "இயந்திர சோதனைகள்: கசிவு, hose, filter", "යාන්ත්‍රික පරීක්ෂා: කාන්දු, hoses, filters")
    ],
    scannerNeeded: [
      t("Reading and clearing DTCs in body, ABS, SRS modules", "Body, ABS, SRS module-களில் DTC படித்தல் / clear செய்தல்", "Body, ABS, SRS modules වල DTC කියවීම / clear කිරීම"),
      t("Injector code registration, pump learning", "Injector code பதிவு, pump learning", "Injector code ලියාපදිංචිය, pump learning"),
      t("Key / immobilizer registration", "Key / immobilizer பதிவு", "Key / immobilizer ලියාපදිංචිය"),
      t("Live data (rail pressure, MAF g/s) and active tests", "Live data (rail pressure, MAF g/s) மற்றும் active tests", "Live data (rail pressure, MAF g/s) සහ active tests")
    ]
  },

  /* ---------- 7. SYMPTOM ENTRY POINTS (used by step-by-step layout) ---------- */
  symptoms: [
    { id: "no_start", icon: "🚫", title: t("Engine cranks but will not start", "எஞ்சின் சுத்துது ஆனா ஸ்டார்ட் ஆகல", "එන්ජිම කැරකෙයි නමුත් ස්ටාර්ට් නොවේ"), dtcs: ["P0087", "U0100"], procedures: ["fuel_filter_bleed"] },
    { id: "low_power", icon: "🐢", title: t("Low power / black smoke", "பவர் குறைவு / கருப்பு புகை", "බලය අඩුයි / කළු දුම"), dtcs: ["P0087", "P0100", "P0400"], procedures: ["maf_inspect_clean", "egr_clean"] },
    { id: "warning_lights", icon: "⚠️", title: t("Many warning lights at once", "ஒரே நேரத்தில் பல warning lights", "එකවර බොහෝ warning lights"), dtcs: ["U0100", "C1201"], procedures: [] }
  ],

  /* ---------- 8. GLOSSARY (difficult terms explained simply) ---------- */
  glossary: [
    { term: "ECM", text: t("Engine Control Module — the engine's computer.", "Engine Control Module — எஞ்சினின் கம்ப்யூட்டர்.", "Engine Control Module — එන්ජිමේ පරිගණකය.") },
    { term: "DTC", text: t("Diagnostic Trouble Code — fault code stored by a computer.", "Diagnostic Trouble Code — கம்ப்யூட்டர் சேமிக்கும் பழுது code.", "Diagnostic Trouble Code — පරිගණකය ගබඩා කරන දෝෂ code එක.") },
    { term: "Common rail", text: t("A shared high-pressure fuel pipe feeding all injectors.", "எல்லா injector-களுக்கும் டீசல் தரும் பொது high-pressure குழாய்.", "සියලු injectors වලට ඉන්ධන සපයන පොදු high-pressure නළය.") },
    { term: "SCV", text: t("Suction Control Valve — controls how much fuel enters the high-pressure pump.", "Suction Control Valve — high-pressure pump-க்குள் எவ்வளவு டீசல் செல்கிறது என்பதை கட்டுப்படுத்தும்.", "Suction Control Valve — high-pressure pump එකට ඇතුළු වන ඉන්ධන ප්‍රමාණය පාලනය කරයි.") },
    { term: "MAF", text: t("Mass Air Flow sensor — measures air entering the engine.", "Mass Air Flow sensor — எஞ்சினுக்குள் செல்லும் காற்றை அளக்கும்.", "Mass Air Flow sensor — එන්ජිමට ඇතුළු වන වාතය මනී.") },
    { term: "EGR", text: t("Exhaust Gas Recirculation — sends some exhaust back to reduce NOx.", "Exhaust Gas Recirculation — NOx குறைக்க சிறிது exhaust-ஐ மீண்டும் உள்ளே அனுப்பும்.", "Exhaust Gas Recirculation — NOx අඩු කිරීමට exhaust ටිකක් නැවත ඇතුළට යවයි.") },
    { term: "CAN", text: t("Controller Area Network — the 2-wire network the computers talk on.", "Controller Area Network — கம்ப்யூட்டர்கள் பேசிக்கொள்ளும் 2-wire network.", "Controller Area Network — පරිගණක කතා කරන 2-wire network එක.") },
    { term: "DLC", text: t("Data Link Connector — the OBD socket where the scanner plugs in.", "Data Link Connector — scanner இணைக்கும் OBD socket.", "Data Link Connector — scanner එක සම්බන්ධ කරන OBD socket එක.") },
    { term: "Back-probe", text: t("Measuring from the rear of a connector while it is still plugged in.", "Connector இணைத்தபடியே அதன் பின்புறத்தில் இருந்து அளத்தல்.", "Connector එක සවි කර තිබියදී එහි පිටුපසින් මැනීම.") },
    { term: "Freeze frame", text: t("Snapshot of sensor data saved at the moment a DTC set.", "DTC வந்த நேரத்தில் சேமிக்கப்பட்ட sensor data snapshot.", "DTC එක සැකසුණු මොහොතේ සුරකින ලද sensor data snapshot එක.") }
  ]
};
