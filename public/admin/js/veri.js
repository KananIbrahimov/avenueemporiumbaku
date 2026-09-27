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

export async function kategorileriGetir() {
  const s = await getDocs(collection(db, "kategoriler"));
  return s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0));
}
