// Səbətim: məhsullar, say, cəmi, sifariş vermə
// Sifariş veriləndə hər məhsul ayrıca sifariş kimi yazılır (eyni "sebetId" ilə), admin onları birlikdə görür.
import {
  auth, db, doc, getDoc, collection, writeBatch, serverTimestamp, reload, sendEmailVerification,
} from "../ortak/firebase.js";
import { MAGAZA_URL } from "../ortak/ayarlar.js";
import { t, yerel } from "../ortak/i18n.js";
import { para, yuvarla } from "../ortak/fiyat.js";
import { $, $$, kacis, bildir, hataMesaji } from "../ortak/yardim.js";
import { girisDinle } from "./ust.js";
import { sebetOxu, sebetAdet, sebettenSil, sebetiBosalt, depoDinle } from "./depo.js";

const kok = $("#sebet");
const urunOnbellek = new Map();
let durum = { kullanici: null, profil: null, uye: false };
let gonderilir = false;

async function urunAl(id) {
  if (!urunOnbellek.has(id)) {
    try {
      const s = await getDoc(doc(db, "urunler", id));
      urunOnbellek.set(id, s.exists() && s.data().aktif ? { id, ...s.data() } : null);
    } catch { urunOnbellek.set(id, null); }
  }
  return urunOnbellek.get(id);
}

async function ciz() {
  if (gonderilir) return;
  const sebet = sebetOxu();
  if (!sebet.length) {
    kok.innerHTML = `<div class="bos"><p style="font-size:2rem;margin:0">🛍️</p><p>${kacis(t("sebet.bos"))}</p>
      <a class="btn" href="./">${kacis(t("genel.vitrineDon"))}</a></div>`;
    return;
  }
  const urunler = await Promise.all(sebet.map((x) => urunAl(x.urunId)));
  const uye = durum.uye;
  let cem = 0, cemNormal = 0;
  const satirlar = sebet.map((x, i) => {
    const u = urunler[i];
    if (!u) {
      return `<div class="kart sebet-satir pasif"><div class="yer"></div><div class="bilgi">
        <b>${kacis(t("sebet.satisdaDeyil"))}</b>
        <button class="btn btn-ince btn-kucuk" data-sil="${i}" style="justify-self:start">${kacis(t("admin.sil"))}</button></div></div>`;
    }
    const fiyat = uye ? u.uyeFiyati : u.satisFiyati;
    cem += fiyat * x.adet;
    cemNormal += u.satisFiyati * x.adet;
    return `<div class="kart sebet-satir">
      <a href="urun.html?id=${encodeURIComponent(u.id)}">${u.kapak ? `<img src="${kacis(u.kapak)}" alt="">` : `<div class="yer"></div>`}</a>
      <div class="bilgi">
        <div class="soluk" style="font-size:.72rem;letter-spacing:.1em;text-transform:uppercase">${kacis(u.marka || "")}</div>
        <a href="urun.html?id=${encodeURIComponent(u.id)}" style="font-weight:600;text-decoration:none">${kacis(yerel(u.ad))}</a>
        <div class="soluk">${kacis([x.olcu && `${t("urun.olcu")}: ${x.olcu}`, x.renk && `${t("urun.renk")}: ${x.renk}`].filter(Boolean).join(" · "))}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:4px">
          <div class="adet-sec">
            <button type="button" data-azalt="${i}" aria-label="−">−</button><span>${x.adet}</span><button type="button" data-artir="${i}" aria-label="+">+</button>
          </div>
          <b>${para(fiyat * x.adet)}</b>
        </div>
        <button class="btn btn-link btn-kucuk" data-sil="${i}" style="justify-self:start;padding-left:0">${kacis(t("sebet.cixar"))}</button>
      </div>
    </div>`;
  });
  cem = yuvarla(cem); cemNormal = yuvarla(cemNormal);
  const qenaet = yuvarla(cemNormal - cem);
  const hazirSay = urunler.filter(Boolean).length;

  kok.innerHTML = `
    <div class="liste">${satirlar.join("")}</div>
    <div class="kart toplam-kutu" style="margin-top:14px">
      ${uye && qenaet > 0 ? `<div class="satir-h soluk"><span>${kacis(t("sebet.normalQiymet"))}</span><span style="text-decoration:line-through">${para(cemNormal)}</span></div>
        <div class="satir-h" style="color:var(--basari)"><span>${kacis(t("sebet.uzvEndirimi"))}</span><span>−${para(qenaet)}</span></div>` : ""}
      <div class="satir-h buyuk"><span>${kacis(t("urun.toplam"))}</span><span>${para(cem)}</span></div>
      ${!uye && urunler.some((u) => u && Number(u.indirimYuzde) > 0)
        ? `<div class="fiyat-uye">${kacis(t("sebet.uzvOl"))}</div>` : ""}
    </div>
    <div id="sifaris-alani" style="margin-top:14px"></div>`;

  $$("[data-artir]", kok).forEach((b) => b.addEventListener("click", () => sebetAdet(+b.dataset.artir, sebet[+b.dataset.artir].adet + 1)));
  $$("[data-azalt]", kok).forEach((b) => b.addEventListener("click", () => sebetAdet(+b.dataset.azalt, sebet[+b.dataset.azalt].adet - 1)));
  $$("[data-sil]", kok).forEach((b) => b.addEventListener("click", () => sebettenSil(+b.dataset.sil)));

  sifarisBolumu(hazirSay > 0);
}

