// Çox dilli altyapı.
// YENİ DİL ƏLAVƏ ETMƏK (məs. ingilis dili):
//   1) ortak/dil/ qovluğunda az.js-in surətini yaradın (en.js) və mətnləri tərcümə edin
//   2) Aşağıda import sətri və DILLER siyahısına bir sətir əlavə edin
//   Başqa heç nə dəyişmir: dil seçimi, admin məhsul formunda həmin dildə ad/təsvir xanaları
//   və kateqoriya adları avtomatik görünür. Tərcümə olunmayan açar Azərbaycan dilində göstərilir.
import az from "./dil/az.js";
import ru from "./dil/ru.js";
// import en from "./dil/en.js";

export const DILLER = [
  { kod: "az", ad: "Azərbaycan", metinler: az },
  { kod: "ru", ad: "Русский", metinler: ru },
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

/** Yuxarıdakı qısa dil seçimi (AZ · RU …). Yalnız bir dil varsa boşdur. */
export function dilSeciciHtml() {
  if (DILLER.length < 2) return "";
  return `<div class="dil-secici" role="group" aria-label="${t("dil.sec")}">${DILLER.map((d) =>
    `<button type="button" data-dil="${d.kod}" class="${d.kod === aktifDil ? "secili" : ""}" title="${d.ad}">${d.kod.toUpperCase()}</button>`).join("")}</div>`;
}

export function dilSeciciBagla(kok = document) {
  kok.querySelectorAll(".dil-secici [data-dil]").forEach((b) =>
    b.addEventListener("click", () => { if (b.dataset.dil !== aktifDil) dilDegistir(b.dataset.dil); }));
}

/**
 * Bazada Azərbaycan dilində saxlanan rəng/ölçü adlarının göstərilməsi: "Qara" → "Чёрный".
 * Tərcümə dil faylında "deger.<ad>" açarı ilə yazılır; yoxdursa ad olduğu kimi qalır.
 */
export function degerCevir(x) {
  if (!x || aktifDil === VARSAYILAN_DIL) return x || "";
  const acar = `deger.${x}`;
  const m = bul(aktifDil)?.metinler[acar];
  return m || x;
}

/**
 * Sayla birlikdə söz: say(5, "vitrin.mehsul") → "5 məhsul" / "5 товаров".
 * Dil faylında formalar "|" ilə yazıla bilər (rus dili: "товар|товара|товаров" — 1 / 2-4 / 5+).
 */
export function say(n, acar) {
  const formalar = t(acar).split("|");
  if (formalar.length < 3) return `${n} ${formalar[0]}`;
  const m10 = n % 10, m100 = n % 100;
  const i = m10 === 1 && m100 !== 11 ? 0 : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 1 : 2;
  return `${n} ${formalar[i]}`;
}
