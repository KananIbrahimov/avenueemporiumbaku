// Valyuta kursları: 1 vahid = ? AZN. Pulsuz açıq mənbədən gündəlik alınır, cihazda 6 saat saxlanılır.
export const VALYUTALAR = ["AZN", "USD", "EUR", "TRY", "GBP", "RUB", "CNY", "AED"];
export const SIMGE = { AZN: "₼", USD: "$", EUR: "€", TRY: "₺", GBP: "£", RUB: "₽", CNY: "¥", AED: "د.إ" };

const MENBELER = [
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/azn.min.json",
  "https://latest.currency-api.pages.dev/v1/currencies/azn.min.json",
];
const ACAR = "kurslar";
const OMUR = 6 * 60 * 60 * 1000;

let yuklenir = null;

/** Qaytarır: { tarix: "2026-09-27", AZN: 1, USD: 1.7, ... } və ya null */
export function kurslariAl() {
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
