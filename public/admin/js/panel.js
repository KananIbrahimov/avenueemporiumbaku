// Admin paneli: giriş yoxlaması + aşağı menyu
// Sıra: Sifarişlər · Müştərilər · (+) Məhsul · İzləmə · Ayarlar
import { auth, onAuthStateChanged, signOut, profilGetir } from "../../ortak/firebase.js";
import { t, sayfayiCevir } from "../../ortak/i18n.js";
import { $, $$, kacis } from "../../ortak/yardim.js";
import { temaUygula } from "../../ortak/tema.js";
import { IKON } from "../../ortak/ikon.js";
import { siparisleriBaslat, siparislerSekmesi } from "./siparisler.js";
import { urunlerSekmesi } from "./urunler.js";
import { kategorilerSekmesi } from "./kategoriler.js";
import { musterilerSekmesi } from "./musteriler.js";
import { izlemeSekmesi } from "./izleme.js";
import { ayarlarSekmesi } from "./ayarlar.js";

temaUygula();
sayfayiCevir();

// Aşağı menyu
const MENYU = [
  { id: "siparisler", ikon: IKON.siparis, metin: "admin.sekme.siparisler", href: "#siparisler" },
  { id: "musteriler", ikon: IKON.musteri, metin: "admin.sekme.musteriler", href: "#musteriler" },
  { id: "urunler", ikon: IKON.artir, metin: "admin.menyu.urunEkle", href: "#urunler/yeni", orta: true },
  { id: "izleme", ikon: IKON.izleme, metin: "admin.sekme.izleme", href: "#izleme" },
  { id: "ayarlar", ikon: IKON.ayar, metin: "admin.sekme.ayarlar", href: "#ayarlar" },
];

// Marşrutlar: hash → { çəkən funksiya, hansı menyu aktiv olsun }
const MARSRUT = {
  siparisler: { fn: siparislerSekmesi, menyu: "siparisler" },
  musteriler: { fn: musterilerSekmesi, menyu: "musteriler" },
  urunler: { fn: urunlerSekmesi, menyu: "urunler" },
  izleme: { fn: izlemeSekmesi, menyu: "izleme" },
  ayarlar: { fn: ayarlarSekmesi, menyu: "ayarlar" },
  kategoriler: { fn: kategorilerSekmesi, menyu: "ayarlar" },
  yedek: { fn: ayarlarSekmesi, menyu: "ayarlar" }, // köhnə link
};

function menyuCiz() {
  $("#sekmeler").innerHTML = MENYU.map((m) => `
    <a href="${m.href}" data-menyu="${m.id}" class="${m.orta ? "orta" : ""}">
      <span class="ikon-kap">${m.ikon}</span><span>${kacis(t(m.metin))}</span>
      ${m.id === "siparisler" ? `<b class="sayac" id="yeni-sayac" hidden></b>` : ""}
    </a>`).join("");
}

function sekmeAc() {
  const parcalar = location.hash.slice(1).split("/");
  const m = MARSRUT[parcalar[0]] || MARSRUT.siparisler;
  $$("#sekmeler a").forEach((a) => a.classList.toggle("aktif", a.dataset.menyu === m.menyu));
  const kok = $("#icerik");
  kok.innerHTML = "";
  window.scrollTo(0, 0);
  m.fn(kok, parcalar.slice(1));
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
  siparisleriBaslat(); // canlı dinləmə + bildirişlər (bütün bölmələrdə işləyir)
  window.addEventListener("hashchange", sekmeAc);
  sekmeAc();
});

if ("serviceWorker" in navigator && !["localhost", "127.0.0.1"].includes(location.hostname)) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
