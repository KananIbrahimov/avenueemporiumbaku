// Mağaza: müştərinin gördüyü ana səhifə (admin panelin içində). Məhsula toxunanda redaktə açılır.
import { db, collection, getDocs } from "../../ortak/firebase.js";
import { t, yerel } from "../../ortak/i18n.js";
import { $, $$, kacis, hataMesaji } from "../../ortak/yardim.js";
import { fiyatHtml } from "../../js/fiyat-goster.js";
import { kategorileriGetir } from "./veri.js";
import { instagramAc } from "./instagram.js";
import { IKON } from "../../ortak/ikon.js";

let secim = { kategori: "", ara: "", pasif: false };

export async function magazaSekmesi(kok) {
  kok.innerHTML = `<p class="bos">${kacis(t("genel.yukleniyor"))}</p>`;
  let urunler, kategoriler;
  try {
    const [us, ks] = await Promise.all([getDocs(collection(db, "urunler")), kategorileriGetir()]);
    urunler = us.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.olusturma?.toMillis?.() || 0) - (a.olusturma?.toMillis?.() || 0));
    kategoriler = ks;
  } catch (e) { kok.innerHTML = `<p class="bos">${kacis(hataMesaji(e))}</p>`; return; }

  const aktivSay = urunler.filter((u) => u.aktif).length;
  kok.innerHTML = `
    <div class="bolum-ust">
      <h1>${kacis(t("admin.sekme.magaza"))}</h1>
      <a class="btn btn-ince btn-kucuk" href="../" target="_blank" rel="noopener">${kacis(t("admin.magaza.saytiAc"))} ↗</a>
    </div>
    <p class="ipucu" style="margin-top:-8px">${kacis(t("admin.magaza.aciklama", { aktiv: aktivSay, hamisi: urunler.length }))}</p>
    <div class="axtaris" style="margin:10px 0 4px">
      <svg class="ikon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>
      <input id="m-ara" type="search" placeholder="${kacis(t("filtre.araUzun"))}" value="${kacis(secim.ara)}">
    </div>
    <div class="cipler" id="m-kat"></div>
    <label class="onay" style="margin:0 0 12px"><input type="checkbox" id="m-pasif" ${secim.pasif ? "checked" : ""}> ${kacis(t("admin.magaza.pasifleri"))}</label>
    <div class="izgara" id="m-urunler"></div>`;

  const katCiz = () => {
    const tumu = [{ id: "", ad: t("filtre.tumu") }, ...kategoriler.map((k) => ({ id: k.id, ad: yerel(k.ad) }))];
    $("#m-kat", kok).innerHTML = tumu.map((k) =>
      `<button class="cip ${k.id === secim.kategori ? "secili" : ""}" data-k="${kacis(k.id)}">${kacis(k.ad)}</button>`).join("");
  };
  const ciz = () => {
    const q = secim.ara.toLocaleLowerCase("az");
    const liste = urunler.filter((u) =>
      (secim.pasif || u.aktif) &&
      (!secim.kategori || u.kategoriId === secim.kategori) &&
      (!q || `${yerel(u.ad)} ${u.marka || ""}`.toLocaleLowerCase("az").includes(q)));
    $("#m-urunler", kok).innerHTML = liste.length ? liste.map((u) => `
      <div class="urun-kart-kap">
        <a class="urun-kart ${u.aktif ? "" : "pasif"}" href="#urunler/${encodeURIComponent(u.id)}">
          <div class="foto">
            ${u.kapak ? `<img src="${kacis(u.kapak)}" alt="" loading="lazy">` : ""}
            ${Number(u.indirimYuzde) > 0 ? `<span class="rozet">−${kacis(u.indirimYuzde)}%</span>` : ""}
            ${u.aktif ? "" : `<span class="rozet" style="left:auto;right:8px">${kacis(t("admin.magaza.gizli"))}</span>`}
          </div>
          <div class="marka">${kacis(u.marka || "")}</div>
          <div class="ad">${kacis(yerel(u.ad))}</div>
          ${fiyatHtml(u, false)}
        </a>
        <button type="button" class="ig-mini" data-ig="${kacis(u.id)}" aria-label="${kacis(t("admin.magaza.igPaylas"))}" title="${kacis(t("admin.magaza.igPaylas"))}">${IKON.instagram}</button>
      </div>`).join("")
      : `<div class="bos" style="grid-column:1/-1"><p>${kacis(t(urunler.length ? "vitrin.bos" : "admin.urun.bos"))}</p>
          <a class="btn" href="#urunler/yeni">+ ${kacis(t("admin.urun.yeni"))}</a></div>`;
  };
  katCiz(); ciz();
  $("#m-urunler", kok).addEventListener("click", (e) => {
    const b = e.target.closest("[data-ig]");
    if (!b) return;
    e.preventDefault();
    instagramAc(b.dataset.ig);
  });
  $("#m-kat", kok).addEventListener("click", (e) => {
    const b = e.target.closest("[data-k]"); if (!b) return;
    secim.kategori = b.dataset.k; katCiz(); ciz();
  });
  $("#m-ara", kok).addEventListener("input", (e) => { secim.ara = e.target.value; ciz(); });
  $("#m-pasif", kok).addEventListener("change", (e) => { secim.pasif = e.target.checked; ciz(); });
}
