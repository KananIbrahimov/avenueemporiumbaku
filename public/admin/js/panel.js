// Admin paneli: giriş yoxlaması + aşağı menyu
// Sıra: Sifarişlər · Müştərilər · (+) Məhsul · İzləmə · Ayarlar
import { auth, onAuthStateChanged, signOut, profilGetir } from "../../ortak/firebase.js";
import { t, sayfayiCevir } from "../../ortak/i18n.js";
import { $, $$, kacis } from "../../ortak/yardim.js";
import { temaUygula } from "../../ortak/tema.js";
import { versiyaYoxla } from "../../ortak/versiya.js";
import { kilitBaslat } from "../../ortak/kilit.js";
import { IKON } from "../../ortak/ikon.js";
import { siparisleriBaslat, siparislerSekmesi } from "./siparisler.js";
import { urunlerSekmesi } from "./urunler.js";
import { musterilerSekmesi } from "./musteriler.js";
import { ayarlarSekmesi, kurslarSekmesi, instagramSablonSekmesi, yedekSekmesi, sifarisAyarSekmesi } from "./ayarlar.js";
import { finansSekmesi } from "./finans.js";
import { siyahiSekmesi } from "./siyahi-sehife.js";

temaUygula();
versiyaYoxla();
sayfayiCevir();

// Aşağı menyu: Məhsullar · Finans · (+) Məhsul · Sifarişlər (mərhələlər + kargo) · Ayarlar (Müştərilər Ayarlar-da)
const MENYU = [
  { id: "mehsullar", ikon: IKON.magaza, metin: "admin.sekme.urunler", href: "#urunler" },
  { id: "finans", ikon: IKON.finans, metin: "admin.sekme.finans", href: "#finans" },
  { id: "yeni", ikon: IKON.artir, metin: "admin.menyu.urunEkle", href: "#urunler/yeni", orta: true },
  { id: "siparisler", ikon: IKON.siparis, metin: "admin.sekme.siparisler", href: "#siparisler" },
  { id: "ayarlar", ikon: IKON.ayar, metin: "admin.sekme.ayarlar", href: "#ayarlar" },
];

// Marşrutlar: hash → { çəkən funksiya, hansı menyu aktiv olsun }
const MARSRUT = {
  magaza: { fn: urunlerSekmesi, menyu: "mehsullar" }, // köhnə link → Məhsullar
  finans: { fn: finansSekmesi, menyu: "finans" },
  musteriler: { fn: musterilerSekmesi, menyu: "ayarlar" },
  urunler: { fn: urunlerSekmesi, menyu: "mehsullar" },
  siparisler: { fn: siparislerSekmesi, menyu: "siparisler" },
  izleme: { fn: siparislerSekmesi, menyu: "siparisler" }, // köhnə link
  ayarlar: { fn: ayarlarSekmesi, menyu: "ayarlar" },
  kategoriler: { fn: siyahiSekmesi("kategoriler"), menyu: "ayarlar" },
  markalar: { fn: siyahiSekmesi("markalar"), menyu: "ayarlar" },
  olculer: { fn: siyahiSekmesi("olculer"), menyu: "ayarlar" },
  renkler: { fn: siyahiSekmesi("renkler"), menyu: "ayarlar" },
  kurslar: { fn: kurslarSekmesi, menyu: "ayarlar" },
  sifarisAyar: { fn: sifarisAyarSekmesi, menyu: "ayarlar" },
  instagram: { fn: instagramSablonSekmesi, menyu: "ayarlar" },
  yedek: { fn: yedekSekmesi, menyu: "ayarlar" },
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
  const m = MARSRUT[parcalar[0]] || MARSRUT.urunler;
  const aktivMenyu = parcalar[0] === "urunler" && parcalar[1] === "yeni" ? "yeni" : m.menyu;
  $$("#sekmeler a").forEach((a) => a.classList.toggle("aktif", a.dataset.menyu === aktivMenyu));
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
  kilitBaslat({ girisli: async () => true, cixis: async () => { await signOut(auth); location.replace("./"); } });
  menyuCiz();
  siparisleriBaslat(); // canlı dinləmə + bildirişlər (bütün bölmələrdə işləyir)
  window.addEventListener("hashchange", sekmeAc);
  sekmeAc();
});

if ("serviceWorker" in navigator && !["localhost", "127.0.0.1"].includes(location.hostname)) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
