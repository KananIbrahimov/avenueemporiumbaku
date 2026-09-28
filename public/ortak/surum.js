// Tətbiqin sürüm nömrəsi — hər yenilikdə artırılır (1.1 → 1.2 → ...).
// Ayarlar səhifəsinin aşağısında göstərilir; yeni versiya bildirişində də istifadə olunur.
export const SURUM = "2.10";
export const MUELLIF = "Kanan Ibrahimov";

export function imzaHtml() {
  return `<div class="imza">
    <div>Powered by <b>${MUELLIF}</b></div>
    <div class="imza-surum">v${SURUM}</div>
  </div>`;
}
