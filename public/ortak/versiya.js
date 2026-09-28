// Yeni versiya yoxlaması: sayt yenilənəndə (deploy) açıq səhifələr bunu görür.
// - Bildiriş göstərir: "Yeni versiya var — Yenilə"
// - Tətbiq arxa fondan qayıdanda, yarımçıq forma yoxdursa, özü yenilənir.
import { t } from "./i18n.js";
const YOXLAMA_ARALIGI = 5 * 60 * 1000; // 5 dəqiqə

const kok = new URL("../", import.meta.url); // saytın kökü (mağaza və admin eyni faylı istifadə edir)
let yuklenen = null;   // səhifə açılanda olan versiya
let yeniSurum = "";
let yeniVar = false;
let formaDeyisib = false;
let gizlenmeVaxti = null; // tətbiq arxa fona keçən an (heç keçməyibsə null)

async function versiyaAl() {
  try {
    const r = await fetch(new URL("versiya.json", kok) + "?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();
    if (j.surum) yeniSurum = j.surum;
    return j.versiya || null;
  } catch { return null; }
}

function yenile() {
  // Service worker köhnə faylları saxlamasın
  navigator.serviceWorker?.getRegistrations?.().then((r) => r.forEach((x) => x.update())).catch(() => {});
  location.reload();
}

function bildirisGoster() {
  if (document.getElementById("yeni-versiya")) return;
  const el = document.createElement("div");
  el.id = "yeni-versiya";
  el.setAttribute("role", "status");
  el.innerHTML = `<span>✨ ${t("versiya.hazir")}${yeniSurum ? ` <span class="soluk">v${yeniSurum}</span>` : ""}</span><button type="button" class="btn btn-kucuk">${t("versiya.yenile")}</button>`;
  el.querySelector("button").addEventListener("click", yenile);
  document.body.appendChild(el);
}

async function yoxla() {
  const v = await versiyaAl();
  if (!v) return;
  if (!yuklenen) { yuklenen = v; return; }
  if (v !== yuklenen) {
    yeniVar = true;
    bildirisGoster();
  }
}

export function versiyaYoxla() {
  if (["localhost", "127.0.0.1"].includes(location.hostname)) return; // kompüterdə test zamanı yox
  yoxla();
  setInterval(yoxla, YOXLAMA_ARALIGI);

  // Formada nəsə yazılıbsa avtomatik yeniləmə (yazılan itməsin)
  document.addEventListener("input", (e) => {
    if (e.target.closest?.("form, .kart")) formaDeyisib = true;
  }, true);
  document.addEventListener("submit", () => { formaDeyisib = false; }, true);
  window.addEventListener("hashchange", () => { formaDeyisib = false; });

  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "hidden") { gizlenmeVaxti = Date.now(); return; }
    await yoxla();
    // Tətbiq ən azı 30 san. arxa fonda qalıbsa və yarımçıq forma yoxdursa — özü yenilə
    const arxaFonda = gizlenmeVaxti !== null && Date.now() - gizlenmeVaxti > 30000;
    gizlenmeVaxti = null;
    if (yeniVar && arxaFonda && !formaDeyisib) yenile();
  });
}
