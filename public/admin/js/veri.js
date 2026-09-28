// Admin panelinde ortak veri önbelleği
import { db, collection, getDocs, doc, getDoc, writeBatch, serverTimestamp, query, where, setDoc } from "../../ortak/firebase.js";
import { DILLER, yerel } from "../../ortak/i18n.js";
import { OZEL_KATEGORILER, kategoriSirala } from "../../ortak/kategori.js";

const detaylar = new Map(); // urunId → urunDetay
let detaylarYuklendi = false;

export async function tumDetaylar(yenile = false) {
  if (!detaylarYuklendi || yenile) {
    const s = await getDocs(collection(db, "urunDetay"));
    detaylar.clear();
    s.docs.forEach((d) => detaylar.set(d.id, d.data()));
    detaylarYuklendi = true;
  }
  return detaylar;
}

export async function detayGetir(urunId) {
  if (detaylar.has(urunId)) return detaylar.get(urunId);
  const s = await getDoc(doc(db, "urunDetay", urunId));
  const v = s.exists() ? s.data() : null;
  detaylar.set(urunId, v);
  return v;
}

export function detayGuncelle(urunId, veri) {
  if (veri) detaylar.set(urunId, veri);
  else detaylar.delete(urunId);
}

/**
 * Məhsulun vitrinə (müştəri ekranına) çıxması üçün çatışmayanlar.
 * Qaytarır: çatışmayan sahələrin tərcümə açarları (boşdursa hazırdır)
 */
export function vitrinEksikleri(u, d = {}) {
  const x = [];
  if (!Object.values(u.ad || {}).some((s) => String(s).trim())) x.push("ad");
  if (!u.marka) x.push("marka");
  if (!u.kategoriId) x.push("kategori");
  if (!(u.olculer || []).length) x.push("olcu");
  if (!(u.renkler || []).length) x.push("renk");
  if (!String(d.kaynakLink || "").trim()) x.push("link");
  if (!(Number(d.alisMebleg ?? d.alisFiyati) > 0)) x.push("alis");
  if (!(Number(u.satisFiyati) > 0)) x.push("satis");
  if (!(u.fotoSayisi > 0 || u.kapak)) x.push("foto");
  return x;
}

// Qadın mağazası üçün hazır kateqoriyalar — hər dildə ad (bir dəfə əlavə olunur; admin sonra silə/dəyişə bilər).
// Yeni dil əlavə olunanda buraya həmin dildə ad yazmaq kifayətdir — mövcud kateqoriyalara avtomatik əlavə olunur.
const HAZIR_KATEGORILER = [
  { az: "Paltar", ru: "Платья" },
  { az: "Bluz və köynək", ru: "Блузки и рубашки" },
  { az: "Şalvar", ru: "Брюки" },
  { az: "Cins", ru: "Джинсы" },
  { az: "Ətək", ru: "Юбки" },
  { az: "Şort", ru: "Шорты" },
  { az: "Sviter və trikotaj", ru: "Свитеры и трикотаж" },
  { az: "Gödəkçə və palto", ru: "Куртки и пальто" },
  { az: "Kostyum və dəst", ru: "Костюмы и комплекты" },
  { az: "İdman geyimi", ru: "Спортивная одежда" },
  { az: "Ev geyimi", ru: "Домашняя одежда" },
  { az: "Alt paltarı", ru: "Нижнее бельё" },
  { az: "Çimərlik geyimi", ru: "Пляжная одежда" },
  { az: "Ayaqqabı", ru: "Обувь" },
  { az: "Çanta", ru: "Сумки" },
  { az: "Aksesuar", ru: "Аксессуары" },
  { az: "Geyim", ru: "Одежда" }, // köhnə "Geyim" kateqoriyası üçün tərcümə (yenisi əlavə olunmur)
];
const TOHUMLANMAYAN = new Set(["Geyim"]);
const ILK_DIL = DILLER[0].kod;
const norm = (s) => String(s || "").toLocaleLowerCase("az").trim();

let tohumYoxlandi = false;

/**
 * - Xüsusi kateqoriyalar (Sale, 24 saat) həmişə olmalıdır
 * - Hazır siyahı yalnız ilk dəfə əlavə olunur
 * - Hazır və xüsusi kateqoriyalarda çatışmayan dillərin adı doldurulur (admin öz yazdığı adı dəyişməyib)
 */
