/* =====================================================================
   DTC TITLE GLOSSARY — turns an English DTC title into a Tamil / Sinhala
   helper line.

   Mechanics read the English title on the scan tool, so component names
   (MAF Sensor, Fuel Rail, Bank 1 …) stay in English. Only the FAULT TYPE
   words are translated: "Circuit Low", "Stuck Open", "Too High" …
   The app always shows the English title too, so this line is an aid,
   never a replacement.

   Order matters: whole-title patterns first, then phrases, longest first.
   A hand-written entry in data-src/i18n/ always wins over this file.
   ===================================================================== */

/* whole-title patterns that need the words re-ordered */
const PATTERNS = [
  [/^Lost Communication [Ww]ith (.+)$/, "$1 உடன் தொடர்பு இழப்பு", "$1 සමඟ සන්නිවේදනය අහිමි විය"],
  [/^Invalid Data Received [Ff]rom (.+)$/, "$1 இடமிருந்து தவறான data வந்தது", "$1 වෙතින් වැරදි data ලැබුණි"],
  [/^Software Incompatibility [Ww]ith (.+)$/, "$1 உடன் software பொருந்தவில்லை", "$1 සමඟ software නොගැළපේ"],
  [/^Open in (.+)$/i, "$1 – open (இணைப்பு துண்டிப்பு)", "$1 – open (සම්බන්ධතාව විසන්ධි වී ඇත)"],
  [/^Short in (.+)$/i, "$1 – short", "$1 – short"],
  [/^Open or short in (.+)$/i, "$1 – open அல்லது short", "$1 – open හෝ short"]
];

