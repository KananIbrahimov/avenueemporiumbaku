// Admin siyahıları: brendlər, ölçülər, rənglər (ayarlar/siyahilar sənədində, yalnız admin)
import { db, doc, getDoc, setDoc, arrayUnion } from "../../ortak/firebase.js";

const HAZIR = {
  olculer: [
    "XS", "S", "M", "L", "XL", "XXL", "3XL", "Standart",
    "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46",
  ],
  renkler: [
    "Qara", "Ağ", "Bej", "Krem", "Boz", "Tünd göy", "Mavi", "Qırmızı", "Bordo", "Çəhrayı",
    "Yaşıl", "Haki", "Qəhvəyi", "Sarı", "Narıncı", "Bənövşəyi", "Gümüşü", "Qızılı", "Rəngli",
  ],
  markalar: [],
};

let onbellek = null;

export async function siyahilariGetir() {
  if (onbellek) return onbellek;
  let v = {};
  try {
    const s = await getDoc(doc(db, "ayarlar", "siyahilar"));
    v = s.exists() ? s.data() : {};
  } catch (e) { console.warn(e); }
  onbellek = {
    olculer: v.olculer?.length ? v.olculer : [...HAZIR.olculer],
    renkler: v.renkler?.length ? v.renkler : [...HAZIR.renkler],
    markalar: v.markalar || [],
  };
  return onbellek;
}

/** Siyahıya yeni dəyər əlavə edir (məs. siyahiyaElave("markalar", "Zara")) */
export async function siyahiyaElave(ad, deger) {
  const s = await siyahilariGetir();
  if (!s[ad].includes(deger)) s[ad].push(deger);
  // İlk dəfə yazılanda hazır siyahılar da saxlanılsın
  await setDoc(doc(db, "ayarlar", "siyahilar"), { ...s, [ad]: arrayUnion(deger) }, { merge: true });
}
