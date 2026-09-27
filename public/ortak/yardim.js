// Küçük yardımcılar
import { t, dil } from "./i18n.js";

/** HTML'e güvenli yazı (XSS önleme) */
export function kacis(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export const $ = (sec, kok = document) => kok.querySelector(sec);
export const $$ = (sec, kok = document) => [...kok.querySelectorAll(sec)];

/** Ekranın altında kısa mesaj */
export function bildir(mesaj, tur = "bilgi") {
  let kutu = document.getElementById("bildirimler");
  if (!kutu) {
    kutu = document.createElement("div");
    kutu.id = "bildirimler";
    document.body.appendChild(kutu);
  }
  const el = document.createElement("div");
  el.className = `bildirim bildirim-${tur}`;
  el.textContent = mesaj;
  kutu.appendChild(el);
  setTimeout(() => el.classList.add("gorunur"), 10);
  setTimeout(() => { el.classList.remove("gorunur"); setTimeout(() => el.remove(), 300); }, 4000);
}

/** Firestore Timestamp / Date → "27.09.2026 20:45" */
export function tarih(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const loc = { az: "az-Latn-AZ", ru: "ru-RU", en: "en-GB" }[dil()] || "az-Latn-AZ";
  try {
    return d.toLocaleString(loc, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return d.toLocaleString();
  }
}

/** Firebase hata kodunu okunur mesaja çevirir */
export function hataMesaji(e) {
  const kod = e?.code || e?.message || "";
  const anahtar = {
    "auth/invalid-email": "hata.email",
    "auth/email-already-in-use": "hata.emailVar",
    "auth/weak-password": "hata.zayifSifre",
    "auth/password-does-not-meet-requirements": "hata.zayifSifre",
    "auth/invalid-credential": "hata.yanlisGiris",
    "auth/wrong-password": "hata.yanlisGiris",
    "auth/user-not-found": "hata.yanlisGiris",
    "auth/too-many-requests": "hata.cokDeneme",
    "auth/network-request-failed": "hata.internet",
    "permission-denied": "hata.yetki",
    "unavailable": "hata.internet",
  }[kod];
  if (!anahtar) console.error(e);
  return t(anahtar || "hata.genel");
}

/** Şifre kuralları: en az 8 karakter, büyük harf, küçük harf, rakam */
export function sifreKontrol(s) {
  const eksik = [];
  if (s.length < 8) eksik.push(t("sifre.kural.uzunluk"));
  if (!/[A-ZƏÖÜĞİŞÇ]/.test(s)) eksik.push(t("sifre.kural.buyuk"));
  if (!/[a-zəöüğışç]/.test(s)) eksik.push(t("sifre.kural.kucuk"));
  if (!/[0-9]/.test(s)) eksik.push(t("sifre.kural.rakam"));
  return eksik;
}

export const SIPARIS_DURUMLARI = ["yeni", "tesdiq", "sifarisVerildi", "yolda", "catdirildi", "legv"];

export function durumEtiketi(d) {
  return `<span class="durum durum-${kacis(d)}">${kacis(t("durum." + d))}</span>`;
}
