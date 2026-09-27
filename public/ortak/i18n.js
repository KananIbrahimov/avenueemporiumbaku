// Çok dil altyapısı.
// Yeni dil eklemek için:
//   1) ortak/dil/ klasörüne az.js'in kopyasını açın (örn. ru.js) ve metinleri çevirin
//   2) Aşağıdaki DILLER listesine ekleyin
// Ürün adı/açıklaması ve kategori adları admin panelinde her dil için ayrı girilir.
import az from "./dil/az.js";

export const DILLER = [
  { kod: "az", ad: "Azərbaycan", metinler: az },
  // { kod: "ru", ad: "Русский", metinler: ru },
  // { kod: "en", ad: "English", metinler: en },
];
export const VARSAYILAN_DIL = "az";

const bul = (kod) => DILLER.find((d) => d.kod === kod);

let aktifDil = (() => {
  try {
    const k = localStorage.getItem("dil");
    if (k && bul(k)) return k;
  } catch {}
  return VARSAYILAN_DIL;
})();

export const dil = () => aktifDil;

export function dilDegistir(kod) {
  if (!bul(kod)) return;
  aktifDil = kod;
  try { localStorage.setItem("dil", kod); } catch {}
  location.reload();
}

/** Arayüz metni: t("giris.baslik") veya t("x", { ad: "Aynur" }) → "{ad}" yerine koyar */
export function t(anahtar, degerler = {}) {
  const m = bul(aktifDil)?.metinler[anahtar] ?? bul(VARSAYILAN_DIL).metinler[anahtar] ?? anahtar;
  return m.replace(/\{(\w+)\}/g, (_, k) => (degerler[k] ?? `{${k}}`));
}

/** Veritabanındaki çok dilli alan: { az: "Köynək", ru: "..." } → aktif dildeki metin */
export function yerel(alan) {
  if (alan == null) return "";
  if (typeof alan === "string") return alan;
  return alan[aktifDil] || alan[VARSAYILAN_DIL] || Object.values(alan).find(Boolean) || "";
}

/** data-t, data-t-ph (placeholder), data-t-title özniteliklerini doldurur */
export function sayfayiCevir(kok = document) {
  document.documentElement.lang = aktifDil;
  kok.querySelectorAll("[data-t]").forEach((el) => (el.textContent = t(el.dataset.t)));
  kok.querySelectorAll("[data-t-ph]").forEach((el) => (el.placeholder = t(el.dataset.tPh)));
  kok.querySelectorAll("[data-t-title]").forEach((el) => (el.title = t(el.dataset.tTitle)));
}
