// Admin paneli: giriş yoxlaması + menyu (masaüstündə yuxarıda, telefonda aşağıda)
import { auth, onAuthStateChanged, signOut, profilGetir } from "../../ortak/firebase.js";
import { t, sayfayiCevir } from "../../ortak/i18n.js";
import { $, $$, kacis } from "../../ortak/yardim.js";
import { temaUygula } from "../../ortak/tema.js";
import { IKON } from "../../ortak/ikon.js";
import { siparisleriBaslat, siparislerSekmesi } from "./siparisler.js";
import { urunlerSekmesi } from "./urunler.js";
import { kategorilerSekmesi } from "./kategoriler.js";
import { musterilerSekmesi } from "./musteriler.js";
import { ayarlarSekmesi } from "./ayarlar.js";

temaUygula();
sayfayiCevir();

const SEKMELER = [
  { id: "siparisler", ikon: IKON.siparis, fn: siparislerSekmesi },
  { id: "urunler", ikon: IKON.urun, fn: urunlerSekmesi },
  { id: "kategoriler", ikon: IKON.kategori, fn: kategorilerSekmesi },
  { id: "musteriler", ikon: IKON.musteri, fn: musterilerSekmesi },
  { id: "ayarlar", ikon: IKON.ayar, fn: ayarlarSekmesi },
];
const ESKI = { yedek: "ayarlar" }; // köhnə linklər

function menyuCiz() {
  $("#sekmeler").innerHTML = SEKMELER.map((s) => `
    <a href="#${s.id}" data-sekme="${s.id}">${s.ikon}<span>${kacis(t("admin.sekme." + s.id))}</span>
      ${s.id === "siparisler" ? `<b class="sayac" id="yeni-sayac" hidden></b>` : ""}</a>`).join("");
}

function sekmeAc() {
  const parcalar = location.hash.slice(1).split("/");
  let ad = ESKI[parcalar[0]] || parcalar[0] || "siparisler";
  const sekme = SEKMELER.find((s) => s.id === ad) || SEKMELER[0];
  $$("#sekmeler a").forEach((a) => a.classList.toggle("aktif", a.dataset.sekme === sekme.id));
  const kok = $("#icerik");
  kok.innerHTML = "";
  window.scrollTo(0, 0);
  sekme.fn(kok, parcalar.slice(1));
}

const kapat = onAuthStateChanged(auth, async (u) => {
  kapat();
  if (!u) return location.replace("./");
  const p = await profilGetir(u.uid).catch(() => null);
  if (p?.rol !== "admin") {
    await signOut(auth);
    return location.replace("./?yetki=yok");
  }
  menyuCiz();
  siparisleriBaslat(); // canlı dinləmə + bildirişlər (bütün tablarda işləyir)
  window.addEventListener("hashchange", sekmeAc);
  sekmeAc();
});

if ("serviceWorker" in navigator && !["localhost", "127.0.0.1"].includes(location.hostname)) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
