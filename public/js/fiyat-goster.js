// Mağazada fiyat gösterimi (vitrin kartı ve ürün sayfası)
import { t } from "../ortak/i18n.js";
import { para } from "../ortak/fiyat.js";
import { kacis } from "../ortak/yardim.js";

export function indirimVar(u) {
  return Number(u.indirimYuzde) > 0 && Number(u.uyeFiyati) < Number(u.satisFiyati);
}

/** Üye (e-postası doğrulanmış) ise indirimli fiyat, değilse normal fiyat + "üyelere X ₼" */
export function fiyatHtml(u, uyeMi, buyuk = false) {
  const sinif = buyuk ? "fiyat fiyat-buyuk" : "fiyat";
  if (indirimVar(u) && uyeMi) {
    return `<span class="${sinif}">${para(u.uyeFiyati)}</span><span class="fiyat-eski">${para(u.satisFiyati)}</span>`;
  }
  return `<span class="${sinif}">${para(u.satisFiyati)}</span>` +
    (indirimVar(u) ? `<div class="fiyat-uye">${kacis(t("fiyat.uyelere", { fiyat: para(u.uyeFiyati) }))}</div>` : "");
}
