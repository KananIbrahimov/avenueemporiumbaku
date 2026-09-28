// Sifariş ayarları (mağaza + admin ortaq):
//   magazaAyar/sifaris  → { whatsapp: "994501234567", onOdemeYuzde: 30, odemeQeydi: "Kart: ..." }
// Hamı oxuya bilər (müştəri səbətdə ön ödənişi və WhatsApp nömrəsini görməlidir), yalnız admin yazır.
import { db, doc, getDoc, setDoc, serverTimestamp } from "./firebase.js";
import { para, yuvarla } from "./fiyat.js";

export const STANDART_SIFARIS_AYAR = { whatsapp: "", onOdemeYuzde: 30, odemeQeydi: "" };

let onbellek = null;

export async function sifarisAyarAl({ tezeden = false } = {}) {
  if (onbellek && !tezeden) return onbellek;
  try {
    const s = await getDoc(doc(db, "magazaAyar", "sifaris"));
    onbellek = { ...STANDART_SIFARIS_AYAR, ...(s.exists() ? s.data() : {}) };
  } catch (e) {
    console.warn(e);
    onbellek = { ...STANDART_SIFARIS_AYAR };
  }
  return onbellek;
}

export async function sifarisAyarYaz(ayar) {
  await setDoc(doc(db, "magazaAyar", "sifaris"), {
    whatsapp: waNomre(ayar.whatsapp),
    onOdemeYuzde: Math.min(100, Math.max(0, Math.round(+ayar.onOdemeYuzde || 0))),
    odemeQeydi: String(ayar.odemeQeydi || "").slice(0, 500),
    guncelleme: serverTimestamp(),
  });
  onbellek = null;
}

/** "+994 50 123 45 67" → "994501234567" (wa.me formatı); 0 ilə başlayan yerli nömrəyə 994 əlavə olunur */
export function waNomre(x) {
  let n = String(x || "").replace(/\D/g, "");
  if (n.startsWith("00")) n = n.slice(2);
  if (n.length === 10 && n.startsWith("0")) n = "994" + n.slice(1);
  if (n.length === 9) n = "994" + n;
  return n;
}

/** Ön ödəniş: { yuzde, onOdeme, qaliq } */
export function onOdemeHesab(cem, yuzde) {
  const y = Math.min(100, Math.max(0, +yuzde || 0));
  const onOdeme = yuvarla((cem * y) / 100);
  return { yuzde: y, onOdeme, qaliq: yuvarla(cem - onOdeme) };
}

export function waLink(nomre, metin) {
  const n = waNomre(nomre);
  return `https://wa.me/${n}?text=${encodeURIComponent(metin)}`;
}

/**
 * Müştərinin mağazaya göndərdiyi sifariş mesajı.
 * setirler: [{ ad, marka, olcu, renk, adet, fiyat }]
 */
export function sifarisMesaji({ sebetId, musteriAd, telefon, setirler, cem, yuzde, odemeQeydi, qeyd }) {
  const h = onOdemeHesab(cem, yuzde);
  const s = [
    `🛍️ *AvenueBaku — yeni sifariş*`,
    `Sifariş №: *${sebetId}*`,
    `Müştəri: ${musteriAd}`,
    telefon ? `Telefon: ${telefon}` : "",
    "",
    ...setirler.map((x, i) =>
      `${i + 1}. ${x.marka ? x.marka + " — " : ""}${x.ad}` +
      `${x.olcu ? ` · Ölçü: ${x.olcu}` : ""}${x.renk ? ` · Rəng: ${x.renk}` : ""}` +
      `\n   ${x.adet} × ${para(x.fiyat)} = ${para(x.adet * x.fiyat)}`),
    "",
    `*Cəmi: ${para(cem)}*`,
  ];
  if (h.yuzde > 0) {
    s.push(`Ön ödəniş (${h.yuzde}%): *${para(h.onOdeme)}*`, `Qalıq (çatdırılanda): ${para(h.qaliq)}`);
  }
  if (qeyd) s.push("", `Qeyd: ${qeyd}`);
  if (h.yuzde > 0) {
    s.push("", `Sifarişin təsdiqi üçün ${h.yuzde}% ön ödəniş edəcəyəm.`);
    if (odemeQeydi) s.push(`Ödəniş: ${odemeQeydi}`);
  }
  return s.filter((x, i, a) => !(x === "" && a[i - 1] === "")).join("\n").trim();
}
