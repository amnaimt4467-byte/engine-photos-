/* =====================================================================
   APP UI TEXT — English / Tamil / Sinhala
   (DTC field labels such as "Possible Causes" live in core.js → KB.UI.)
   Add a key here, then use t("key") in the screens.
   ===================================================================== */
var I18N = {
  app_name: { en: "Engine Specs", ta: "Engine Specs", si: "Engine Specs" },

  /* navigation */
  nav_home: { en: "Home", ta: "முகப்பு", si: "මුල" },
  nav_vehicle: { en: "Vehicle", ta: "வாகனம்", si: "වාහනය" },
  nav_dtc: { en: "DTC", ta: "DTC", si: "DTC" },
  nav_settings: { en: "Settings", ta: "அமைப்புகள்", si: "සැකසුම්" },
  back: { en: "Back", ta: "பின்", si: "ආපසු" },

  /* first launch */
  first_title: { en: "Choose your language", ta: "உங்கள் மொழியை தேர்வு செய்யுங்கள்", si: "ඔබේ භාෂාව තෝරන්න" },
  first_sub: { en: "You can change it later in Settings.", ta: "பின்னர் அமைப்புகளில் மாற்றலாம்.", si: "පසුව සැකසුම්වලින් වෙනස් කළ හැක." },

  /* home */
  hello: { en: "What do you need today?", ta: "இன்று உங்களுக்கு என்ன வேண்டும்?", si: "අද ඔබට අවශ්‍ය කුමක්ද?" },
  my_vehicle: { en: "My vehicle", ta: "என் வாகனம்", si: "මගේ වාහනය" },
  no_vehicle: { en: "No vehicle selected", ta: "வாகனம் தேர்வு செய்யவில்லை", si: "වාහනයක් තෝරා නැත" },
  choose_vehicle: { en: "Choose vehicle", ta: "வாகனத்தை தேர்வு செய்", si: "වාහනය තෝරන්න" },
  change: { en: "Change", ta: "மாற்று", si: "වෙනස් කරන්න" },
  open: { en: "Open", ta: "திற", si: "විවෘත කරන්න" },
  search: { en: "Search", ta: "தேடு", si: "සොයන්න" },
  recent: { en: "Recent searches", ta: "சமீபத்திய தேடல்கள்", si: "මෑත සෙවීම්" },
  a_code: { en: "I have a fault code", ta: "என்னிடம் fault code இருக்கு", si: "මට fault code එකක් තියෙනවා" },
  a_code_s: { en: "Look up a DTC", ta: "DTC-ஐ தேடுங்கள்", si: "DTC එකක් සොයන්න" },
  a_sym: { en: "I see a problem", ta: "பிரச்சனை தெரியுது", si: "ගැටලුවක් පේනවා" },
  a_sym_s: { en: "No code / no scanner", ta: "Code / scanner இல்லை", si: "Code / scanner නැත" },
  a_sf: { en: "Reset / special function", ta: "Reset / சிறப்பு செயல்பாடு", si: "Reset / විශේෂ කාර්යය" },
  a_sf_s: { en: "Key, injector code, service reset…", ta: "Key, injector code, service reset…", si: "Key, injector code, service reset…" },
  a_learn: { en: "Learn testing", ta: "சோதனை கற்றுக்கொள்", si: "පරීක්ෂා කිරීම ඉගෙන ගන්න" },
  a_learn_s: { en: "Multimeter, fuses, connectors", ta: "மல்டிமீட்டர், fuse, connector", si: "මල්ටිමීටරය, fuse, connector" },

  /* sections not built yet */
  soon_title: { en: "Coming in a later update", ta: "அடுத்த update-இல் வரும்", si: "ඊළඟ update එකකින් පැමිණේ" },
  soon_body: { en: "This section is being built. It arrives with update {n}.", ta: "இந்த பகுதி உருவாக்கப்படுகிறது. Update {n}-இல் வரும்.", si: "මෙම කොටස සාදමින් පවතී. Update {n} සමඟ පැමිණේ." },
  go_home: { en: "Go to Home", ta: "முகப்புக்கு செல்", si: "මුල් පිටුවට යන්න" },

  /* vehicle picker */
  pick_title: { en: "Choose vehicle", ta: "வாகனத்தை தேர்வு செய்", si: "වාහනය තෝරන්න" },
  pick_search_ph: { en: "Chassis code, model or engine (e.g. KDH, HiAce, 1KD)", ta: "Chassis code, model அல்லது engine (எ.கா. KDH, HiAce, 1KD)", si: "Chassis code, model හෝ engine (උදා. KDH, HiAce, 1KD)" },
  pick_make: { en: "Choose the make", ta: "Make-ஐ தேர்வு செய்யுங்கள்", si: "Make එක තෝරන්න" },
  pick_model: { en: "Choose the model", ta: "Model-ஐ தேர்வு செய்யுங்கள்", si: "Model එක තෝරන්න" },
  pick_chassis: { en: "Choose the chassis code", ta: "Chassis code-ஐ தேர்வு செய்யுங்கள்", si: "Chassis code එක තෝරන්න" },
  pick_year: { en: "Choose the year", ta: "வருடத்தை தேர்வு செய்யுங்கள்", si: "වර්ෂය තෝරන්න" },
  pick_engine: { en: "Choose the engine", ta: "Engine-ஐ தேர்வு செய்யுங்கள்", si: "Engine එක තෝරන්න" },
  pick_restart: { en: "Start over", ta: "மீண்டும் தொடங்கு", si: "නැවත අරඹන්න" },
  pick_none: { en: "No vehicle matches. Try fewer letters.", ta: "பொருந்தும் வாகனம் இல்லை. குறைவான எழுத்துகளில் முயற்சிக்கவும்.", si: "ගැළපෙන වාහනයක් නැත. අකුරු අඩුවෙන් උත්සාහ කරන්න." },
  n_vehicles: { en: "{n} vehicle(s)", ta: "{n} வாகனம்", si: "වාහන {n}" },
  tag_sample: { en: "Sample data", ta: "மாதிரி டேட்டா", si: "සාම්පල දත්ත" },
  tag_planned: { en: "No data yet", ta: "இன்னும் டேட்டா இல்லை", si: "තවම දත්ත නැත" },

  /* vehicle page */
  use_vehicle: { en: "Use as my vehicle", ta: "என் வாகனமாக வை", si: "මගේ වාහනය ලෙස යොදන්න" },
  is_current: { en: "This is my vehicle", ta: "இது என் வாகனம்", si: "මෙය මගේ වාහනයයි" },
  fav_add: { en: "Save to my vehicles", ta: "என் வாகனங்களில் சேமி", si: "මගේ වාහනවලට සුරකින්න" },
  fav_remove: { en: "Saved · tap to remove", ta: "சேமிக்கப்பட்டது · நீக்க தட்டவும்", si: "සුරකින ලදී · ඉවත් කිරීමට තට්ටු කරන්න" },
  systems: { en: "Vehicle systems", ta: "வாகன அமைப்புகள்", si: "වාහන පද්ධති" },
  no_pack: { en: "The data pack for this vehicle is not built yet. It will be added in a later update.", ta: "இந்த வாகனத்திற்கான டேட்டா இன்னும் உருவாக்கப்படவில்லை. பின்னர் வரும் update-இல் சேர்க்கப்படும்.", si: "මෙම වාහනය සඳහා දත්ත තවම සාදා නැත. පසු update එකකින් එක් කෙරේ." },
  procs: { en: "Repair procedures", ta: "ரிப்பேர் முறைகள்", si: "අලුත්වැඩියා ක්‍රම" },
  show_steps: { en: "Show steps", ta: "படிகளை காட்டு", si: "පියවර පෙන්වන්න" },

  /* DTC */
  dtc_title: { en: "DTC lookup", ta: "DTC தேடல்", si: "DTC සෙවීම" },
  dtc_in_app: { en: "Codes in the app now (sample)", ta: "இப்போது app-இல் உள்ள codes (மாதிரி)", si: "දැන් app එකේ ඇති codes (සාම්පල)" },
  dtc_more: { en: "The full DTC library (all generic and Toyota codes) arrives with update 2.", ta: "முழு DTC நூலகம் (எல்லா பொது மற்றும் Toyota codes) update 2-இல் வரும்.", si: "සම්පූර්ණ DTC පුස්තකාලය (සියලු පොදු සහ Toyota codes) update 2 සමඟ පැමිණේ." },
  not_found: { en: "This code is not in the app yet. The full DTC library arrives with update 2.", ta: "இந்த code இன்னும் app-இல் இல்லை. முழு DTC நூலகம் update 2-இல் வரும்.", si: "මෙම code එක තවම app එකේ නැත. සම්පූර්ණ DTC පුස්තකාලය update 2 සමඟ පැමිණේ." },
  results_for: { en: "Results for", ta: "தேடல் முடிவுகள்:", si: "සෙවුම් ප්‍රතිඵල:" },
  t_over: { en: "Overview", ta: "கண்ணோட்டம்", si: "දළ විශ්ලේෂණය" },
  t_diag: { en: "Diagnose", ta: "கண்டறிதல்", si: "විනිශ්චය" },
  t_elec: { en: "Electrical", ta: "மின்", si: "විදුලි" },
  t_rep: { en: "Repair", ta: "ரிப்பேர்", si: "අලුත්වැඩියාව" },
  t_ver: { en: "Verify", ta: "சரிபார்ப்பு", si: "තහවුරු" },
  adv_hidden: { en: "{n} advanced step(s) are hidden in Beginner mode.", ta: "Beginner நிலையில் {n} மேம்பட்ட படி(கள்) மறைக்கப்பட்டுள்ளன.", si: "Beginner මට්ටමේදී උසස් පියවර {n} ක් සඟවා ඇත." },
  show_adv: { en: "Show advanced steps", ta: "மேம்பட்ட படிகளை காட்டு", si: "උසස් පියවර පෙන්වන්න" },

  /* settings */
  s_title: { en: "Settings", ta: "அமைப்புகள்", si: "සැකසුම්" },
  s_lang: { en: "Language", ta: "மொழி", si: "භාෂාව" },
  s_level: { en: "Experience level", ta: "அனுபவ நிலை", si: "පළපුරුදු මට්ටම" },
  s_level_hint: { en: "Beginner hides advanced tests until you ask for them.", ta: "Beginner நிலையில், நீங்கள் கேட்கும் வரை மேம்பட்ட சோதனைகள் மறைக்கப்படும்.", si: "Beginner මට්ටමේදී, ඔබ ඉල්ලන තුරු උසස් පරීක්ෂණ සඟවා තැබේ." },
  s_text: { en: "Text size", ta: "எழுத்து அளவு", si: "අකුරු ප්‍රමාණය" },
  text_s: { en: "Small", ta: "சிறியது", si: "කුඩා" },
  text_m: { en: "Medium", ta: "நடுத்தரம்", si: "මධ්‍යම" },
  text_l: { en: "Large", ta: "பெரியது", si: "විශාල" },
  s_theme: { en: "Appearance", ta: "தோற்றம்", si: "පෙනුම" },
  theme_auto: { en: "Auto", ta: "தானாக", si: "ස්වයංක්‍රීය" },
  theme_dark: { en: "Dark", ta: "இருள்", si: "අඳුරු" },
  theme_light: { en: "Light", ta: "வெளிச்சம்", si: "දීප්තිමත්" },
  s_units: { en: "Units", ta: "அலகுகள்", si: "ඒකක" },
  units_metric: { en: "Metric", ta: "Metric", si: "Metric" },
  units_imperial: { en: "Imperial", ta: "Imperial", si: "Imperial" },
  units_example: { en: "Example", ta: "உதாரணம்", si: "උදාහරණය" },
  s_voice: { en: "Voice", ta: "குரல்", si: "හඬ" },
  s_voice_lang: { en: "Voice language", ta: "குரல் மொழி", si: "හඬ භාෂාව" },
  voice_app: { en: "Same as app", ta: "App மொழியே", si: "App භාෂාවම" },
  s_speak: { en: "Read answers aloud", ta: "பதில்களை குரலில் படி", si: "පිළිතුරු හඬ නඟා කියවන්න" },
  on: { en: "On", ta: "ஆன்", si: "සක්‍රීය" },
  off: { en: "Off", ta: "ஆஃப்", si: "අක්‍රීය" },
  voice_test: { en: "Test voice", ta: "குரலை சோதி", si: "හඬ පරීක්ෂා කරන්න" },
  voice_sample: { en: "This is a voice test. Fault code P 0 0 8 7.", ta: "இது குரல் சோதனை. Fault code P 0 0 8 7.", si: "මෙය හඬ පරීක්ෂණයකි. Fault code P 0 0 8 7." },
  voice_none: { en: "Voice output is not available on this device.", ta: "இந்த சாதனத்தில் குரல் வெளியீடு இல்லை.", si: "මෙම උපාංගයේ හඬ ප්‍රතිදානය නොමැත." },
  voice_note: { en: "Voice search (speak a code) arrives with update 2.", ta: "குரல் தேடல் (code-ஐ சொல்லி தேடுதல்) update 2-இல் வரும்.", si: "හඬ සෙවීම (code එක කියා සෙවීම) update 2 සමඟ පැමිණේ." },
  s_myveh: { en: "My vehicles", ta: "என் வாகனங்கள்", si: "මගේ වාහන" },
  none_yet: { en: "Nothing here yet.", ta: "இன்னும் எதுவும் இல்லை.", si: "තවම කිසිවක් නැත." },
  remove: { en: "Remove", ta: "நீக்கு", si: "ඉවත් කරන්න" },
  clear: { en: "Clear", ta: "அழி", si: "මකන්න" },
  s_data: { en: "Offline data", ta: "Offline டேட்டா", si: "Offline දත්ත" },
  s_data_note: { en: "All data is stored inside the app. No internet is needed.", ta: "எல்லா டேட்டாவும் app-க்குள்ளேயே உள்ளது. Internet தேவையில்லை.", si: "සියලු දත්ත app එක තුළම ගබඩා වේ. Internet අවශ්‍ය නැත." },
  data_pack: { en: "Vehicle data", ta: "வாகன டேட்டா", si: "වාහන දත්ත" },
  data_records: { en: "{d} DTCs · {p} procedures · {s} special functions", ta: "{d} DTC · {p} முறைகள் · {s} சிறப்பு செயல்பாடுகள்", si: "DTC {d} · ක්‍රම {p} · විශේෂ කාර්යයන් {s}" },
  s_report: { en: "Report wrong data", ta: "தவறான டேட்டாவை தெரிவி", si: "වැරදි දත්ත වාර්තා කරන්න" },
  s_report_hint: { en: "Found a mistake? Send it so it can be fixed.", ta: "தவறு கண்டீர்களா? திருத்த அனுப்புங்கள்.", si: "වැරැද්දක් හමු වුණාද? නිවැරදි කිරීමට එවන්න." },
  report_send: { en: "Write a report", ta: "அறிக்கை எழுது", si: "වාර්තාවක් ලියන්න" },
  report_subject: { en: "Engine Specs — wrong data report", ta: "Engine Specs — wrong data report", si: "Engine Specs — wrong data report" },
  s_about: { en: "About", ta: "பற்றி", si: "පිළිබඳව" },
  disclaimer: {
    en: "This app is a workshop guide. Always confirm critical values (torque, pressure, voltage, pin numbers) in the official repair manual before working. Values marked 'Needs verification' are not confirmed. The app does not provide immobilizer bypass or unauthorized key access.",
    ta: "இந்த app ஒரு workshop வழிகாட்டி. வேலை செய்யும் முன் முக்கியமான மதிப்புகளை (torque, pressure, voltage, pin எண்கள்) அதிகாரப்பூர்வ repair manual-இல் எப்போதும் உறுதிசெய்யுங்கள். 'சரிபார்க்க வேண்டும்' என்று குறிக்கப்பட்டவை உறுதிசெய்யப்படாதவை. Immobilizer bypass அல்லது அங்கீகரிக்கப்படாத key access இந்த app-இல் இல்லை.",
    si: "මෙම app එක workshop මාර්ගෝපදේශයකි. වැඩ කිරීමට පෙර වැදගත් අගයන් (torque, pressure, voltage, pin අංක) නිල repair manual එකෙන් සැමවිටම තහවුරු කරන්න. 'තහවුරු කළ යුතුයි' ලෙස සලකුණු කළ ඒවා තහවුරු කර නැත. Immobilizer bypass හෝ අනවසර key access මෙම app එකේ නොමැත."
  },
  version: { en: "Version", ta: "Version", si: "Version" },
  s_reset: { en: "Reset all settings", ta: "எல்லா அமைப்புகளையும் மீட்டமை", si: "සියලු සැකසුම් යළි සකසන්න" },
  reset_confirm: { en: "Reset all settings, saved vehicles and recent searches?", ta: "எல்லா அமைப்புகள், சேமித்த வாகனங்கள், சமீபத்திய தேடல்களை மீட்டமைக்கவா?", si: "සියලු සැකසුම්, සුරැකි වාහන සහ මෑත සෙවීම් යළි සකසන්නද?" },
  legend: { en: "What the marks mean", ta: "குறிகளின் பொருள்", si: "සලකුණුවල තේරුම" }
};
