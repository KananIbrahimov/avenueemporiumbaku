// Admin girişi — kayıt yok, sadece rolü "admin" olan hesaplar girebilir
import { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, profilGetir } from "../../ortak/firebase.js";
import { t, sayfayiCevir } from "../../ortak/i18n.js";
import { temaUygula } from "../../ortak/tema.js";
import { versiyaYoxla } from "../../ortak/versiya.js";
import { $, kacis, hataMesaji } from "../../ortak/yardim.js";

temaUygula();
document.documentElement.classList.remove("kilitli"); // giriş səhifəsində kilid ekranı yoxdur
versiyaYoxla();
sayfayiCevir();
const mesaj = (m, tur = "hata") => ($("#mesaj").innerHTML = `<div class="kutu-mesaj kutu-${tur}">${kacis(m)}</div>`);
if (new URLSearchParams(location.search).get("yetki") === "yok") mesaj(t("admin.yetkiYok"));

async function adminMi(user) {
  const p = await profilGetir(user.uid).catch(() => null);
  return p?.rol === "admin";
}

// Zaten giriş yapmış admin ise doğrudan panele
const kapat = onAuthStateChanged(auth, async (u) => {
  kapat();
  if (u && (await adminMi(u))) location.replace("panel.html");
});

$("#form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const b = e.target.querySelector("button");
  b.disabled = true;
  try {
    const { user } = await signInWithEmailAndPassword(auth, $("#email").value.trim(), $("#sifre").value);
    if (await adminMi(user)) location.replace("panel.html");
    else { await signOut(auth); mesaj(t("admin.yetkiYok")); }
  } catch (err) {
    mesaj(hataMesaji(err));
  } finally {
    b.disabled = false;
  }
});

if ("serviceWorker" in navigator && !["localhost", "127.0.0.1"].includes(location.hostname)) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
