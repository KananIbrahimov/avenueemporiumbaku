// Valyuta kursları: 1 vahid = ? AZN.
// Əsas: Ayarlar-da admin tərəfindən təyin olunan kurslar (ayarlar/kurslar) — hesablama bunlarla aparılır.
// Təyin olunmayan valyuta üçün pulsuz açıq mənbədən bazar kursu götürülür (cihazda 6 saat saxlanılır).
import { db, doc, getDoc, setDoc, serverTimestamp } from "../../ortak/firebase.js";
export const VALYUTALAR = ["AZN", "USD", "EUR", "TRY", "GBP", "RUB", "CNY", "AED"];
export const STANDART_KURSLAR = { USD: 1.7, EUR: 1.95 };

export const SIMGE = { AZN: "₼", USD: "$", EUR: "€", TRY: "₺", GBP: "£", RUB: "₽", CNY: "¥", AED: "د.إ" };

const MENBELER = [
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/azn.min.json",
  "https://latest.currency-api.pages.dev/v1/currencies/azn.min.json",
];
const ACAR = "kurslar";
const OMUR = 6 * 60 * 60 * 1000;

let yuklenir = null;

/** Bazar kursları (açıq mənbə). Qaytarır: { tarix, AZN: 1, USD: 1.7, ... } və ya null */
export function bazarKurslari() {
  try {
    const x = JSON.parse(localStorage.getItem(ACAR));
    if (x && Date.now() - x.alindi < OMUR) return Promise.resolve(x.kurs);
  } catch {}
  yuklenir ||= (async () => {
    for (const url of MENBELER) {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) continue;
        const j = await r.json();
        const kurs = { tarix: j.date, AZN: 1 };
        for (const v of VALYUTALAR) {
          const x = j.azn?.[v.toLowerCase()];
          if (v !== "AZN" && x > 0) kurs[v] = Math.round((1 / x) * 10000) / 10000; // 1 v = ? AZN
        }
        try { localStorage.setItem(ACAR, JSON.stringify({ alindi: Date.now(), kurs })); } catch {}
        return kurs;
      } catch {}
    }
    yuklenir = null;
    return null;
  })();
  return yuklenir;
}

/** Ayarlar-da təyin olunmuş kurslar: { USD: 1.7, EUR: 1.95, ... } (təyin olunmayıbsa standart) */
export async function teyinliKurslar() {
  try {
    const s = await getDoc(doc(db, "ayarlar", "kurslar"));
    if (s.exists() && s.data().kurs) return s.data().kurs;
  } catch (e) { console.warn(e); }
  return { ...STANDART_KURSLAR };
}

export async function kurslariYaz(kurs) {
  await setDoc(doc(db, "ayarlar", "kurslar"), { kurs, guncelleme: serverTimestamp() });
}

/**
 * Hesablama üçün kurs: əvvəl Ayarlar-dakı, yoxdursa bazar kursu.
 * Qaytarır: { deger, menbe: "ayarlar" | "bazar" | null, tarix }
 */
export async function hesabKursu(valyuta) {
  if (valyuta === "AZN") return { deger: 1, menbe: "ayarlar" };
  const teyin = await teyinliKurslar();
  if (teyin[valyuta] > 0) return { deger: teyin[valyuta], menbe: "ayarlar" };
  const bazar = await bazarKurslari();
  if (bazar?.[valyuta]) return { deger: bazar[valyuta], menbe: "bazar", tarix: bazar.tarix };
  return { deger: 0, menbe: null };
}
