// Ürün sayfası + sipariş (istek) gönderme
import {
  auth, db, doc, getDoc, getDocs, collection, query, where, addDoc, serverTimestamp,
  reload, sendEmailVerification,
} from "../ortak/firebase.js";
import { MAGAZA_URL } from "../ortak/ayarlar.js";
import { t, yerel } from "../ortak/i18n.js";
import { para } from "../ortak/fiyat.js";
import { $, $$, kacis, bildir, hataMesaji } from "../ortak/yardim.js";
import { girisDinle, girisHazir } from "./ust.js";
import { fiyatHtml } from "./fiyat-goster.js";
import { IKON } from "../ortak/ikon.js";

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
      `<button type="button" class="secenek" data-deger="${kacis(d)}">${kacis(d)}</button>`).join("")}</div></div>`;
}

function siparisBolumu() {
  const alan = $("#siparis-alani");
  if (!alan) return;
  if (!durum.kullanici) {
    const geri = encodeURIComponent(location.pathname + location.search);
    alan.innerHTML = `<div class="kutu-mesaj kutu-bilgi">${kacis(t("urun.girisGerekli"))}</div>
      <a class="btn btn-tam" href="giris.html?sebep=siparis&geri=${geri}">${kacis(t("nav.giris"))}</a>
      <p class="soluk" style="text-align:center">${kacis(t("giris.hesapYok"))} <a href="kayit.html">${kacis(t("nav.kayit"))}</a></p>`;
    return;
  }
  if (!durum.uye) {
    alan.innerHTML = `<div class="kutu-mesaj kutu-bilgi">${kacis(t("dogrula.gerekli"))}
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-ince btn-kucuk" id="tekrar">${kacis(t("dogrula.tekrarGonder"))}</button>
        <button class="btn btn-kucuk" id="yenile">${kacis(t("dogrula.yaptim"))}</button></div></div>`;
    $("#tekrar").onclick = async () => {
      try {
        await sendEmailVerification(auth.currentUser, { url: `${MAGAZA_URL || location.origin}/giris.html` });
        bildir(t("dogrula.gonderildi"), "basari");
      } catch (e) { bildir(hataMesaji(e), "hata"); }
    };
    $("#yenile").onclick = async () => {
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) { await auth.currentUser.getIdToken(true); location.reload(); }
      else bildir(t("dogrula.henuzDegil"), "hata");
    };
    return;
  }
  let tel = "";
  try { tel = localStorage.getItem("telefon") || ""; } catch {}
  alan.innerHTML = `
    <form id="siparis-form" novalidate>
      <div class="satir">
        <div class="alan"><label for="adet">${kacis(t("urun.adet"))}</label>
          <input id="adet" type="number" min="1" max="20" value="1" inputmode="numeric"></div>
        <div class="alan"><label for="telefon">${kacis(t("urun.telefon"))}</label>
          <input id="telefon" type="tel" autocomplete="tel" placeholder="+994 50 000 00 00" value="${kacis(tel)}"></div>
      </div>
      <div class="alan"><label for="not">${kacis(t("urun.not"))}</label>
        <textarea id="not" maxlength="500" style="min-height:60px"></textarea></div>
      <div id="toplam" class="soluk" style="margin-bottom:10px"></div>
      <button class="btn btn-tam" type="submit">${kacis(t("urun.siparisVer"))}</button>
      <p class="ipucu" style="text-align:center">${kacis(t("urun.siparisAciklama"))}</p>
    </form>`;
  const toplamGoster = () => {
    const adet = Math.max(1, Math.min(20, parseInt($("#adet").value, 10) || 1));
    $("#toplam").textContent = `${t("urun.toplam")}: ${para(urun.uyeFiyati * adet)}`;
  };
  $("#adet").addEventListener("input", toplamGoster);
  toplamGoster();
  $("#siparis-form").addEventListener("submit", siparisGonder);
}

async function siparisGonder(e) {
  e.preventDefault();
  const buton = e.target.querySelector("button[type=submit]");
  if (urun.olculer?.length && !secim.olcu) return bildir(t("urun.olcuSec"), "hata");
  if (urun.renkler?.length && !secim.renk) return bildir(t("urun.renkSec"), "hata");
  const adet = parseInt($("#adet").value, 10);
  if (!(adet >= 1 && adet <= 20)) return bildir(t("urun.adetHata"), "hata");
  const telefon = $("#telefon").value.trim();
  if (telefon.replace(/\D/g, "").length < 7) return bildir(t("urun.telefonHata"), "hata");

  buton.disabled = true;
  try {
    // E-posta doğrulaması token'a yansısın
    await auth.currentUser.getIdToken(true);
    const p = durum.profil;
    await addDoc(collection(db, "siparisler"), {
      kullaniciId: auth.currentUser.uid,
      musteriAd: p ? `${p.ad} ${p.soyad}` : (auth.currentUser.displayName || auth.currentUser.email),
      musteriEmail: auth.currentUser.email,
      telefon,
      musteriNotu: $("#not").value.trim().slice(0, 500),
      urunId: urun.id,
      urunAd: yerel(urun.ad).slice(0, 200),
      marka: urun.marka || "",
      olcu: secim.olcu,
      renk: secim.renk,
      adet,
      birimFiyat: urun.uyeFiyati,
      durum: "yeni",
      olusturma: serverTimestamp(),
    });
    try { localStorage.setItem("telefon", telefon); } catch {}
    $("#siparis-alani").innerHTML = `<div class="kutu-mesaj kutu-basari">${kacis(t("urun.siparisAlindi"))}</div>
      <a class="btn btn-ince btn-tam" href="siparislerim.html">${kacis(t("nav.siparislerim"))}</a>`;
  } catch (err) {
    // Fiyat bu arada değiştiyse kural reddeder → sayfayı yenile
    bildir(err?.code === "permission-denied" ? t("urun.fiyatDegisti") : hataMesaji(err), "hata");
    buton.disabled = false;
  }
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
