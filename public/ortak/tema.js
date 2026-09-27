// Tema: Açıq / Qaranlıq / Sistem + tema rəngi. Seçim bu cihazda yadda saxlanılır.
import { t } from "./i18n.js";
import { kacis } from "./yardim.js";

export const RENGLER = [
  { kod: "#9a6b3f", ad: "tema.renk.qizili" },
  { kod: "#8e2c3b", ad: "tema.renk.bordo" },
  { kod: "#b4577a", ad: "tema.renk.cehrayi" },
  { kod: "#6b4fa0", ad: "tema.renk.benovseyi" },
  { kod: "#2f5d8a", ad: "tema.renk.deniz" },
  { kod: "#2f7d6d", ad: "tema.renk.firuze" },
  { kod: "#5f7a4a", ad: "tema.renk.zeytun" },
  { kod: "#4a4a4a", ad: "tema.renk.qrafit" },
];
export const MODLAR = ["sistem", "aciq", "qaranliq"];

export function temaOku() {
  try {
    const x = JSON.parse(localStorage.getItem("tema") || "{}") || {};
    return { mod: MODLAR.includes(x.mod) ? x.mod : "sistem", renk: x.renk || RENGLER[0].kod };
  } catch {
    return { mod: "sistem", renk: RENGLER[0].kod };
  }
}

const sistemQaranliq = () => window.matchMedia?.("(prefers-color-scheme: dark)").matches;

export function temaUygula(tema = temaOku()) {
  const qaranliq = tema.mod === "qaranliq" || (tema.mod === "sistem" && sistemQaranliq());
  const d = document.documentElement;
  d.dataset.tema = qaranliq ? "qaranliq" : "aciq";
  d.style.setProperty("--vurgu", tema.renk);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", qaranliq ? "#0f0f10" : "#faf8f5");
}

export function temaYaz(degisiklik) {
  const yeni = { ...temaOku(), ...degisiklik };
  try { localStorage.setItem("tema", JSON.stringify(yeni)); } catch {}
  temaUygula(yeni);
  return yeni;
}

/** Hazırkı vurğu rəngi (hex) — məs. Instagram şəkli üçün */
export const vurguRengi = () => temaOku().renk;

// Sistem rejimində telefon gecə/gündüz dəyişəndə avtomatik uyğunlaşsın
window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
  if (temaOku().mod === "sistem") temaUygula();
});

/** Ayarlar səhifəsində tema bölməsini çəkir */
export function temaAyarlari(kok) {
  const ciz = () => {
    const tema = temaOku();
    kok.innerHTML = `
      <div class="alan">
        <label>${kacis(t("tema.rejim"))}</label>
        <div class="segment" role="radiogroup">
          ${MODLAR.map((m) => `<button type="button" role="radio" aria-checked="${m === tema.mod}"
            class="${m === tema.mod ? "secili" : ""}" data-mod="${m}">${kacis(t("tema.mod." + m))}</button>`).join("")}
        </div>
      </div>
      <div class="alan" style="margin-bottom:0">
        <label>${kacis(t("tema.renk"))}</label>
        <div class="renkler">
          ${RENGLER.map((r) => `<button type="button" class="renk-sec ${r.kod === tema.renk ? "secili" : ""}"
            data-renk="${r.kod}" style="--r:${r.kod}" title="${kacis(t(r.ad))}" aria-label="${kacis(t(r.ad))}"></button>`).join("")}
        </div>
      </div>`;
    kok.querySelectorAll("[data-mod]").forEach((b) => b.addEventListener("click", () => { temaYaz({ mod: b.dataset.mod }); ciz(); }));
    kok.querySelectorAll("[data-renk]").forEach((b) => b.addEventListener("click", () => { temaYaz({ renk: b.dataset.renk }); ciz(); }));
  };
  ciz();
}
