// Giriş, kayıt ve şifre sıfırlama sayfaları
import {
  auth, db, doc, setDoc, serverTimestamp, reload,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail, updateProfile,
} from "../ortak/firebase.js";
import { MAGAZA_URL } from "../ortak/ayarlar.js";
import { t, dil } from "../ortak/i18n.js";
import { $, kacis, hataMesaji, sifreKontrol } from "../ortak/yardim.js";
import "./ust.js";
import { HUQUQ_VERSIYA, huquqPencereBagla } from "./huquq.js";

// Firebase-in mail dili burada təyin edilmir: Console-dakı öz şablonumuz (AZ + RU) göndərilir.
// Müştərinin dili keçiddəki "dil" parametri ilə eylem.html-ə çatır.
const tabanUrl = MAGAZA_URL || location.origin;
const geri = new URLSearchParams(location.search).get("geri");
const guvenliGeri = geri && geri.startsWith("/") && !geri.startsWith("//") ? geri : "./";

function mesaj(metin, tur = "bilgi", html = "") {
  $("#mesaj").innerHTML = `<div class="kutu-mesaj kutu-${tur}">${kacis(metin)}${html}</div>`;
}

function bekle(buton, aktif) {
  buton.disabled = aktif;
  buton.dataset.metin ??= buton.textContent;
  buton.textContent = aktif ? t("genel.bekleyin") : buton.dataset.metin;
}

const dogrulamaAyari = () => ({ url: `${tabanUrl}/giris.html?dil=${dil()}` });

function dogrulamaTekrarButonu() {
  return ` <button type="button" class="btn btn-ince btn-kucuk" id="tekrar" style="margin-top:8px">${kacis(t("dogrula.tekrarGonder"))}</button>`;
}
function tekrarBagla() {
  $("#tekrar")?.addEventListener("click", async (e) => {
    try {
      await sendEmailVerification(auth.currentUser, dogrulamaAyari());
      e.target.replaceWith(Object.assign(document.createElement("div"), { textContent: t("dogrula.gonderildi") }));
    } catch (err) { mesaj(hataMesaji(err), "hata"); }
  });
}

const form = $("#form");
const buton = form.querySelector("button[type=submit]");

// ---------- KAYIT ----------
if ($("#sifre2")) {
  huquqPencereBagla(document);
  $("#razilasma").addEventListener("change", () => $("#razilasma-alan").classList.remove("alan-xeta"));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const ad = $("#ad").value.trim();
    const soyad = $("#soyad").value.trim();
    const email = $("#email").value.trim().toLowerCase();
    const sifre = $("#sifre").value;
    if (!ad || !soyad || !email) return mesaj(t("hata.bosAlan"), "hata");
    const eksik = sifreKontrol(sifre);
    if (eksik.length) return mesaj(`${t("sifre.eksik")} ${eksik.join(", ")}`, "hata");
    if (sifre !== $("#sifre2").value) return mesaj(t("hata.sifreUyusmuyor"), "hata");
    if (!$("#razilasma").checked) {
      $("#razilasma-alan").classList.add("alan-xeta");
      return mesaj(t("huquq.qebulLazim"), "hata");
    }

    bekle(buton, true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, sifre);
      await setDoc(doc(db, "kullanicilar", user.uid), {
        ad, soyad, email: user.email, rol: "musteri", dil: dil(), olusturma: serverTimestamp(),
        razilasmaTarix: serverTimestamp(), razilasmaVersiya: HUQUQ_VERSIYA,
      });
      await updateProfile(user, { displayName: `${ad} ${soyad}` });
      await sendEmailVerification(user, dogrulamaAyari());
      form.hidden = true;
      mesaj(t("kayit.basarili", { email }), "basari",
        `<div style="margin-top:10px"><a class="btn btn-kucuk" href="./">${kacis(t("genel.vitrineDon"))}</a></div>`);
    } catch (err) {
      mesaj(hataMesaji(err), "hata");
    } finally {
      bekle(buton, false);
    }
  });
}

// ---------- GİRİŞ ----------
else if ($("#sifre")) {
  const sebep = new URLSearchParams(location.search).get("sebep");
  if (sebep === "siparis") mesaj(t("giris.siparisIcin"));
  if (sebep === "tesdiq") mesaj(t("eylem.girisMesaj"), "basari");
  try {
    const hazirEmail = sessionStorage.getItem("girisEmail");
    if (hazirEmail && !$("#email").value) { $("#email").value = hazirEmail; $("#sifre").focus(); }
    sessionStorage.removeItem("girisEmail");
  } catch {}

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    bekle(buton, true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, $("#email").value.trim(), $("#sifre").value);
      await reload(user);
      if (!user.emailVerified) {
        mesaj(t("dogrula.gerekli"), "bilgi",
          dogrulamaTekrarButonu() + ` <a class="btn btn-kucuk" href="./" style="margin-top:8px">${kacis(t("genel.vitrineDon"))}</a>`);
        tekrarBagla();
        return;
      }
      await user.getIdToken(true);
      location.href = guvenliGeri;
    } catch (err) {
      mesaj(hataMesaji(err), "hata");
    } finally {
      bekle(buton, false);
    }
  });
}

// ---------- ŞİFRE SIFIRLAMA ----------
else {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#email").value.trim();
    if (!email) return mesaj(t("hata.bosAlan"), "hata");
    bekle(buton, true);
    try {
      await sendPasswordResetEmail(auth, email, { url: `${tabanUrl}/giris.html?dil=${dil()}` });
    } catch (err) {
      // Güvenlik için "böyle bir hesap yok" demiyoruz
      if (err?.code !== "auth/user-not-found") { mesaj(hataMesaji(err), "hata"); bekle(buton, false); return; }
    }
    form.hidden = true;
    mesaj(t("sifirla.gonderildi", { email }), "basari");
    bekle(buton, false);
  });
}
