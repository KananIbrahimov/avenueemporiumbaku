// Fiyat hesabı — admin panelinde ve müşteri sitesinde aynı formül kullanılır.
import { PARA } from "./ayarlar.js";

export const yuvarla = (x) => Math.round((Number(x) + Number.EPSILON) * 100) / 100;
const sayi = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);

/**
 * maliyet   = alış fiyatı + kargo + vergi/gümrük
 * önerilen  = maliyet × (1 + kâr % / 100)
 * satış     = elle girildiyse o, değilse önerilen
 * üye fiyatı = satış × (1 − üye indirimi % / 100)
 */
export function hesapla({ alisFiyati, kargo, vergi, karYuzde, satisFiyati, indirimYuzde, elle = false }) {
  const maliyet = yuvarla(sayi(alisFiyati) + sayi(kargo) + sayi(vergi));
  const onerilen = yuvarla(maliyet * (1 + sayi(karYuzde) / 100));
  const satis = elle ? yuvarla(sayi(satisFiyati)) : onerilen;
  const indirim = Math.min(Math.max(sayi(indirimYuzde), 0), 90);
  const uyeFiyati = yuvarla(satis * (1 - indirim / 100));
  return {
    maliyet,
    onerilen,
    satis,
    uyeFiyati,
    kar: yuvarla(satis - maliyet),
    uyeKar: yuvarla(uyeFiyati - maliyet),
    karYuzdeGercek: maliyet > 0 ? yuvarla(((satis - maliyet) / maliyet) * 100) : 0,
  };
}

export function para(x) {
  return `${yuvarla(x).toFixed(2)} ${PARA.simge}`;
}