/* [English phrase, Tamil, Sinhala] — matched case-insensitively on word boundaries */
const PHRASES = [
  ["Circuit Range/Performance Problem", "சர்க்யூட் – மதிப்பு வரம்புக்கு வெளியே (Range/Performance)", "පරිපථය – අගය පරාසයෙන් පිටත (Range/Performance)"],
  ["Circuit Range/Performance", "சர்க்யூட் – மதிப்பு வரம்புக்கு வெளியே (Range/Performance)", "පරිපථය – අගය පරාසයෙන් පිටත (Range/Performance)"],
  ["Circuit Range / Performance", "சர்க்யூட் – மதிப்பு வரம்புக்கு வெளியே (Range/Performance)", "පරිපථය – අගය පරාසයෙන් පිටත (Range/Performance)"],
  ["Range/Performance Problem", "மதிப்பு வரம்புக்கு வெளியே (Range/Performance)", "අගය පරාසයෙන් පිටත (Range/Performance)"],
  ["Range/Performance", "மதிப்பு வரம்புக்கு வெளியே (Range/Performance)", "අගය පරාසයෙන් පිටත (Range/Performance)"],
  ["Range / Performance", "மதிப்பு வரம்புக்கு வெளியே (Range/Performance)", "අගය පරාසයෙන් පිටත (Range/Performance)"],
  ["Circuit Short to Battery", "சர்க்யூட் – battery (+) உடன் short", "පරිපථය – battery (+) සමඟ short"],
  ["Circuit Short to Ground", "சர்க்யூட் – ground உடன் short", "පරිපථය – ground සමඟ short"],
  ["Short to Battery", "battery (+) உடன் short", "battery (+) සමඟ short"],
  ["Short to Ground", "ground உடன் short", "ground සමඟ short"],
  ["short to BATT", "battery (+) உடன் short", "battery (+) සමඟ short"],
  ["short to GND", "ground உடன் short", "ground සමඟ short"],
  ["Circuit Low Input", "சர்க்யூட் – voltage குறைவு (Low)", "පරිපථය – voltage අඩුයි (Low)"],
  ["Circuit Low Voltage", "சர்க்யூட் – voltage குறைவு (Low)", "පරිපථය – voltage අඩුයි (Low)"],
  ["Circuit High Input", "சர்க்யூட் – voltage அதிகம் (High)", "පරිපථය – voltage වැඩියි (High)"],
  ["Circuit High Voltage", "சர்க்யூட் – voltage அதிகம் (High)", "පරිපථය – voltage වැඩියි (High)"],
  ["Circuit Low", "சர்க்யூட் – voltage குறைவு (Low)", "පරිපථය – voltage අඩුයි (Low)"],
  ["Circuit High", "சர்க்யூட் – voltage அதிகம் (High)", "පරිපථය – voltage වැඩියි (High)"],
  ["Circuit/Open", "சர்க்யூட் – open (இணைப்பு துண்டிப்பு)", "පරිපථය – open (විසන්ධි වී ඇත)"],
  ["Circuit / Open", "சர்க்யூட் – open (இணைப்பு துண்டிப்பு)", "පරිපථය – open (විසන්ධි වී ඇත)"],
  ["Circuit Open", "சர்க்யூட் – open (இணைப்பு துண்டிப்பு)", "පරිපථය – open (විසන්ධි වී ඇත)"],
  ["Circuit Intermittent", "சர்க்யூட் – விட்டு விட்டு வரும் பழுது (Intermittent)", "පරිපථය – වරින් වර එන දෝෂය (Intermittent)"],
  ["Circuit Malfunction", "சர்க்யூட் பழுது", "පරිපථ දෝෂය"],
  ["Circuit Performance", "சர்க்யூட் செயல்திறன் பிரச்சனை (Performance)", "පරිපථ ක්‍රියාකාරීත්ව ගැටලුව (Performance)"],
  ["Control Circuit", "control சர்க்யூட்", "control පරිපථය"],
  ["Intermittent/Erratic", "விட்டு விட்டு வரும் / நிலையற்ற signal (Intermittent)", "වරින් වර එන / අස්ථාවර signal (Intermittent)"],
  ["Intermittent", "விட்டு விட்டு வரும் பழுது (Intermittent)", "වරින් වර එන දෝෂය (Intermittent)"],
  ["Stuck Open", "திறந்த நிலையில் மாட்டிக்கொண்டது (Stuck Open)", "විවෘතව සිරවී ඇත (Stuck Open)"],
  ["Stuck Closed", "மூடிய நிலையில் மாட்டிக்கொண்டது (Stuck Closed)", "වැසී සිරවී ඇත (Stuck Closed)"],
  ["Stuck On", "ON நிலையில் மாட்டிக்கொண்டது (Stuck On)", "ON තත්ත්වයේ සිරවී ඇත (Stuck On)"],
  ["Stuck Off", "OFF நிலையில் மாட்டிக்கொண்டது (Stuck Off)", "OFF තත්ත්වයේ සිරවී ඇත (Stuck Off)"],
  ["Stuck Low", "Low நிலையில் மாட்டிக்கொண்டது (Stuck Low)", "Low තත්ත්වයේ සිරවී ඇත (Stuck Low)"],
  ["Stuck High", "High நிலையில் மாட்டிக்கொண்டது (Stuck High)", "High තත්ත්වයේ සිරවී ඇත (Stuck High)"],
  ["System Too Lean", "கலவை மிக lean (எரிபொருள் குறைவு)", "මිශ්‍රණය ඉතා lean (ඉන්ධන අඩුයි)"],
  ["System Too Rich", "கலவை மிக rich (எரிபொருள் அதிகம்)", "මිශ්‍රණය ඉතා rich (ඉන්ධන වැඩියි)"],
  ["Too Low", "மிகக் குறைவு", "ඉතා අඩුයි"],
  ["Too High", "மிக அதிகம்", "ඉතා වැඩියි"],
  ["Low Input", "input குறைவு (Low)", "input අඩුයි (Low)"],
  ["High Input", "input அதிகம் (High)", "input වැඩියි (High)"],
  ["Low Voltage", "voltage குறைவு", "voltage අඩුයි"],
  ["High Voltage", "voltage அதிகம்", "voltage වැඩියි"],
  ["Voltage Low", "voltage குறைவு", "voltage අඩුයි"],
  ["Voltage High", "voltage அதிகம்", "voltage වැඩියි"],
  ["Random/Multiple Cylinder Misfire Detected", "பல சிலிண்டர்களில் misfire கண்டறியப்பட்டது", "සිලින්ඩර කිහිපයක misfire හඳුනා ගන්නා ලදී"],
  ["Misfire Detected", "misfire கண்டறியப்பட்டது", "misfire හඳුනා ගන්නා ලදී"],
  ["Leak Detected", "கசிவு கண்டறியப்பட்டது", "කාන්දුවක් හඳුනා ගන්නා ලදී"],
  ["Efficiency Below Threshold", "திறன் வரம்புக்கு கீழே", "කාර්යක්ෂමතාව සීමාවට පහළයි"],
  ["Below Threshold", "வரம்புக்கு கீழே", "සීමාවට පහළයි"],
  ["Above Threshold", "வரம்புக்கு மேலே", "සීමාවට ඉහළයි"],
  ["Insufficient Flow", "ஓட்டம் போதவில்லை", "ප්‍රවාහය ප්‍රමාණවත් නැත"],
  ["Excessive Flow", "ஓட்டம் அதிகம்", "ප්‍රවාහය වැඩියි"],
  ["Flow Insufficient", "ஓட்டம் போதவில்லை", "ප්‍රවාහය ප්‍රමාණවත් නැත"],
  ["Flow Excessive", "ஓட்டம் அதிகம்", "ප්‍රවාහය වැඩියි"],
  ["Slow Response", "மெதுவான பதில் (Slow Response)", "ප්‍රතිචාරය මන්දගාමීයි (Slow Response)"],
  ["No Activity Detected", "செயல்பாடு எதுவும் இல்லை", "ක්‍රියාකාරීත්වයක් නැත"],
  ["No Signal", "signal இல்லை", "signal නැත"],
  ["Signal Malfunction", "signal பழுது", "signal දෝෂය"],
  ["Over Temperature", "அதிக வெப்பம்", "අධික උෂ්ණත්වය"],
  ["Overtemperature", "அதிக வெப்பம்", "අධික උෂ්ණත්වය"],
  ["Over Temp", "அதிக வெப்பம்", "අධික උෂ්ණත්වය"],
  ["Overspeed", "அதிக வேகம் (Overspeed)", "අධික වේගය (Overspeed)"],
  ["Ratio Imbalance", "விகித சமநிலையின்மை (Ratio Imbalance)", "අනුපාත අසමතුලිතතාව (Ratio Imbalance)"],
  ["Correlation", "ஒப்பீட்டு பிழை (Correlation)", "සහසම්බන්ධතා දෝෂය (Correlation)"],
  ["Check Sum Error", "checksum பிழை", "checksum දෝෂය"],
  ["Malfunction", "பழுது", "දෝෂය"],
  ["Performance", "செயல்திறன் பிரச்சனை (Performance)", "ක්‍රියාකාරීත්ව ගැටලුව (Performance)"],
  ["Failure", "செயலிழப்பு", "අසාර්ථක වීම"],
  ["Abnormal", "அசாதாரணம்", "අසාමාන්‍යයි"],
  ["Error", "பிழை", "දෝෂය"],
  ["Circuit", "சர்க்யூட்", "පරිපථය"],
  ["Cylinder", "சிலிண்டர்", "සිලින්ඩරය"]
];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");
const RULES = PHRASES.map(([en, ta, si]) => ({ re: new RegExp("(^|[^A-Za-z])" + esc(en) + "(?![A-Za-z])", "i"), ta, si }));

/* translate(title, "ta" | "si") → helper line, or null when no fault word was recognised */
function translate(title, lang) {
  const col = lang === "ta" ? 1 : 2;
  let s = String(title), hit = false;
  for (const p of PATTERNS) if (p[0].test(s)) { s = s.replace(p[0], p[col]); hit = true; break; }
  /* each phrase is used at most once per position; replaced text is protected with markers */
  const kept = [];
  for (const r of RULES) {
    let guard = 0;
    while (r.re.test(s) && guard++ < 6) {
      s = s.replace(r.re, (m, pre) => { kept.push(lang === "ta" ? r.ta : r.si); return pre + "\u0001" + (kept.length - 1) + "\u0002"; });
      hit = true;
    }
  }
  if (!hit) return null;
  return s.replace(/\u0001(\d+)\u0002/g, (m, i) => kept[+i]).replace(/\s+/g, " ").trim();
}

module.exports = { translate, PHRASES, PATTERNS };
