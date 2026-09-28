// İstifadə şərtləri və Məxfilik siyasəti: qeydiyyatda pəncərə, Ayarlarda ayrıca səhifə (huquq.html?s=sertler|mexfilik).
// Mətnlər ortak/huquq/<dil>.js fayllarındadır; müştəri hansı dildədirsə, o dildə göstərilir.
// Mətn əhəmiyyətli dəyişəndə HUQUQ_VERSIYA yenilənir (qeydiyyatda müştərinin profilinə yazılır).
import { dil, t } from "../ortak/i18n.js";
import { kacis } from "../ortak/yardim.js";
import { sifarisAyarAl } from "../ortak/sifaris-ayar.js";

export const HUQUQ_VERSIYA = "2026-09-28";
const TIPLER = ["sertler", "mexfilik"];

async function metinler() {
  try { return (await import(`../ortak/huquq/${dil()}.js`)).default; }
  catch { return (await import("../ortak/huquq/az.js")).default; }
}

function tarixYaz(iso) {
  const [y, a, g] = iso.split("-");
  return `${g}.${a}.${y}`;
}

/** { baslik, html } — {onOdeme}, {elaqe} mağaza ayarlarından doldurulur */
export async function huquqMetni(tip) {
  const [m, ayar] = await Promise.all([metinler(), sifarisAyarAl()]);
  const b = m[tip];
  const nomre = ayar.whatsapp ? `+${ayar.whatsapp}` : "";
  const elaqe = nomre ? m.elaqeWa.replace("{nomre}", kacis(nomre)) : m.elaqeYox;
  const html = b.html
    .replaceAll("{onOdeme}", String(Math.round(+ayar.onOdemeYuzde || 0)))
    .replaceAll("{elaqe}", elaqe)
    + `<p class="soluk huquq-tarix">${kacis(m.tarixEtiket)}: ${tarixYaz(HUQUQ_VERSIYA)}</p>`;
  return { baslik: b.baslik, html };
}

/** Alt pəncərədə göstərir (qeydiyyat formu itmir) */
export async function huquqPencere(tip) {
  const { baslik, html } = await huquqMetni(tip);
  const arxa = document.createElement("div");
  arxa.className = "modal-arxa";
  arxa.innerHTML = `<div class="modal huquq-modal" role="dialog" aria-modal="true">
      <div class="modal-ust"><h2>${kacis(baslik)}</h2>
        <button type="button" class="btn btn-ince btn-kucuk" data-bagla>✕</button></div>
      <div class="huquq-metin">${html}</div>
      <button type="button" class="btn btn-tam" data-bagla style="margin-top:14px">${kacis(t("huquq.bagla"))}</button>
    </div>`;
  const bagla = () => { arxa.remove(); document.body.style.overflow = ""; };
  arxa.addEventListener("click", (e) => { if (e.target === arxa || e.target.closest("[data-bagla]")) bagla(); });
  document.addEventListener("keydown", function esc(e) { if (e.key === "Escape") { bagla(); document.removeEventListener("keydown", esc); } });
  document.body.style.overflow = "hidden";
  document.body.appendChild(arxa);
}

/** Qeydiyyat formunda razılıq sətri: "… İstifadə şərtləri və Məxfilik siyasəti ilə tanış oldum …" */
export function huquqPencereBagla(kok) {
  const yer = kok.querySelector("#razilasma-metin");
  if (yer) {
    const link = (tip) => `<a href="huquq.html?s=${tip}" data-huquq="${tip}">${kacis(t(`huquq.${tip}`))}</a>`;
    yer.innerHTML = kacis(t("huquq.razilasma"))
      .replace("{sertler}", link("sertler"))
      .replace("{mexfilik}", link("mexfilik"));
  }
  kok.addEventListener("click", (e) => {
    const a = e.target.closest("[data-huquq]");
    if (!a) return;
    e.preventDefault();
    huquqPencere(a.dataset.huquq);
  });
}

// ---------- huquq.html (ayrıca səhifə) ----------
const sehife = document.getElementById("huquq-sehife");
if (sehife) {
  const tip = TIPLER.includes(new URLSearchParams(location.search).get("s")) ? new URLSearchParams(location.search).get("s") : "sertler";
  huquqMetni(tip).then(({ baslik, html }) => {
    document.title = `${baslik} — AvenueBaku`;
    sehife.innerHTML = `<h1>${kacis(baslik)}</h1><div class="huquq-metin">${html}</div>`;
  });
}
