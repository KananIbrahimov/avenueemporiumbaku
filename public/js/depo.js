// Bəyəndiklərim və Səbət
// - Bəyəndiklərim: qonaq üçün bu cihazda, daxil olmuş istifadəçi üçün hesabında (kullanicilar/{uid}.favoriler)
//   saxlanılır; daxil olanda cihazdakılar hesaba birləşdirilir.
// - Səbət: bu cihazda saxlanılır (sifariş veriləndə boşalır).
import { auth, db, doc, updateDoc } from "../ortak/firebase.js";

const FAV_ACAR = "favoriler";
const SEBET_ACAR = "sebet";
const MAKS_FAV = 200;
const MAKS_SEBET = 30;

const oxu = (acar, susma) => {
  try { const v = JSON.parse(localStorage.getItem(acar)); return Array.isArray(v) ? v : susma; } catch { return susma; }
};
const yaz = (acar, v) => { try { localStorage.setItem(acar, JSON.stringify(v)); } catch {} };

const dinleyiciler = new Set();
/** Bəyəndiklərim və ya səbət dəyişəndə çağırılır (məs. aşağı menyudakı saylar) */
export function depoDinle(fn) { dinleyiciler.add(fn); return () => dinleyiciler.delete(fn); }
const xeberVer = () => dinleyiciler.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });

// Başqa vərəqdə dəyişiklik olanda da yenilə
window.addEventListener("storage", (e) => { if (e.key === FAV_ACAR || e.key === SEBET_ACAR) xeberVer(); });

// ================= BƏYƏNDİKLƏRİM =================
let favoriler = oxu(FAV_ACAR, []);
let hesabUid = null;

/** ust.js giriş vəziyyəti bilinəndə çağırır: hesabdakı siyahı ilə cihazdakını birləşdirir */
export async function favorileriBagla(kullanici, profil) {
  hesabUid = kullanici?.uid || null;
  if (!hesabUid) return;
  const hesabda = Array.isArray(profil?.favoriler) ? profil.favoriler : [];
  const birlesmis = [...new Set([...hesabda, ...favoriler])].slice(0, MAKS_FAV);
  const deyisib = birlesmis.length !== hesabda.length;
  favoriler = birlesmis;
  yaz(FAV_ACAR, favoriler);
  xeberVer();
  if (deyisib) hesabaYaz();
}

async function hesabaYaz() {
  if (!hesabUid || auth.currentUser?.uid !== hesabUid) return;
  try { await updateDoc(doc(db, "kullanicilar", hesabUid), { favoriler }); }
  catch (e) { console.warn("favoriler", e); }
}

export const favoriMi = (id) => favoriler.includes(id);
export const favoriListesi = () => [...favoriler];

/** Bəyən / bəyənmə. Qaytarır: yeni vəziyyət (true = bəyənilib) */
export function favoriDegistir(id) {
  if (favoriler.includes(id)) favoriler = favoriler.filter((x) => x !== id);
  else favoriler = [id, ...favoriler].slice(0, MAKS_FAV);
  yaz(FAV_ACAR, favoriler);
  xeberVer();
  hesabaYaz();
  return favoriler.includes(id);
}

// ================= SƏBƏT =================
// Hər sətir: { urunId, olcu, renk, adet }
export const sebetOxu = () => oxu(SEBET_ACAR, []).filter((x) => x && x.urunId);
const sebetYaz = (s) => { yaz(SEBET_ACAR, s); xeberVer(); };
export const sebetSayi = () => sebetOxu().reduce((c, x) => c + (x.adet || 1), 0);

export function sebeteAt(urunId, olcu = "", renk = "", adet = 1) {
  const s = sebetOxu();
  const var_ = s.find((x) => x.urunId === urunId && x.olcu === olcu && x.renk === renk);
  if (var_) var_.adet = Math.min(20, (var_.adet || 1) + adet);
  else {
    if (s.length >= MAKS_SEBET) return false;
    s.push({ urunId, olcu, renk, adet: Math.min(20, Math.max(1, adet)) });
  }
  sebetYaz(s);
  return true;
}

export function sebetAdet(indeks, adet) {
  const s = sebetOxu();
  if (!s[indeks]) return;
  s[indeks].adet = Math.min(20, Math.max(1, adet));
  sebetYaz(s);
}

export function sebettenSil(indeks) {
  const s = sebetOxu();
  s.splice(indeks, 1);
  sebetYaz(s);
}

export const sebetiBosalt = () => sebetYaz([]);
