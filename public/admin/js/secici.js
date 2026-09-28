// Axtarışlı seçim siyahısı (brend, kateqoriya, ölçü, rəng)
// - Qutuya toxunanda aşağıdan pəncərə açılır: axtarış + siyahı
// - Axtarışda tapılmayanı "+ yenisini əlavə et" ilə əlavə etmək olur (ad yazılan kiçik pəncərə)
// - Çoxlu seçimdə (ölçü, rəng) seçilənlər qutunun altında 3 sütunlu düzülür
import { t } from "../../ortak/i18n.js";
import { kacis, bildir } from "../../ortak/yardim.js";
import { renkNoktasi } from "../../ortak/renk.js";

const norm = (s) => String(s || "").toLocaleLowerCase("az").trim();

/** Kiçik pəncərə: yeni ad soruşur. Qaytarır: yazılan ad və ya null */
export function adSorus(basliq, ilkDeger = "", { bosOlar = false, dugme = "" } = {}) {
  return new Promise((ok) => {
    const arxa = document.createElement("div");
    arxa.className = "modal-arxa ust-qat";
    arxa.innerHTML = `<form class="modal kicik-modal">
      <div class="modal-ust"><h2>${kacis(basliq)}</h2></div>
      <div class="alan"><label>${kacis(t("secici.ad"))}</label>
        <input name="ad" maxlength="60" autocomplete="off" value="${kacis(ilkDeger)}"></div>
      <div class="aksiyonlar" style="justify-content:flex-end">
        <button type="button" class="btn btn-ince" data-legv>${kacis(t("secici.legv"))}</button>
        <button type="submit" class="btn">${kacis(dugme || t("secici.elaveEt"))}</button>
      </div></form>`;
    document.body.appendChild(arxa);
    const input = arxa.querySelector("input");
    setTimeout(() => { input.focus(); input.select(); }, 50);
    const bitir = (v) => { arxa.remove(); ok(v); };
    arxa.querySelector("[data-legv]").addEventListener("click", () => bitir(null));
    arxa.addEventListener("click", (e) => { if (e.target === arxa) bitir(null); });
    arxa.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = input.value.trim();
      if (!v && !bosOlar) return input.focus();
      bitir(v);
    });
  });
}

/**
 * @param {HTMLElement} kok  - komponentin yerləşəcəyi element
 * @param {object} o
 *   etiket, yerTutucu, coxlu (bool), secenekler: [{id, ad}], secili: [id] və ya id,
 *   renkli (bool): adların yanında rəng dairəsi göstərilsin (Rənglər),
 *   yeniBasliq: pop-up başlığı, yeniElave: async (ad) => {id, ad} | null, deyisdi: (secili) => void
 */
