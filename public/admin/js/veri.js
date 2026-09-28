// Admin panelinde ortak veri önbelleği
import { db, collection, getDocs, doc, getDoc, writeBatch, serverTimestamp, query, where, setDoc } from "../../ortak/firebase.js";
import { DILLER, yerel } from "../../ortak/i18n.js";
import { OZEL_KATEGORILER, kategoriSirala, ozelMi } from "../../ortak/kategori.js";

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
// Yazı fərqlərinə baxmadan müqayisə: "Ayaqqabi" = "Ayaqqabı", "Salvar" = "Şalvar"
const sade = (s) => norm(s).replace(/[ıi̇]/g, "i").replace(/ə/g, "e").replace(/ş/g, "s").replace(/ç/g, "c")
  .replace(/ğ/g, "g").replace(/ö/g, "o").replace(/ü/g, "u").replace(/\s+/g, " ");

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
  // Eyni adlı (yazı fərqi ilə) təkrar kateqoriyalar: məhsulu olan saxlanılır, boş təkrar silinir
  const silinen = new Set();
  const qruplar = new Map();
  for (const k of liste.filter((x) => !ozelMi(x.id))) {
    const a = sade(k.ad?.[ILK_DIL]);
    if (!qruplar.has(a)) qruplar.set(a, []);
    qruplar.get(a).push(k);
  }
  if ([...qruplar.values()].some((g) => g.length > 1)) {
    const us = await getDocs(collection(db, "urunler"));
    const say = (id) => us.docs.filter((d) => d.data().kategoriId === id).length;
    for (const g of qruplar.values()) {
      if (g.length < 2) continue;
      const saxla = g.find((k) => say(k.id) > 0) || g[0];
      for (const k of g) {
        if (k === saxla || say(k.id) > 0) continue;
        b.delete(doc(db, "kategoriler", k.id));
        silinen.add(k.id);
        deyisdi = true;
      }
    }
  }
  // Hazır kateqoriyalar: düzgün yazılış və çatışmayan dillər (Azərbaycan dilindəki adla tanınır)
  for (const k of liste) {
    if (silinen.has(k.id) || ozelMi(k.id)) continue;
    const h = HAZIR_KATEGORILER.find((x) => sade(x[ILK_DIL]) === sade(k.ad?.[ILK_DIL]));
    if (!h) continue;
    const yeni = { ...k.ad, ...Object.fromEntries(Object.entries(h).filter(([d]) => !k.ad?.[d])), [ILK_DIL]: h[ILK_DIL] };
    if (Object.keys(yeni).every((d) => yeni[d] === k.ad?.[d])) continue;
    b.update(doc(db, "kategoriler", k.id), { ad: yeni });
    deyisdi = true;
  }
  const bayraq = await getDoc(doc(db, "ayarlar", "tohum")).catch(() => null);
  if (!bayraq?.data()?.kategoriler) {
    const varOlan = new Set(liste.map((k) => sade(k.ad?.[ILK_DIL])));
    for (const h of HAZIR_KATEGORILER) {
      if (TOHUMLANMAYAN.has(h[ILK_DIL]) || varOlan.has(sade(h[ILK_DIL]))) continue;
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
