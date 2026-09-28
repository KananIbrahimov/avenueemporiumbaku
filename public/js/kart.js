// Məhsul kartı (ana səhifə, bəyəndiklərim) — ürək düyməsi ilə
import { t, yerel } from "../ortak/i18n.js";
import { kacis, bildir } from "../ortak/yardim.js";
import { IKON } from "../ortak/ikon.js";
import { fiyatHtml } from "./fiyat-goster.js";
import { favoriMi, favoriDegistir } from "./depo.js";

export function urekHtml(id, boyuk = false) {
  const b = favoriMi(id);
  return `<button type="button" class="urek-btn ${boyuk ? "boyuk" : ""} ${b ? "secili" : ""}" data-urek="${kacis(id)}"
    aria-pressed="${b}" aria-label="${kacis(t(b ? "begen.cixar" : "begen.elave"))}">${b ? IKON.urekDolu : IKON.urek}</button>`;
}

export function kartHtml(u, uye) {
  return `
    <div class="urun-kart-kap">
      <a class="urun-kart" href="urun.html?id=${encodeURIComponent(u.id)}">
        <div class="foto">
          ${u.kapak ? `<img src="${kacis(u.kapak)}" alt="${kacis(yerel(u.ad))}" loading="lazy">` : ""}
          ${Number(u.indirimYuzde) > 0 ? `<span class="rozet">−${kacis(u.indirimYuzde)}%</span>` : ""}
          ${(u.ekKategoriler || []).includes("sale") ? `<span class="rozet rozet-sale">SALE</span>` : ""}
        </div>
        <div class="marka">${kacis(u.marka || "")}</div>
        <div class="ad">${kacis(yerel(u.ad))}</div>
        ${fiyatHtml(u, uye)}
      </a>
      ${urekHtml(u.id)}
    </div>`;
}

/** Ürək düymələrinə klikləri tutur (bir dəfə, kök elementə) */
export function urekleriBagla(kok, sonra) {
  kok.addEventListener("click", (e) => {
    const b = e.target.closest("[data-urek]");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    const indi = favoriDegistir(b.dataset.urek);
    b.classList.toggle("secili", indi);
    b.setAttribute("aria-pressed", indi);
    b.setAttribute("aria-label", t(indi ? "begen.cixar" : "begen.elave"));
    b.innerHTML = indi ? IKON.urekDolu : IKON.urek;
    bildir(t(indi ? "begen.elaveOlundu" : "begen.cixarildi"), indi ? "basari" : "bilgi");
    sonra?.(b.dataset.urek, indi);
  });
}