export function secici(kok, o) {
  let secenekler = [...o.secenekler];
  let secili = o.coxlu ? [...(o.secili || [])] : (o.secili ? [o.secili] : []);

  const adOf = (id) => secenekler.find((s) => s.id === id)?.ad ?? id;
  const nokta = (ad) => (o.renkli ? renkNoktasi(ad) : "");

  function qutuCiz() {
    const bos = !secili.length;
    kok.innerHTML = `
      <label>${o.ikon ? `${o.ikon} ` : ""}${kacis(o.etiket)}${o.vacib ? ` <span class="vacib">*</span>` : ""}</label>
      <button type="button" class="secici-qutu ${bos ? "bos" : ""}">
        <span>${bos ? kacis(o.yerTutucu || t("secici.sec")) : o.coxlu ? kacis(t("secici.secildi", { say: secili.length })) : kacis(adOf(secili[0]))}</span>
        <span class="ox">▾</span>
      </button>
      ${o.coxlu && secili.length ? `<div class="secilenler">${secili.map((id) =>
        `<span class="secilen"><span class="secilen-ad">${nokta(adOf(id))}${kacis(adOf(id))}</span><button type="button" data-cixar="${kacis(id)}" aria-label="×">×</button></span>`).join("")}</div>` : ""}`;
    kok.querySelector(".secici-qutu").addEventListener("click", ac);
    kok.querySelectorAll("[data-cixar]").forEach((b) => b.addEventListener("click", () => {
      secili = secili.filter((x) => x !== b.dataset.cixar);
      qutuCiz(); o.deyisdi?.(deger());
    }));
  }

  function ac() {
    const arxa = document.createElement("div");
    arxa.className = "modal-arxa";
    arxa.innerHTML = `<div class="modal secici-modal" role="dialog" aria-modal="true">
      <div class="modal-ust"><h2>${kacis(o.etiket)}</h2>
        <button type="button" class="btn btn-kucuk" data-hazir>${kacis(t(o.coxlu ? "secici.hazir" : "secici.bagla"))}</button></div>
      <div class="axtaris" style="margin-bottom:10px">
        <svg class="ikon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>
        <input type="search" placeholder="${kacis(t("secici.axtar"))}" autocomplete="off">
      </div>
      <div class="secici-liste"></div>
      <button type="button" class="btn btn-ince btn-tam" data-yeni style="margin-top:10px">+ ${kacis(t("secici.yenisi"))}</button>
    </div>`;
    document.body.appendChild(arxa);
    const input = arxa.querySelector("input");
    const liste = arxa.querySelector(".secici-liste");
    const bagla = () => { arxa.remove(); qutuCiz(); o.deyisdi?.(deger()); };

    const listeCiz = () => {
      const q = norm(input.value);
      const uygun = secenekler.filter((s) => !q || norm(s.ad).includes(q));
      const tamVar = secenekler.some((s) => norm(s.ad) === q);
      liste.innerHTML = uygun.map((s) => {
        const sec = secili.includes(s.id);
        return `<button type="button" class="secici-oge ${sec ? "secili" : ""}" data-id="${kacis(s.id)}">
          <span class="isaret">${sec ? "✓" : ""}</span>${nokta(s.ad)}<span>${kacis(s.ad)}</span></button>`;
      }).join("") +
        (q && !tamVar ? `<button type="button" class="secici-oge yeni" data-yeni-ad="${kacis(input.value.trim())}">
          <span class="isaret">+</span><span>${kacis(t("secici.elaveEtAd", { ad: input.value.trim() }))}</span></button>` : "") +
        (!uygun.length && !q ? `<p class="soluk" style="text-align:center">${kacis(t("secici.bos"))}</p>` : "");
    };

    async function yeniYarat(ilk) {
      const ad = await adSorus(o.yeniBasliq || t("secici.yenisi"), ilk);
      if (!ad) return;
      const var_ = secenekler.find((s) => norm(s.ad) === norm(ad));
      if (var_) { sec(var_.id); return; }
      try {
        const yeni = await o.yeniElave(ad);
        if (!yeni) return;
        secenekler.push(yeni);
        sec(yeni.id);
        bildir(t("secici.elaveOlundu", { ad: yeni.ad }), "basari");
      } catch (e) { console.error(e); bildir(t("hata.genel"), "hata"); }
    }

    function sec(id) {
      if (o.coxlu) {
        secili = secili.includes(id) ? secili.filter((x) => x !== id) : [...secili, id];
        input.value = "";
        listeCiz();
        input.focus();
      } else {
        secili = [id];
        bagla();
      }
    }

    liste.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.yeniAd !== undefined) yeniYarat(b.dataset.yeniAd);
      else sec(b.dataset.id);
    });
    input.addEventListener("input", listeCiz);
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const q = norm(input.value);
      const tam = secenekler.find((s) => norm(s.ad) === q);
      if (tam) sec(tam.id); else if (q) yeniYarat(input.value.trim());
    });
    arxa.querySelector("[data-yeni]").addEventListener("click", () => yeniYarat(input.value.trim()));
    arxa.querySelector("[data-hazir]").addEventListener("click", bagla);
    arxa.addEventListener("click", (e) => { if (e.target === arxa) bagla(); });
    listeCiz();
    if (window.matchMedia("(min-width: 761px)").matches) input.focus();
  }

  const deger = () => (o.coxlu ? [...secili] : secili[0] || "");
  qutuCiz();
  return { deger, secenekler: () => secenekler };
}
