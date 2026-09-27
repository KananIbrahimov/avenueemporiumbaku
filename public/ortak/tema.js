// Tema: Qaranlıq (standart) və ya Açıq — gümüşü rənglərlə. Seçim bu cihazda saxlanılır.
import { t } from "./i18n.js";
import { kacis } from "./yardim.js";

export const GUMUSU = "#c3c8ce";
const ACAR = "temaRejim";

export const temaRejimi = () => {
  try { return localStorage.getItem(ACAR) === "aciq" ? "aciq" : "qaranliq"; } catch { return "qaranliq"; }
};

export function temaUygula(mod = temaRejimi()) {
  document.documentElement.dataset.tema = mod;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", mod === "aciq" ? "#f3f4f6" : "#0b0c0e");
}

export function temaSec(mod) {
  try { localStorage.setItem(ACAR, mod); } catch {}
  temaUygula(mod);
}

/** Ayarlar-da "Görünüş" bölməsi: Qaranlıq | Açıq */
export function temaAyarlari(kok) {
  const ciz = () => {
    const m = temaRejimi();
    kok.innerHTML = `<div class="segment" role="radiogroup" aria-label="${kacis(t("tema.rejim"))}">
      ${["qaranliq", "aciq"].map((x) => `<button type="button" role="radio" aria-checked="${x === m}" class="${x === m ? "secili" : ""}" data-mod="${x}">
        ${x === "qaranliq" ? "🌙" : "☀️"} ${kacis(t("tema.mod." + x))}</button>`).join("")}
    </div>`;
    kok.querySelectorAll("[data-mod]").forEach((b) => b.addEventListener("click", () => { temaSec(b.dataset.mod); ciz(); }));
  };
  ciz();
}

/** Instagram şəkli və s. üçün vurğu rəngi */
export const vurguRengi = () => GUMUSU;
