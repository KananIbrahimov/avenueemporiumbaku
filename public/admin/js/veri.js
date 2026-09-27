// Admin panelinde ortak veri önbelleği
import { db, collection, getDocs, doc, getDoc } from "../../ortak/firebase.js";

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

export async function kategorileriGetir() {
  const s = await getDocs(collection(db, "kategoriler"));
  return s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0));
}
