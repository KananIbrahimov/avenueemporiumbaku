// Vitrin: ürün listesi + filtreler
import { db, collection, getDocs, query, where } from "../ortak/firebase.js";
import { t, yerel, degerCevir, say } from "../ortak/i18n.js";
import { kartHtml, urekleriBagla } from "./kart.js";
import { $, kacis } from "../ortak/yardim.js";
import { girisDinle } from "./ust.js";
import { kategoriSirala, kategoriyeAit, ozelMi, ozelIkon } from "../ortak/kategori.js";

let urunler = [];
let kategoriler = [];
let uye = false;
const parametr = new URLSearchParams(location.search);
const secim = { kategori: parametr.get("k") || "", ara: parametr.get("q") || "", marka: parametr.get("m") || "", olcu: "", renk: "", sirala: "yeni" };

const benzersiz = (dizi) => [...new Set(dizi.filter(Boolean))].sort((a, b) => a.localeCompare(b, "az"));

function secimDoldur(el, bosMetin, degerler, secili) {
  el.innerHTML = `<option value="">${kacis(bosMetin)}</option>` +
    degerler.map((d) => `<option value="${kacis(d)}" ${d === secili ? "selected" : ""}>${kacis(degerCevir(d))}</option>`).join("");
}

function kategoriCiz() {
  // Sale və 24 saat həmişə solda; sonra "Hamısı"; sonra məhsulu olan kateqoriyalar əlifba sırası ilə
  const ozel = kategoriler.filter((k) => ozelMi(k.id));
  const diger = kategoriler.filter((k) => !ozelMi(k.id) && (k.id === secim.kategori || urunler.some((u) => kategoriyeAit(u, k.id))));
  const tumu = [...ozel, { id: "", ad: { az: t("filtre.tumu") }, hamisi: true }, ...diger];
  $("#kategoriler").innerHTML = tumu.map((k) => {
    const ikon = ozelIkon(k.id);
    const ad = k.hamisi ? t("filtre.tumu") : yerel(k.ad);
    return `<button class="cip ${ikon ? "cip-ozel" : ""} ${k.id === secim.kategori ? "secili" : ""}" data-id="${kacis(k.id)}">${ikon ? `${ikon} ` : ""}${kacis(ad)}</button>`;
  }).join("");
  $("#kategoriler .secili")?.scrollIntoView({ block: "nearest", inline: "nearest" });
}

function ciz() {
  // Filtre seçenekleri seçili kategoriye göre
  const kategoridekiler = urunler.filter((u) => !secim.kategori || kategoriyeAit(u, secim.kategori));
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
  $("#say").textContent = say(liste.length, "vitrin.mehsul");
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
  kategoriler = kategoriSirala(ks.docs.map((d) => ({ id: d.id, ...d.data() })));
  urunler = us.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (secim.kategori && !kategoriler.some((k) => k.id === secim.kategori)) secim.kategori = "";
  kategoriCiz();
  ciz();
} catch (e) {
  console.error(e);
  $("#urunler").innerHTML = `<p class="bos">${kacis(t("hata.yukleme"))}</p>`;
}
