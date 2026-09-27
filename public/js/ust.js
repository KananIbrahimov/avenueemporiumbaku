// Mağaza səhifələrinin ortaq üst menyusu, telefonda aşağı menyu, giriş vəziyyəti və PWA
import { auth, onAuthStateChanged, profilGetir } from "../ortak/firebase.js";
import { t, sayfayiCevir } from "../ortak/i18n.js";
import { kacis } from "../ortak/yardim.js";
import { temaUygula } from "../ortak/tema.js";
import { IKON } from "../ortak/ikon.js";

temaUygula();

let durum = { kullanici: null, profil: null, uye: false };
let hazir = false;
const dinleyiciler = [];
let hazirCoz;
export const girisHazir = new Promise((r) => (hazirCoz = r));

/** Giriş vəziyyəti dəyişəndə çağırılır: fn({ kullanici, profil, uye }) — uye = e-poçtu təsdiqlənib */
export function girisDinle(fn) {
  dinleyiciler.push(fn);
  if (hazir) fn(durum);
}

// Hansı səhifədəyik? (cleanUrls: /urun, /siparislerim ...)
const yol = location.pathname.replace(/\.html$/, "").replace(/\/$/, "") || "/";
const aktifSehife = yol === "" || yol === "/" || yol.endsWith("/index") ? "magaza"
  : yol.endsWith("/urun") ? "magaza"
  : yol.endsWith("/siparislerim") ? "siparis"
  : ["/ayarlar", "/giris", "/kayit", "/sifre"].some((s) => yol.endsWith(s)) ? "ayar" : "";

const MENYU = [
  { id: "magaza", href: "./", ikon: IKON.magaza, metin: "nav.magaza" },
  { id: "siparis", href: "siparislerim.html", ikon: IKON.siparis, metin: "nav.siparislerim" },
  { id: "ayar", href: "ayarlar.html", ikon: IKON.ayar, metin: "nav.ayarlar" },
];

function ustCiz() {
  const nav = document.getElementById("ust-nav");
  if (!nav) return;
  const { kullanici } = durum;
  nav.innerHTML =
    MENYU.map((m) => `<a class="ust-link masaustu ${m.id === aktifSehife ? "aktif" : ""}" href="${m.href}">${m.ikon}<span>${kacis(t(m.metin))}</span></a>`).join("") +
    (kullanici ? "" : `<a class="btn btn-kucuk" href="giris.html" style="margin-left:6px">${kacis(t("nav.giris"))}</a>`);
}

function altMenyuCiz() {
  if (document.querySelector(".alt-menyu")) return;
  const el = document.createElement("nav");
  el.className = "alt-menyu";
  el.innerHTML = MENYU.map((m) =>
    `<a href="${m.href}" class="${m.id === aktifSehife ? "aktif" : ""}">${m.ikon}<span>${kacis(t(m.metin))}</span></a>`).join("");
  document.body.appendChild(el);
  document.body.classList.add("menyulu");
}

sayfayiCevir();
altMenyuCiz();
ustCiz();

onAuthStateChanged(auth, async (kullanici) => {
  let profil = null;
  if (kullanici) {
    try { profil = await profilGetir(kullanici.uid); } catch (e) { console.warn(e); }
  }
  durum = { kullanici, profil, uye: !!(kullanici && kullanici.emailVerified) };
  hazir = true;
  ustCiz();
  dinleyiciler.forEach((fn) => fn(durum));
  hazirCoz(durum);
});

// "Ana ekrana əlavə et" (PWA)
if ("serviceWorker" in navigator && !["localhost", "127.0.0.1"].includes(location.hostname)) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
