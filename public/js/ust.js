// Mağaza səhifələrinin ortaq üst hissəsi, aşağı menyu (5 ikon), giriş vəziyyəti və PWA
// Aşağı menyu: Bəyəndiklərim · Kataloq · (ortada) Ana səhifə · Səbətim · Ayarlar
import { auth, onAuthStateChanged, profilGetir, signOut } from "../ortak/firebase.js";
import { kilitBaslat } from "../ortak/kilit.js";
import { t, sayfayiCevir, dilSeciciHtml, dilSeciciBagla } from "../ortak/i18n.js";
import { kacis } from "../ortak/yardim.js";
import { temaUygula } from "../ortak/tema.js";
import { IKON } from "../ortak/ikon.js";
import { versiyaYoxla } from "../ortak/versiya.js";
import { favorileriBagla, favoriListesi, sebetSayi, depoDinle } from "./depo.js";

temaUygula();
versiyaYoxla();

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

// Hansı səhifədəyik? (cleanUrls: /urun, /sebet ...)
const yol = location.pathname.replace(/\.html$/, "").replace(/\/$/, "");
const son = yol.split("/").pop() || "index";
const aktifSehife = {
  index: "ana", urun: "ana",
  katalog: "katalog",
  begendiklerim: "begen",
  sebet: "sebet",
  ayarlar: "ayar", siparislerim: "ayar", giris: "ayar", kayit: "ayar", sifre: "ayar", eylem: "ayar", huquq: "ayar",
}[son] || "ana";

const MENYU = [
  { id: "begen", href: "begendiklerim.html", ikon: IKON.urek, metin: "nav.begendiklerim", say: "fav" },
  { id: "katalog", href: "katalog.html", ikon: IKON.katalog, metin: "nav.katalog" },
  { id: "ana", href: "./", ikon: IKON.ev, metin: "nav.ana", orta: true },
  { id: "sebet", href: "sebet.html", ikon: IKON.sebet, metin: "nav.sebet", say: "sebet" },
  { id: "ayar", href: "ayarlar.html", ikon: IKON.ayar, metin: "nav.ayarlar" },
];

function ustCiz() {
  const nav = document.getElementById("ust-nav");
  if (!nav) return;
  // Kompüterdə yuxarıda qısa keçidlər; telefonda yalnız aşağı menyu
  nav.innerHTML =
    MENYU.filter((m) => !m.orta).map((m) => `<a class="ust-link masaustu ${m.id === aktifSehife ? "aktif" : ""}" href="${m.href}">
      ${m.ikon}<span>${kacis(t(m.metin))}</span>${m.say ? `<b class="sayac" data-say="${m.say}" hidden></b>` : ""}</a>`).join("") +
    dilSeciciHtml() +
    (durum.kullanici ? "" : `<a class="btn btn-kucuk" href="giris.html" style="margin-left:6px">${kacis(t("nav.giris"))}</a>`);
  dilSeciciBagla(nav);
  saylariYenile();
}

function altMenyuCiz() {
  if (document.querySelector(".alt-menyu")) return;
  const el = document.createElement("nav");
  el.className = "alt-menyu";
  el.innerHTML = MENYU.map((m) => `
    <a href="${m.href}" class="${m.id === aktifSehife ? "aktif" : ""} ${m.orta ? "orta" : ""}">
      <span class="ikon-kap">${m.ikon}</span><span>${kacis(t(m.metin))}</span>
      ${m.say ? `<b class="sayac" data-say="${m.say}" hidden></b>` : ""}
    </a>`).join("");
  document.body.appendChild(el);
  document.body.classList.add("menyulu");
}

function saylariYenile() {
  const say = { fav: favoriListesi().length, sebet: sebetSayi() };
  document.querySelectorAll("[data-say]").forEach((el) => {
    const n = say[el.dataset.say] || 0;
    el.hidden = n === 0;
    el.textContent = n > 99 ? "99+" : n;
  });
}

sayfayiCevir();
altMenyuCiz();
ustCiz();
depoDinle(saylariYenile);

onAuthStateChanged(auth, async (kullanici) => {
  let profil = null;
  if (kullanici) {
    try { profil = await profilGetir(kullanici.uid); } catch (e) { console.warn(e); }
  }
  durum = { kullanici, profil, uye: !!(kullanici && kullanici.emailVerified) };
  hazir = true;
  ustCiz();
  favorileriBagla(kullanici, profil);
  dinleyiciler.forEach((fn) => fn(durum));
  hazirCoz(durum);
});

// Face ID kilidi (aktivdirsə və istifadəçi daxil olubsa)
kilitBaslat({
  girisli: () => girisHazir.then((d) => !!d.kullanici),
  cixis: async () => { await signOut(auth); location.href = "giris.html"; },
});

// "Ana ekrana əlavə et" (PWA)
if ("serviceWorker" in navigator && !["localhost", "127.0.0.1"].includes(location.hostname)) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
