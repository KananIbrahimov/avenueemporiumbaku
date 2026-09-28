// Admin panelinde ortak veri önbelleği
import { db, collection, getDocs, doc, getDoc, writeBatch, serverTimestamp } from "../../ortak/firebase.js";
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

// Qadın mağazası üçün hazır kateqoriyalar (bir dəfə əlavə olunur; admin sonra silə/dəyişə bilər)
const HAZIR_KATEGORILER = [
  "Paltar", "Bluz və köynək", "Şalvar", "Cins", "Ətək", "Şort", "Sviter və trikotaj",
  "Gödəkçə və palto", "Kostyum və dəst", "İdman geyimi", "Ev geyimi", "Alt paltarı",
  "Çimərlik geyimi", "Ayaqqabı", "Çanta", "Aksesuar",
];
const ILK_DIL = DILLER[0].kod;
const norm = (s) => String(s || "").toLocaleLowerCase("az").trim();

let tohumYoxlandi = false;

/** Xüsusi kateqoriyalar (Sale, 24 saat) həmişə olmalıdır; hazır siyahı yalnız ilk dəfə əlavə olunur */
async function kategorileriTohumla(liste) {
  if (tohumYoxlandi) return false;
  tohumYoxlandi = true;
  const b = writeBatch(db);
  let deyisdi = false;
  for (const o of OZEL_KATEGORILER) {
    if (liste.some((k) => k.id === o.id)) continue;
    b.set(doc(db, "kategoriler", o.id), { ad: { [ILK_DIL]: o.ad }, ozel: true, sira: 0, olusturma: serverTimestamp() });
    deyisdi = true;
  }
  const bayraq = await getDoc(doc(db, "ayarlar", "tohum")).catch(() => null);
  if (!bayraq?.data()?.kategoriler) {
    const varOlan = new Set(liste.map((k) => norm(yerel(k.ad))));
    for (const ad of HAZIR_KATEGORILER) {
      if (varOlan.has(norm(ad))) continue;
      b.set(doc(collection(db, "kategoriler")), { ad: { [ILK_DIL]: ad }, sira: 0, olusturma: serverTimestamp() });
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
