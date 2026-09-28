// Məhsul səhifəsi: şəkillər, ölçü/rəng seçimi, səbətə at, bəyən, paylaş
import { db, doc, getDoc, getDocs, collection, query, where } from "../ortak/firebase.js";
import { MAGAZA_URL } from "../ortak/ayarlar.js";
import { t, yerel } from "../ortak/i18n.js";
import { $, $$, kacis, bildir } from "../ortak/yardim.js";
import { sebeteAt } from "./depo.js";
import { urekHtml, urekleriBagla } from "./kart.js";
import { girisDinle, girisHazir } from "./ust.js";
import { fiyatHtml } from "./fiyat-goster.js";
import { IKON } from "../ortak/ikon.js";
import { renkNoktasi } from "../ortak/renk.js";

const id = new URLSearchParams(location.search).get("id");
const kok = $("#urun");
let urun = null;
let durum = { kullanici: null, profil: null, uye: false };
const secim = { olcu: "", renk: "" };

function bulunamadi() {
  kok.innerHTML = `<div class="bos"><p>${kacis(t("urun.yok"))}</p><a class="btn" href="./">${kacis(t("genel.vitrineDon"))}</a></div>`;
}

function secenekHtml(ad, degerler) {
  if (!degerler?.length) return "";
  return `<div class="alan"><label>${kacis(t("urun." + ad))}</label>
    <div class="secenekler" data-grup="${ad}">${degerler.map((d) =>
      `<button type="button" class="secenek" data-deger="${kacis(d)}">${ad === "renk" ? renkNoktasi(d) : ""}${kacis(d)}</button>`).join("")}</div></div>`;
}

function siparisBolumu() {
  const alan = $("#siparis-alani");
  if (!alan || alan.dataset.hazir) return;
  alan.dataset.hazir = "1";
  alan.innerHTML = `
    <div class="alan" style="max-width:180px"><label>${kacis(t("urun.adet"))}</label>
      <div class="adet-sec"><button type="button" id="azalt" aria-label="−">−</button><span id="adet">1</span><button type="button" id="artir" aria-label="+">+</button></div>
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn" type="button" id="sebete-at" style="flex:1">${IKON.sebet} ${kacis(t("urun.sebeteAt"))}</button>
      ${urekHtml(urun.id, true)}
    </div>
    ${durum.uye ? "" : `<p class="ipucu">${kacis(t("urun.sebetIpucu"))}</p>`}`;
  let adet = 1;
  const goster = () => ($("#adet").textContent = adet);
  $("#azalt").addEventListener("click", () => { adet = Math.max(1, adet - 1); goster(); });
  $("#artir").addEventListener("click", () => { adet = Math.min(20, adet + 1); goster(); });
  urekleriBagla(alan);
  $("#sebete-at").addEventListener("click", () => {
    if (urun.olculer?.length && !secim.olcu) return bildir(t("urun.olcuSec"), "hata");
    if (urun.renkler?.length && !secim.renk) return bildir(t("urun.renkSec"), "hata");
    if (!sebeteAt(urun.id, secim.olcu, secim.renk, adet)) return bildir(t("sebet.dolu"), "hata");
    bildir(t("urun.sebeteAtildi"), "basari");
    $("#sebete-kec").hidden = false;
  });
}

function ciz(fotolar) {
  const ad = yerel(urun.ad);
  document.title = `${ad} — AvenueBaku`;
  const ilk = fotolar[0] || urun.kapak || "";
  kok.innerHTML = `
    <p style="margin:16px 0 0"><a href="./" class="soluk">← ${kacis(t("genel.vitrineDon"))}</a></p>
    <div class="urun-sayfa">
      <div>
        <div class="galeri-ana">${ilk ? `<img id="ana-foto" src="${kacis(ilk)}" alt="${kacis(ad)}">` : ""}</div>
        ${fotolar.length > 1 ? `<div class="galeri-kucuk">${fotolar.map((f, i) =>
          `<img src="${kacis(f)}" data-i="${i}" class="${i === 0 ? "secili" : ""}" alt="">`).join("")}</div>` : ""}
      </div>
      <div>
        <div class="marka soluk" style="letter-spacing:.12em;text-transform:uppercase;font-size:.78rem">${kacis(urun.marka || "")}</div>
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
          <h1>${kacis(ad)}</h1>
          <button type="button" class="btn btn-ince btn-kucuk" id="paylas" aria-label="${kacis(t("urun.paylas"))}">${IKON.paylas}</button>
        </div>
        <div id="fiyat" style="margin-bottom:20px"></div>
        ${secenekHtml("olcu", urun.olculer)}
        ${secenekHtml("renk", urun.renkler)}
        <div id="siparis-alani"></div>
        <a class="btn btn-ince btn-tam" id="sebete-kec" href="sebet.html" hidden style="margin-top:10px">${kacis(t("urun.sebeteKec"))} →</a>
        ${yerel(urun.aciklama) ? `<div style="margin-top:24px;white-space:pre-line">${kacis(yerel(urun.aciklama))}</div>` : ""}
      </div>
    </div>`;

  $("#paylas").addEventListener("click", async () => {
    const url = `${MAGAZA_URL || location.origin}/urun.html?id=${encodeURIComponent(urun.id)}`;
    try {
      if (navigator.share) await navigator.share({ title: ad, text: `${ad} — AvenueBaku`, url });
      else { await navigator.clipboard.writeText(url); bildir(t("urun.linkKopyalandi"), "basari"); }
    } catch (e) { if (e?.name !== "AbortError") bildir(t("hata.genel"), "hata"); }
  });

  $$(".galeri-kucuk img").forEach((img) => img.addEventListener("click", () => {
    $("#ana-foto").src = img.src;
    $$(".galeri-kucuk img").forEach((x) => x.classList.toggle("secili", x === img));
  }));
  $$(".secenekler").forEach((grup) => grup.addEventListener("click", (e) => {
    const b = e.target.closest(".secenek");
    if (!b) return;
    secim[grup.dataset.grup] = b.dataset.deger;
    $$(".secenek", grup).forEach((x) => x.classList.toggle("secili", x === b));
  }));
  // Tek seçenek varsa otomatik seç
  for (const ad of ["olcu", "renk"]) {
    const liste = ad === "olcu" ? urun.olculer : urun.renkler;
    if (liste?.length === 1) $(`.secenekler[data-grup=${ad}] .secenek`)?.click();
  }
}

function fiyatVeSiparis() {
  if (!urun) return;
  $("#fiyat").innerHTML = fiyatHtml(urun, durum.uye, true);
  siparisBolumu();
}

if (!id) bulunamadi();
else {
  try {
    const s = await getDoc(doc(db, "urunler", id));
    if (!s.exists()) { bulunamadi(); }
    else {
      urun = { id: s.id, ...s.data() };
      const fs = await getDocs(query(collection(db, "urunFoto"), where("urunId", "==", id)));
      const fotolar = fs.docs.map((d) => d.data()).sort((a, b) => a.sira - b.sira).map((f) => f.veri);
      ciz(fotolar);
      durum = await girisHazir;
      girisDinle((d) => { durum = d; fiyatVeSiparis(); });
    }
  } catch (e) {
    if (e?.code === "permission-denied") bulunamadi();
    else { console.error(e); kok.innerHTML = `<p class="bos">${kacis(t("hata.yukleme"))}</p>`; }
  }
}