function sifarisBolumu(varMi) {
  const alan = $("#sifaris-alani");
  if (!varMi) return;
  if (!durum.kullanici) {
    alan.innerHTML = `<div class="kutu-mesaj kutu-bilgi">${kacis(t("urun.girisGerekli"))}</div>
      <a class="btn btn-tam" href="giris.html?sebep=siparis&geri=${encodeURIComponent("/sebet.html")}">${kacis(t("nav.giris"))}</a>
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
  let tel = durum.profil?.telefon || "";
  try { tel ||= localStorage.getItem("telefon") || ""; } catch {}
  alan.innerHTML = `
    <form id="sifaris-form" class="kart" novalidate>
      <div class="alan"><label for="telefon">${kacis(t("urun.telefon"))}</label>
        <input id="telefon" type="tel" autocomplete="tel" placeholder="+994 50 000 00 00" value="${kacis(tel)}"></div>
      <div class="alan"><label for="not">${kacis(t("urun.not"))}</label>
        <textarea id="not" maxlength="500" style="min-height:60px"></textarea></div>
      <button class="btn btn-tam" type="submit">${kacis(t("sebet.sifarisVer"))}</button>
      <p class="ipucu" style="text-align:center;margin-bottom:0">${kacis(t("urun.siparisAciklama"))}</p>
    </form>`;
  $("#sifaris-form").addEventListener("submit", sifarisGonder);
}

async function sifarisGonder(e) {
  e.preventDefault();
  const telefon = $("#telefon").value.trim();
  if (telefon.replace(/\D/g, "").length < 7) return bildir(t("urun.telefonHata"), "hata");
  const buton = e.target.querySelector("button[type=submit]");
  buton.disabled = true;
  buton.textContent = t("genel.bekleyin");
  gonderilir = true;
  try {
    await auth.currentUser.getIdToken(true); // e-poçt təsdiqi tokenə düşsün
    // Qiymətləri təzədən oxu (admin bu arada dəyişibsə köhnə qiymətlə göndərilməsin)
    urunOnbellek.clear();
    const sebet = sebetOxu();
    const urunler = await Promise.all(sebet.map((x) => urunAl(x.urunId)));
    const p = durum.profil;
    const sebetId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
    const toplu = writeBatch(db);
    let say = 0;
    sebet.forEach((x, i) => {
      const u = urunler[i];
      if (!u) return;
      toplu.set(doc(collection(db, "siparisler")), {
        kullaniciId: auth.currentUser.uid,
        musteriAd: p ? `${p.ad} ${p.soyad}` : (auth.currentUser.displayName || auth.currentUser.email),
        musteriEmail: auth.currentUser.email,
        telefon,
        musteriNotu: $("#not").value.trim().slice(0, 500),
        urunId: u.id,
        urunAd: yerel(u.ad).slice(0, 200),
        marka: u.marka || "",
        olcu: x.olcu || "",
        renk: x.renk || "",
        adet: x.adet,
        birimFiyat: u.uyeFiyati,
        durum: "yeni",
        olusturma: serverTimestamp(),
        sebetId,
      });
      say++;
    });
    if (!say) throw new Error("bos");
    await toplu.commit();
    try { localStorage.setItem("telefon", telefon); } catch {}
    sebetiBosalt();
    kok.innerHTML = `<div class="kart" style="text-align:center;padding:28px 18px">
      <p style="font-size:2.4rem;margin:0">✓</p>
      <h2>${kacis(t("sebet.qebulOldu"))}</h2>
      <p class="soluk">${kacis(t("urun.siparisAlindi"))}</p>
      <p class="soluk">${kacis(t("sebet.nomre"))}: <b class="kod">${kacis(sebetId)}</b></p>
      <div style="display:grid;gap:8px;margin-top:14px">
        <a class="btn btn-tam" href="siparislerim.html">${kacis(t("nav.siparislerim"))}</a>
        <a class="btn btn-ince btn-tam" href="./">${kacis(t("genel.vitrineDon"))}</a>
      </div></div>`;
  } catch (err) {
    gonderilir = false;
    bildir(err?.code === "permission-denied" ? t("urun.fiyatDegisti") : hataMesaji(err), "hata");
    ciz();
  }
}

depoDinle(ciz);
girisDinle((d) => { durum = d; ciz(); });
