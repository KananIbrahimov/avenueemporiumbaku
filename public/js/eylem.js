// E-poçt keçidlərinin öz səhifəsi (Firebase-in standart ingiliscə səhifəsinin yerinə).
// Firebase Console → Authentication → Templates → "Customize action URL" = https://<sayt>/eylem.html
//   mode=verifyEmail   → e-poçt təsdiqlənir, müştəri avtomatik giriş səhifəsinə yönləndirilir
//   mode=resetPassword → burada yeni şifrə yazılır, sonra giriş səhifəsi
//   mode=recoverEmail  → e-poçt dəyişikliyi geri qaytarılır
import {
  auth, applyActionCode, checkActionCode, verifyPasswordResetCode, confirmPasswordReset,
} from "../ortak/firebase.js";
import { t } from "../ortak/i18n.js";
import { $, kacis, sifreKontrol } from "../ortak/yardim.js";
import "./ust.js";

const q = new URLSearchParams(location.search);
const mode = q.get("mode");
const kod = q.get("oobCode");
const kok = $("#eylem");
const GIRIS = "giris.html";
const YONLENDIRME_SANIYE = 4;

function kutu(baslik, metin, tur = "bilgi", altHtml = "") {
  kok.innerHTML = `<h1>${kacis(baslik)}</h1>
    <div class="kutu-mesaj kutu-${tur}">${kacis(metin)}</div>${altHtml}`;
}

const girisButonu = () =>
  `<a class="btn btn-tam" href="${GIRIS}?sebep=tesdiq">${kacis(t("giris.baslik"))}</a>`;

/** Giriş səhifəsində e-poçt hazır yazılsın (ünvan URL-ə qoyulmur) */
function emailYadda(email) {
  try { if (email) sessionStorage.setItem("girisEmail", email); } catch {}
}

function kodXetasi(err) {
  const kodlar = {
    "auth/expired-action-code": "eylem.xeta.vaxt",
    "auth/invalid-action-code": "eylem.xeta.etibarsiz",
    "auth/user-disabled": "eylem.xeta.bagli",
    "auth/user-not-found": "eylem.xeta.etibarsiz",
    "auth/network-request-failed": "hata.internet",
  };
  const acar = kodlar[err?.code];
  if (!acar) console.error(err);
  kutu(t("eylem.xeta.baslik"), t(acar || "hata.genel"), "hata",
    `<div style="display:grid;gap:10px">${girisButonu()}
      <a class="btn btn-ince btn-tam" href="./">${kacis(t("genel.vitrineDon"))}</a></div>`);
}

// ---------- E-poçt təsdiqi ----------
async function epoctTesdiq() {
  try {
    const info = await checkActionCode(auth, kod);
    await applyActionCode(auth, kod);
    emailYadda(info?.data?.email);
    // Eyni cihazda artıq daxil olubsa, təsdiq dərhal hesaba düşsün
    if (auth.currentUser) { try { await auth.currentUser.reload(); await auth.currentUser.getIdToken(true); } catch {} }
    kutu(t("eylem.tesdiq.baslik"), t("eylem.tesdiq.metin"), "basari",
      `<p class="soluk" id="geri-say">${kacis(t("eylem.yonlendirilir", { san: YONLENDIRME_SANIYE }))}</p>${girisButonu()}`);
    let qalan = YONLENDIRME_SANIYE;
    const say = setInterval(() => {
      qalan -= 1;
      const el = $("#geri-say");
      if (el) el.textContent = t("eylem.yonlendirilir", { san: qalan });
      if (qalan <= 0) { clearInterval(say); location.href = `${GIRIS}?sebep=tesdiq`; }
    }, 1000);
  } catch (err) {
    kodXetasi(err);
  }
}

// ---------- Şifrənin yenilənməsi ----------
async function sifreYenile() {
  let email;
  try {
    email = await verifyPasswordResetCode(auth, kod);
  } catch (err) {
    return kodXetasi(err);
  }
  kok.innerHTML = `
    <h1>${kacis(t("eylem.sifre.baslik"))}</h1>
    <p class="soluk">${kacis(t("eylem.sifre.alt", { email }))}</p>
    <div id="mesaj"></div>
    <form id="form" novalidate>
      <div class="alan"><label for="sifre">${kacis(t("alan.sifre"))}</label>
        <input id="sifre" type="password" autocomplete="new-password" required>
        <div class="ipucu">${kacis(t("sifre.kurallar"))}</div></div>
      <div class="alan"><label for="sifre2">${kacis(t("alan.sifreTekrar"))}</label>
        <input id="sifre2" type="password" autocomplete="new-password" required></div>
      <button class="btn btn-tam" type="submit">${kacis(t("eylem.sifre.buton"))}</button>
    </form>`;
  const mesaj = (m, tur = "hata") => ($("#mesaj").innerHTML = `<div class="kutu-mesaj kutu-${tur}">${kacis(m)}</div>`);
  const form = $("#form");
  const buton = form.querySelector("button");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const sifre = $("#sifre").value;
    const eksik = sifreKontrol(sifre);
    if (eksik.length) return mesaj(`${t("sifre.eksik")} ${eksik.join(", ")}`);
    if (sifre !== $("#sifre2").value) return mesaj(t("hata.sifreUyusmuyor"));
    buton.disabled = true;
    buton.textContent = t("genel.bekleyin");
    try {
      await confirmPasswordReset(auth, kod, sifre);
      emailYadda(email);
      kutu(t("eylem.sifre.hazirBaslik"), t("eylem.sifre.hazir"), "basari",
        `<a class="btn btn-tam" href="${GIRIS}">${kacis(t("giris.baslik"))}</a>`);
    } catch (err) {
      buton.disabled = false;
      buton.textContent = t("eylem.sifre.buton");
      if (err?.code === "auth/weak-password") return mesaj(t("hata.zayifSifre"));
      kodXetasi(err);
    }
  });
}

// ---------- E-poçt dəyişikliyinin geri qaytarılması ----------
async function epoctBerpa() {
  try {
    const info = await checkActionCode(auth, kod);
    await applyActionCode(auth, kod);
    emailYadda(info?.data?.email);
    kutu(t("eylem.berpa.baslik"), t("eylem.berpa.metin", { email: info?.data?.email || "" }), "basari",
      `<div style="display:grid;gap:10px">${girisButonu()}
        <a class="btn btn-ince btn-tam" href="sifre.html">${kacis(t("giris.unuttum"))}</a></div>`);
  } catch (err) {
    kodXetasi(err);
  }
}

if (!kod) kodXetasi({ code: "auth/invalid-action-code" });
else if (mode === "verifyEmail") epoctTesdiq();
else if (mode === "resetPassword") sifreYenile();
else if (mode === "recoverEmail") epoctBerpa();
else kodXetasi({ code: "auth/invalid-action-code" });