async function kategorileriTohumla(liste) {
  if (tohumYoxlandi) return false;
  tohumYoxlandi = true;
  const b = writeBatch(db);
  let deyisdi = false;
  for (const o of OZEL_KATEGORILER) {
    const k = liste.find((x) => x.id === o.id);
    if (!k) {
      b.set(doc(db, "kategoriler", o.id), { ad: { ...o.ad }, ozel: true, sira: 0, olusturma: serverTimestamp() });
      deyisdi = true;
    } else if (k.ad?.[ILK_DIL] === o.ad[ILK_DIL] && Object.keys(o.ad).some((d) => !k.ad?.[d])) {
      b.update(doc(db, "kategoriler", o.id), { ad: { ...o.ad, ...k.ad } });
      deyisdi = true;
    }
  }
  // Mövcud hazır kateqoriyalara çatışmayan dilləri əlavə et (Azərbaycan dilindəki adla tanınır)
  for (const k of liste) {
    const h = HAZIR_KATEGORILER.find((x) => norm(x[ILK_DIL]) === norm(k.ad?.[ILK_DIL]));
    if (!h || !Object.keys(h).some((d) => !k.ad?.[d])) continue;
    b.update(doc(db, "kategoriler", k.id), { ad: { ...h, ...k.ad } });
    deyisdi = true;
  }
  const bayraq = await getDoc(doc(db, "ayarlar", "tohum")).catch(() => null);
  if (!bayraq?.data()?.kategoriler) {
    const varOlan = new Set(liste.map((k) => norm(yerel(k.ad))));
    for (const h of HAZIR_KATEGORILER) {
      if (TOHUMLANMAYAN.has(h[ILK_DIL]) || varOlan.has(norm(h[ILK_DIL]))) continue;
      b.set(doc(collection(db, "kategoriler")), { ad: { ...h }, sira: 0, olusturma: serverTimestamp() });
    }
    b.set(doc(db, "ayarlar", "tohum"), { kategoriler: true }, { merge: true });
    deyisdi = true;
  }
  if (deyisdi) await b.commit();
  return deyisdi;
}

export async function kategorileriGetir() {
  let s = await getDocs(collection(db, "kategoriler"));
  let liste = s.docs.map((d) => ({ id: d.id, ...d.data() }));
  try {
    if (await kategorileriTohumla(liste)) {
      s = await getDocs(collection(db, "kategoriler"));
      liste = s.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
  } catch (e) { console.warn(e); tohumYoxlandi = false; }
  return kategoriSirala(liste);
}

/**
 * Məhsulun şəkillərinə aktiv/passiv vəziyyətini yazır.
 * Təhlükəsizlik qaydası müştəriyə yalnız aktif=true olan şəkilləri göstərir — passiv məhsulun şəkilləri də gizlənir.
 */
export async function fotoAktifYaz(urunId, aktif) {
  const s = await getDocs(query(collection(db, "urunFoto"), where("urunId", "==", urunId)));
  const lazim = s.docs.filter((d) => d.data().aktif !== aktif);
  if (!lazim.length) return;
  const b = writeBatch(db);
  lazim.forEach((d) => b.update(d.ref, { aktif }));
  await b.commit();
}

/** Bir dəfəlik: köhnə şəkillərə məhsulun aktif/passiv vəziyyətini yazır (qayda yenilənəndən sonra lazımdır) */
export async function fotoAktifKocur() {
  const bayraq = await getDoc(doc(db, "ayarlar", "tohum")).catch(() => null);
  if (bayraq?.data()?.fotoAktif) return;
  const [us, fs] = await Promise.all([getDocs(collection(db, "urunler")), getDocs(collection(db, "urunFoto"))]);
  const aktif = new Map(us.docs.map((d) => [d.id, d.data().aktif === true]));
  const lazim = fs.docs.filter((d) => d.data().aktif !== (aktif.get(d.data().urunId) === true));
  for (let i = 0; i < lazim.length; i += 400) {
    const b = writeBatch(db);
    lazim.slice(i, i + 400).forEach((d) => b.update(d.ref, { aktif: aktif.get(d.data().urunId) === true }));
    await b.commit();
  }
  await setDoc(doc(db, "ayarlar", "tohum"), { fotoAktif: true }, { merge: true });
}
