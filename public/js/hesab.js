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

auth.languageCode = dil();
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

const dogrulamaAyari = () => ({ url: `${tabanUrl}/giris.html` });

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

    bekle(buton, true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, sifre);
      await setDoc(doc(db, "kullanicilar", user.uid), {
        ad, soyad, email: user.email, rol: "musteri", dil: dil(), olusturma: serverTimestamp(),
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
  if (new URLSearchParams(location.search).get("sebep") === "siparis") mesaj(t("giris.siparisIcin"));

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
      await sendPasswordResetEmail(auth, email, { url: `${tabanUrl}/giris.html` });
    } catch (err) {
      // Güvenlik için "böyle bir hesap yok" demiyoruz
      if (err?.code !== "auth/user-not-found") { mesaj(hataMesaji(err), "hata"); bekle(buton, false); return; }
    }
    form.hidden = true;
    mesaj(t("sifirla.gonderildi", { email }), "basari");
    bekle(buton, false);
  });
}
