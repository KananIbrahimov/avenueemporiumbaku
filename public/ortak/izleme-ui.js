// Sifariş izləmə addımları (admin və müştəri eyni görünüşdən istifadə edir)
import { t } from "./i18n.js";
import { kacis, tarih } from "./yardim.js";

export const IZLEME_ADIMLARI = ["yeni", "tesdiq", "yolda", "catdirildi"];

/** Hər addımın tarixi: tarixçədən (sonuncu qeyd), "yeni" üçün sifariş tarixi */
export function adimTarixleri(o) {
  const x = { yeni: o.olusturma };
  for (const q of o.tarixce || []) x[q.durum === "sifarisVerildi" ? "tesdiq" : q.durum] = q.tarix;
  return x;
}

const qisaTarix = (ts) => {
  const s = tarih(ts);
  return s === "—" ? "" : s.split(/[ ,]+/)[0]; // yalnız gün
};

/**
 * Addım-addım xətt. tiklanan=true olduqda (admin) addımlar düymədir: data-adim="durum"
 */
export function adimlarHtml(o, { tiklanan = false } = {}) {
  if (o.durum === "legv") {
    return `<div class="adimlar-legv">${kacis(t("durum.legv"))}</div>`;
  }
  const cari = o.durum === "sifarisVerildi" ? "tesdiq" : o.durum; // köhnə status
  const indeks = Math.max(0, IZLEME_ADIMLARI.indexOf(cari));
  const tarixler = adimTarixleri(o);
  return `<ol class="adimlar">${IZLEME_ADIMLARI.map((a, i) => {
    const sinif = i < indeks ? "bitdi" : i === indeks ? "indi" : "";
    const ic = `<span class="nokta">${i < indeks ? "✓" : ""}</span>
      <span class="adim-ad">${kacis(t("durum." + a))}</span>
      <span class="adim-tarix">${i <= indeks ? kacis(qisaTarix(tarixler[a])) : ""}</span>`;
    return `<li class="${sinif}">${tiklanan
      ? `<button type="button" data-adim="${a}" ${i === indeks ? "disabled" : ""}>${ic}</button>`
      : ic}</li>`;
  }).join("")}</ol>`;
}

/** Kargo məlumatı qutusu (müştəri üçün, yalnız oxumaq) */
export function kargoHtml(o) {
  const z = o.izleme || {};
  if (!z.sirket && !z.kod && !z.link && !z.tahmini && !z.qeyd) return "";
  const guvenliLink = z.link && /^https?:\/\//i.test(z.link) ? z.link : "";
  return `<div class="kargo-kutu">
    ${z.sirket ? `<div><span class="soluk">${kacis(t("izleme.sirket"))}:</span> <b>${kacis(z.sirket)}</b></div>` : ""}
    ${z.kod ? `<div><span class="soluk">${kacis(t("izleme.kod"))}:</span> <b class="kod" data-kopyala="${kacis(z.kod)}">${kacis(z.kod)}</b></div>` : ""}
    ${z.tahmini ? `<div><span class="soluk">${kacis(t("izleme.tahmini"))}:</span> <b>${kacis(z.tahmini.split("-").reverse().join("."))}</b></div>` : ""}
    ${z.qeyd ? `<div style="white-space:pre-line">${kacis(z.qeyd)}</div>` : ""}
    ${guvenliLink ? `<a class="btn btn-kucuk" href="${kacis(guvenliLink)}" target="_blank" rel="noopener noreferrer">${kacis(t("izleme.izle"))} →</a>` : ""}
  </div>`;
}
