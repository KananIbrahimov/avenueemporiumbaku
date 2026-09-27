// Vitrin: ürün listesi + filtreler
import { db, collection, getDocs, query, where } from "../ortak/firebase.js";
import { t, yerel } from "../ortak/i18n.js";
import { kartHtml, urekleriBagla } from "./kart.js";
import { $, kacis } from "../ortak/yardim.js";
import { girisDinle } from "./ust.js";

let urunler = [];
let kategoriler = [];
let uye = false;
const parametr = new URLSearchParams(location.search);
const secim = { kategori: parametr.get("k") || "", ara: parametr.get("q") || "", marka: parametr.get("m") || "", olcu: "", renk: "", sirala: "yeni" };

const benzersiz = (dizi) => [...new Set(dizi.filter(Boolean))].sort((a, b) => a.localeCompare(b, "az"));

function secimDoldur(el, bosMetin, degerler, secili) {
  el.innerHTML = `<option value="">${kacis(bosMetin)}</option>` +
    degerler.map((d) => `<option ${d === secili ? "selected" : ""}>${kacis(d)}</option>`).join("");
}

function kategoriCiz() {
  const tumu = [{ id: "", ad: t("filtre.tumu") }, ...kategoriler.map((k) => ({ id: k.id, ad: yerel(k.ad) }))];
  $("#kategoriler").innerHTML = tumu.map((k) =>
    `<button class="cip ${k.id === secim.kategori ? "secili" : ""}" data-id="${kacis(k.id)}">${kacis(k.ad)}</button>`).join("");
}

function ciz() {
  // Filtre seçenekleri seçili kategoriye göre
  const kategoridekiler = urunler.filter((u) => !secim.kategori || u.kategoriId === secim.kategori);
  secimDoldur($("#f-marka"), t("filtre.marka"), benzersiz(kategoridekiler.map((u) => u.marka)), secim.marka);
  secimDoldur($("#f-olcu"), t("filtre.olcu"), benzersiz(kategoridekiler.flatMap((u) => u.olculer || [])), secim.olcu);
  secimDoldur($("#f-renk"), t("filtre.renk"), benzersiz(kategoridekiler.flatMap((u) => u.renkler || [])), secim.renk);

  const ara = secim.ara.toLocaleLowerCase("az");
  let liste = kategoridekiler.filter((u) =>
    (!secim.marka || u.marka === secim.marka) &&
    (!secim.olcu || (u.olculer || []).includes(secim.olcu)) &&
    (!secim.renk || (u.renkler || []).includes(secim.renk)) &&
    (!ara || `${yerel(u.ad)} ${u.marka || ""}`.toLocaleLowerCase("az").includes(ara)));

  const fiyatOf = (u) => (uye ? u.uyeFiyati : u.satisFiyati);
  const zaman = (u) => u.olusturma?.toMillis?.() || 0;
  liste.sort({
    yeni: (a, b) => zaman(b) - zaman(a),
    ucuz: (a, b) => fiyatOf(a) - fiyatOf(b),
    baha: (a, b) => fiyatOf(b) - fiyatOf(a),
  }[secim.sirala]);

  $("#urunler").innerHTML = liste.length
    ? liste.map((u) => kartHtml(u, uye)).join("")
    : `<p class="bos">${kacis(t("vitrin.bos"))}</p>`;
  $("#say").textContent = `${liste.length} ${t("vitrin.mehsul")}`;
  const filtrli = secim.ara || secim.kategori || secim.marka || secim.olcu || secim.renk;
  $("#basliq").textContent = filtrli ? t("vitrin.netice") : t("vitrin.baslik");
}

function uyeKutusu(durum) {
  const kutu = $("#uye-kutusu");
  if (!durum.kullanici) {
    kutu.innerHTML = `<div class="kutu-mesaj kutu-bilgi">${kacis(t("vitrin.uyeOl"))} <a href="kayit.html">${kacis(t("nav.kayit"))}</a></div>`;
  } else if (!durum.uye) {
    kutu.innerHTML = `<div class="kutu-mesaj kutu-bilgi">${kacis(t("dogrula.gerekli"))}</div>`;
  } else kutu.innerHTML = "";
}

// Olaylar
$("#kategoriler").addEventListener("click", (e) => {
  const b = e.target.closest(".cip");
  if (!b) return;
  secim.kategori = b.dataset.id;
  secim.marka = secim.olcu = secim.renk = "";
  history.replaceState(null, "", secim.kategori ? `?k=${encodeURIComponent(secim.kategori)}` : location.pathname);
  kategoriCiz();
  ciz();
});
const araInput = $("#f-ara");
araInput.value = secim.ara;
$("#ara-temizle").hidden = !secim.ara;
araInput.addEventListener("input", (e) => {
  secim.ara = e.target.value;
  $("#ara-temizle").hidden = !secim.ara;
  ciz();
});
araInput.addEventListener("keydown", (e) => { if (e.key === "Enter") araInput.blur(); });
$("#ara-temizle").addEventListener("click", () => {
  araInput.value = secim.ara = "";
  $("#ara-temizle").hidden = true;
  ciz();
  araInput.focus();
});
urekleriBagla($("#urunler"));
for (const [id, alan] of [["#f-marka", "marka"], ["#f-olcu", "olcu"], ["#f-renk", "renk"], ["#f-sirala", "sirala"]]) {
  $(id).addEventListener("change", (e) => { secim[alan] = e.target.value; ciz(); });
}

girisDinle((d) => { uye = d.uye; uyeKutusu(d); if (urunler.length) ciz(); });

try {
  const [ks, us] = await Promise.all([
    getDocs(collection(db, "kategoriler")),
    getDocs(query(collection(db, "urunler"), where("aktif", "==", true))),
  ]);
  kategoriler = ks.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0));
  urunler = us.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (secim.kategori && !kategoriler.some((k) => k.id === secim.kategori)) secim.kategori = "";
  kategoriCiz();
  ciz();
} catch (e) {
  console.error(e);
  $("#urunler").innerHTML = `<p class="bos">${kacis(t("hata.yukleme"))}</p>`;
}
