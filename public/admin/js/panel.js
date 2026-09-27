// Admin paneli: giriş kontrolü + sekmeler
import { auth, onAuthStateChanged, signOut, profilGetir } from "../../ortak/firebase.js";
import { sayfayiCevir } from "../../ortak/i18n.js";
import { $, $$ } from "../../ortak/yardim.js";
import { siparisleriBaslat, siparislerSekmesi } from "./siparisler.js";
import { urunlerSekmesi } from "./urunler.js";
import { kategorilerSekmesi } from "./kategoriler.js";
import { musterilerSekmesi } from "./musteriler.js";
import { yedekSekmesi } from "./yedek.js";

sayfayiCevir();

const sekmeler = {
  siparisler: siparislerSekmesi,
  urunler: urunlerSekmesi,
  kategoriler: kategorilerSekmesi,
  musteriler: musterilerSekmesi,
  yedek: yedekSekmesi,
};

function sekmeAc() {
  const ad = location.hash.slice(1).split("/")[0] || "siparisler";
  const fn = sekmeler[ad] || sekmeler.siparisler;
  $$("#sekmeler a").forEach((a) => a.classList.toggle("aktif", a.dataset.sekme === ad));
  const kok = $("#icerik");
  kok.innerHTML = "";
  fn(kok, location.hash.slice(1).split("/").slice(1));
}

const kapat = onAuthStateChanged(auth, async (u) => {
  kapat();
  if (!u) return location.replace("./");
  const p = await profilGetir(u.uid).catch(() => null);
  if (p?.rol !== "admin") {
    await signOut(auth);
    return location.replace("./?yetki=yok");
  }
  $("#admin-ad").textContent = `${p.ad} ${p.soyad}`;
  siparisleriBaslat(); // canlı dinleme + bildirimler (tüm sekmelerde çalışır)
  window.addEventListener("hashchange", sekmeAc);
  sekmeAc();
});

$("#cikis").addEventListener("click", async () => {
  await signOut(auth);
  location.replace("./");
});

if ("serviceWorker" in navigator && !["localhost", "127.0.0.1"].includes(location.hostname)) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
