// Mağaza sayfalarının ortak üst barı + giriş durumu + PWA kaydı
import { auth, onAuthStateChanged, signOut, profilGetir } from "../ortak/firebase.js";
import { t, sayfayiCevir, DILLER, dil, dilDegistir } from "../ortak/i18n.js";
import { kacis } from "../ortak/yardim.js";

let durum = { kullanici: null, profil: null, uye: false };
const dinleyiciler = [];

/** Giriş durumu değişince çağrılır: fn({ kullanici, profil, uye }) — uye = e-postası doğrulanmış */
export function girisDinle(fn) {
  dinleyiciler.push(fn);
  if (hazir) fn(durum);
}
let hazir = false;
let hazirCoz;
export const girisHazir = new Promise((r) => (hazirCoz = r));

function ustCiz() {
  const nav = document.getElementById("ust-nav");
  if (!nav) return;
  const { kullanici, profil } = durum;
  const dilSecici = DILLER.length > 1
    ? `<select id="dil-sec" aria-label="Dil" style="width:auto;padding:6px 8px">${DILLER.map((d) =>
        `<option value="${d.kod}" ${d.kod === dil() ? "selected" : ""}>${d.kod.toUpperCase()}</option>`).join("")}</select>`
    : "";
  nav.innerHTML = kullanici
    ? `${dilSecici}
       <a class="btn-link" href="siparislerim.html">${kacis(t("nav.siparislerim"))}</a>
       <span class="soluk" style="padding:0 4px">${kacis(profil?.ad || kullanici.email)}</span>
       <button class="btn btn-ince btn-kucuk" id="cikis">${kacis(t("nav.cikis"))}</button>`
    : `${dilSecici}
       <a class="btn-link" href="giris.html">${kacis(t("nav.giris"))}</a>
       <a class="btn btn-kucuk" href="kayit.html">${kacis(t("nav.kayit"))}</a>`;
  nav.querySelector("#cikis")?.addEventListener("click", async () => {
    await signOut(auth);
    location.href = "./";
  });
  nav.querySelector("#dil-sec")?.addEventListener("change", (e) => dilDegistir(e.target.value));
}

sayfayiCevir();

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

// "Ana ekrana ekle" (PWA)
if ("serviceWorker" in navigator && !["localhost", "127.0.0.1"].includes(location.hostname)) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
