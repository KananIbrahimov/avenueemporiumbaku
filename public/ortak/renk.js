// Rəng adı → rəng kodu. Rəng adlarının yanında kiçik rəng dairəsi göstərmək üçün.
// Tanınmayan ad üçün boz qırıq xətli dairə göstərilir (ad yenə yazılır).
import { kacis } from "./yardim.js";

const norm = (s) => String(s || "").toLocaleLowerCase("az").trim().replace(/\s+/g, " ");

// Azərbaycanca adlar + tez-tez yazılan türkcə / ingiliscə / rusca qarşılıqları
const KODLAR = {
  "qara": "#111111", "siyah": "#111111", "black": "#111111", "чёрный": "#111111", "черный": "#111111",
  "ağ": "#ffffff", "beyaz": "#ffffff", "white": "#ffffff", "белый": "#ffffff",
  "bej": "#d8c3a5", "beige": "#d8c3a5", "бежевый": "#d8c3a5",
  "krem": "#f3e7c9", "cream": "#f3e7c9", "ekru": "#efe6d2", "ecru": "#efe6d2", "süd": "#f5efe0",
  "boz": "#8a8f96", "gri": "#8a8f96", "grey": "#8a8f96", "gray": "#8a8f96", "серый": "#8a8f96",
  "açıq boz": "#c4c8cd", "tünd boz": "#4a4f55", "antrasit": "#383e42", "füme": "#5b5f63",
  "tünd göy": "#1f2d4d", "lacivert": "#1f2d4d", "navy": "#1f2d4d", "tünd mavi": "#1f2d4d",
  "göy": "#2f6fd1", "mavi": "#3b82f6", "blue": "#3b82f6", "синий": "#2f5bd1", "açıq mavi": "#9cc9f5",
  "səma mavisi": "#87ceeb", "indigo": "#4b3f9e", "denim": "#4a6a8f", "cins": "#4a6a8f",
  "qırmızı": "#d62828", "kırmızı": "#d62828", "red": "#d62828", "красный": "#d62828",
  "bordo": "#7b1e2b", "burgundy": "#7b1e2b", "şərabı": "#6d1a2a",
  "çəhrayı": "#f4a6c0", "pembe": "#f4a6c0", "pink": "#f4a6c0", "розовый": "#f4a6c0", "pudra": "#e8c4c0",
  "fuşya": "#d6338a", "fuksiya": "#d6338a", "fuchsia": "#d6338a",
  "yaşıl": "#2e8b57", "yeşil": "#2e8b57", "green": "#2e8b57", "зелёный": "#2e8b57", "зеленый": "#2e8b57",
  "açıq yaşıl": "#8fd19e", "tünd yaşıl": "#1d4d34", "zümrüd": "#0f8a5f", "mint": "#a8e6cf", "nanə": "#a8e6cf",
  "haki": "#7d7b4f", "khaki": "#7d7b4f", "zeytun": "#6b6e2f", "zeytin": "#6b6e2f", "olive": "#6b6e2f",
  "qəhvəyi": "#6f4a2f", "kahverengi": "#6f4a2f", "brown": "#6f4a2f", "коричневый": "#6f4a2f",
  "açıq qəhvəyi": "#a9774f", "tünd qəhvəyi": "#4a2f1e", "kamel": "#c19a6b", "camel": "#c19a6b",
  "karamel": "#b8763e", "şokolad": "#4a2c20", "tarçın": "#9c5a2e", "darçın": "#9c5a2e",
  "sarı": "#f2c230", "yellow": "#f2c230", "жёлтый": "#f2c230", "желтый": "#f2c230", "xardal": "#c9a227", "hardal": "#c9a227",
  "narıncı": "#f28c28", "turuncu": "#f28c28", "orange": "#f28c28", "оранжевый": "#f28c28",
  "bənövşəyi": "#7e57c2", "mor": "#7e57c2", "purple": "#7e57c2", "фиолетовый": "#7e57c2",
  "lila": "#c3a6e0", "lilac": "#c3a6e0", "yasəmən": "#c3a6e0", "lavanda": "#b9a7dc",
  "firuzəyi": "#2cb5a9", "turkuaz": "#2cb5a9", "turquoise": "#2cb5a9", "mint yaşılı": "#98e3c6",
  "gümüşü": "linear-gradient(135deg,#f2f2f2,#9ea3a8 55%,#e6e6e6)", "gümüş": "linear-gradient(135deg,#f2f2f2,#9ea3a8 55%,#e6e6e6)", "silver": "linear-gradient(135deg,#f2f2f2,#9ea3a8 55%,#e6e6e6)",
  "qızılı": "linear-gradient(135deg,#f7e08a,#c59a2c 55%,#f3d26b)", "altın": "linear-gradient(135deg,#f7e08a,#c59a2c 55%,#f3d26b)", "gold": "linear-gradient(135deg,#f7e08a,#c59a2c 55%,#f3d26b)",
  "rose gold": "linear-gradient(135deg,#f6d1c1,#c98b76 55%,#f2c4b3)",
  "rəngli": "conic-gradient(#d62828,#f2c230,#2e8b57,#3b82f6,#7e57c2,#d62828)",
  "çox rəngli": "conic-gradient(#d62828,#f2c230,#2e8b57,#3b82f6,#7e57c2,#d62828)",
  "renkli": "conic-gradient(#d62828,#f2c230,#2e8b57,#3b82f6,#7e57c2,#d62828)",
  "multicolor": "conic-gradient(#d62828,#f2c230,#2e8b57,#3b82f6,#7e57c2,#d62828)",
  "şəffaf": "repeating-conic-gradient(#d0d0d0 0 25%,#ffffff 0 50%) 50%/8px 8px",
};

/** Rəng adına uyğun CSS dəyəri (rəng və ya gradient); tanınmırsa null */
export function renkKodu(ad) {
  const n = norm(ad);
  if (!n) return null;
  if (KODLAR[n]) return KODLAR[n];
  // Admin özü "#ff0000" kimi kod yazıbsa
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(n)) return n;
  // "Qara-ağ", "Qara / Ağ" kimi iki rəngli adlar → yarı-yarı
  const hisse = n.split(/\s*[-/+,&]\s*|\s+və\s+/).filter(Boolean);
  if (hisse.length === 2) {
    const [a, b] = hisse.map((h) => KODLAR[h]);
    if (a && b && !a.includes("gradient") && !b.includes("gradient")) return `linear-gradient(135deg,${a} 50%,${b} 50%)`;
  }
  // "Açıq çəhrayı", "Tünd yaşıl" kimi: son söz tanınırsa onu götür
  const son = n.split(" ").pop();
  return KODLAR[son] || null;
}

/** Kiçik rəng dairəsi (HTML) */
export function renkNoktasi(ad, sinif = "") {
  const k = renkKodu(ad);
  return `<span class="renk-nokta ${k ? "" : "bilinmir"} ${sinif}" aria-hidden="true"${k ? ` style="background:${kacis(k)}"` : ""}></span>`;
}
