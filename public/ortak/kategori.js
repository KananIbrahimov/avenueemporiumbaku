// Kateqoriyalar: xüsusi (sabit) kateqoriyalar, sıralama və məhsulun kateqoriyaya aid olması.
// Mağaza və admin paneli eyni qaydanı istifadə edir.
//
// Xüsusi kateqoriyalar ("Sale", "24 saata çatdırılma") həmişə solda/yuxarıda göstərilir,
// qalanları əlifba sırası ilə düzülür. Məhsul əsas kateqoriyasından (məs. Ayaqqabı) əlavə
// bu xüsusi kateqoriyalara da daxil ola bilər (urunler.ekKategoriler massivi).
import { yerel } from "./i18n.js";

export const OZEL_KATEGORILER = [
  { id: "sale", ad: "Sale", ikon: "🔥" },
  { id: "24saat", ad: "24 saata çatdırılma", ikon: "⚡" },
];

export const ozelMi = (id) => OZEL_KATEGORILER.some((k) => k.id === id);
export const ozelIkon = (id) => OZEL_KATEGORILER.find((k) => k.id === id)?.ikon || "";

/** Xüsusilər əvvəl (sabit sıra ilə), qalanları əlifba sırası ilə */
export function kategoriSirala(liste) {
  const ozel = OZEL_KATEGORILER.map((o) => liste.find((k) => k.id === o.id)).filter(Boolean);
  const diger = liste.filter((k) => !ozelMi(k.id))
    .sort((a, b) => yerel(a.ad).localeCompare(yerel(b.ad), "az", { sensitivity: "base" }));
  return [...ozel, ...diger];
}

/** Məhsul bu kateqoriyadadırmı? (əsas kateqoriya və ya əlavə xüsusi kateqoriya) */
export function kategoriyeAit(u, id) {
  return u.kategoriId === id || (u.ekKategoriler || []).includes(id);
}
