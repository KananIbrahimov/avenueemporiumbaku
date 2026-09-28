// Kataloq: məhsul qrupları (kateqoriyalar) və brendlər
import { db, collection, getDocs, query, where } from "../ortak/firebase.js";
import { t, yerel } from "../ortak/i18n.js";
import { $, kacis } from "../ortak/yardim.js";
import "./ust.js";
import { kategoriSirala, kategoriyeAit, ozelMi, ozelIkon } from "../ortak/kategori.js";

try {
  const [ks, us] = await Promise.all([
    getDocs(collection(db, "kategoriler")),
    getDocs(query(collection(db, "urunler"), where("aktif", "==", true))),
  ]);
  const kategoriler = kategoriSirala(ks.docs.map((d) => ({ id: d.id, ...d.data() })));
  const urunler = us.docs.map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.olusturma?.toMillis?.() || 0) - (a.olusturma?.toMillis?.() || 0));

  // Sale və 24 saat həmişə birinci; qalanları əlifba sırası ilə (boş kateqoriyalar müştəriyə göstərilmir)
  const kq = kategoriler
    .map((k) => ({ id: k.id, ad: yerel(k.ad), ozel: ozelMi(k.id), urunler: urunler.filter((u) => kategoriyeAit(u, k.id)) }))
    .filter((q) => q.ozel || q.urunler.length);
  const diger = kq.filter((q) => !q.ozel);

  // Yuxarıda kateqoriya adları (sürüşən sıra)
  $("#kat-adlari").innerHTML = kq.map((q) =>
    `<a class="cip ${q.ozel ? "cip-ozel" : ""}" style="text-decoration:none" href="./?k=${encodeURIComponent(q.id)}">${q.ozel ? `${ozelIkon(q.id)} ` : ""}${kacis(q.ad)}</a>`).join("");

  // Aşağıdakı şəkilli kartlarda Sale və 24 saat yoxdur — onlar yalnız yuxarıdakı sırada göstərilir
  const qruplar = [{ id: "", ad: t("katalog.hamisi"), urunler }, ...diger];
  $("#kategoriler").innerHTML = qruplar.map((q) => {
    const kapak = q.urunler.find((u) => u.kapak)?.kapak;
    return `<a class="katalog-kart" href="./${q.id ? `?k=${encodeURIComponent(q.id)}` : ""}">
      ${kapak ? `<img src="${kacis(kapak)}" alt="" loading="lazy">` : ""}
      <div class="ust-yazi"><b>${kacis(q.ad)}</b><span>${q.urunler.length} ${kacis(t("vitrin.mehsul"))}</span></div>
    </a>`;
  }).join("");

  const markalar = {};
  for (const u of urunler) if (u.marka) markalar[u.marka] = (markalar[u.marka] || 0) + 1;
  const siyahi = Object.entries(markalar).sort((a, b) => a[0].localeCompare(b[0], "az"));
  if (siyahi.length) {
    $("#markalar-bolum").hidden = false;
    $("#markalar").innerHTML = siyahi.map(([m, n]) =>
      `<a class="cip" style="text-decoration:none" href="./?m=${encodeURIComponent(m)}">${kacis(m)} <span class="soluk">${n}</span></a>`).join("");
  }
} catch (e) {
  console.error(e);
  $("#kategoriler").innerHTML = `<p class="bos">${kacis(t("hata.yukleme"))}</p>`;
}
