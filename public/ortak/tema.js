// Tema: həmişə qaranlıq, gümüşü rənglər (SafeMoney üslubu). Seçim yoxdur.
export const GUMUSU = "#c3c8ce";

export function temaUygula() {
  document.documentElement.dataset.tema = "qaranliq";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#0b0c0e");
  try { localStorage.removeItem("tema"); } catch {} // köhnə seçimləri təmizlə
}

/** Instagram şəkli və s. üçün vurğu rəngi */
export const vurguRengi = () => GUMUSU;
