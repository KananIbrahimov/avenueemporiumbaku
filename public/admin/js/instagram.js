// Instagram üçün hazırla: post (1080×1080) / story (1080×1920) şəkli + hazır mətn.
// Telefonda "Paylaş" → paylaşım menyusundan Instagram seçilir. Kompüterdə şəkil yüklənir, mətn kopyalanır.
import { db, doc, getDoc } from "../../ortak/firebase.js";
import { MAGAZA_URL } from "../../ortak/ayarlar.js";
import { t, yerel } from "../../ortak/i18n.js";
import { para } from "../../ortak/fiyat.js";
import { $, $$, kacis, bildir, hataMesaji } from "../../ortak/yardim.js";
import { vurguRengi } from "../../ortak/tema.js";
import { IKON } from "../../ortak/ikon.js";

export const SABLON_ACARLARI = ["ad", "marka", "qiymet", "uzvQiymeti", "olculer", "renkler", "kateqoriya", "link", "kateqoriyaTag", "markaTag"];

export const VARSAYILAN_SABLON = `✨ {ad}
🏷 Brend: {marka}
💰 Qiymət: {qiymet}
💎 Üzvlərə xüsusi qiymət: {uzvQiymeti}
📏 Ölçülər: {olculer}
🎨 Rənglər: {renkler}

🛍 Sifariş üçün profildəki linkə keçin və ya bizə yazın 💌

#avenuebaku #baku #bakı #azerbaijan #moda #fashion #stil {kateqoriyaTag} {markaTag}`;

const etiket = (s) => {
  const x = String(s || "").toLocaleLowerCase("az").replace(/[^\p{L}\p{N}]/gu, "");
  return x ? `#${x}` : "";
};

/** Şablondakı {açar}-ları doldurur; boş qalan açarlı sətirləri silir */
export function metinUret(sablon, d) {
  return sablon.split("\n")
    .map((satir) => {
      let bos = false;
      const yeni = satir.replace(/\{(\w+)\}/g, (_, a) => {
        const v = d[a] ?? "";
        if (!v && !/Tag$/.test(a)) bos = true;
        return v;
      });
      return bos ? null : yeni.replace(/\s+$/, "");
    })
    .filter((s) => s !== null)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ---------- Şəkil çəkmə ----------
function resim(src) {
  return new Promise((ok, xeta) => {
    if (!src) return ok(null);
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = xeta;
    i.src = src;
  });
}

function acikRenk(hex, oran) {
  const n = parseInt(hex.slice(1), 16);
  const k = (v) => Math.round(v + (255 - v) * oran);
  return `rgb(${k(n >> 16)}, ${k((n >> 8) & 255)}, ${k(n & 255)})`;
}

function yuvarlakKutu(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function aralikliYaz(c, metin, x, y, aralik) {
  for (const h of metin) {
    c.fillText(h, x, y);
    x += c.measureText(h).width + aralik;
  }
  return x;
}

function satirlaraBol(c, metin, genislik, maks) {
  const sozler = metin.split(/\s+/);
  const satirlar = [];
  let s = "";
  for (const soz of sozler) {
    const dene = s ? `${s} ${soz}` : soz;
    if (c.measureText(dene).width <= genislik) s = dene;
    else { if (s) satirlar.push(s); s = soz; }
  }
  if (s) satirlar.push(s);
  if (satirlar.length > maks) {
    satirlar.length = maks;
    let son = satirlar[maks - 1];
    while (c.measureText(son + "…").width > genislik && son.length) son = son.slice(0, -1);
    satirlar[maks - 1] = son.trimEnd() + "…";
  }
  return satirlar;
}

async function sekilCiz(canvas, { img, urun, format, renk }) {
  const W = 1080, H = format === "story" ? 1920 : 1080;
  const story = format === "story";
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext("2d");

  try {
    await Promise.all([
      document.fonts.load('600 60px "Cormorant Garamond"'),
      document.fonts.load('700 40px "Inter"'),
      document.fonts.load('600 30px "Inter"'),
    ]);
  } catch {}

  // Fon + şəkil (cover)
  c.fillStyle = "#1c1a17";
  c.fillRect(0, 0, W, H);
  if (img) {
    const o = Math.max(W / img.width, H / img.height);
    const w = img.width * o, h = img.height * o;
    c.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  }

  // Qaralmalar (yazı oxunsun)
  let g = c.createLinearGradient(0, 0, 0, H * 0.2);
  g.addColorStop(0, "rgba(0,0,0,.5)"); g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g; c.fillRect(0, 0, W, H * 0.2);
  g = c.createLinearGradient(0, H * 0.45, 0, H);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.55, "rgba(0,0,0,.55)"); g.addColorStop(1, "rgba(0,0,0,.85)");
  c.fillStyle = g; c.fillRect(0, H * 0.45, W, H * 0.55);

  const pad = 72;
  const ustY = story ? 200 : 110;
  const acik = acikRenk(renk, 0.55);

  // Loqo
  c.textBaseline = "alphabetic";
  c.fillStyle = "#ffffff";
  c.font = '600 58px "Cormorant Garamond", Georgia, serif';
  const x2 = aralikliYaz(c, "AVENUE", pad, ustY, 7);
  c.fillStyle = "rgba(255,255,255,.8)";
  c.font = '700 22px "Inter", sans-serif';
  aralikliYaz(c, "BAKU", x2 + 10, ustY, 6);

  // "YENİ" nişanı
  c.font = '700 28px "Inter", sans-serif';
  const yeni = t("admin.ig.yeni");
  const yw = c.measureText(yeni).width + 44;
  c.fillStyle = renk;
  yuvarlakKutu(c, W - pad - yw, ustY - 44, yw, 56, 28); c.fill();
  c.fillStyle = "#fff";
  c.fillText(yeni, W - pad - yw + 22, ustY - 6);

  // Aşağı blok (aşağıdan yuxarı)
  let y = H - (story ? 330 : 84);

  // Qiymət
  const indirim = Number(urun.indirimYuzde) > 0 && urun.uyeFiyati < urun.satisFiyati;
  c.font = '700 54px "Inter", sans-serif';
  const q = para(urun.satisFiyati);
  const qw = c.measureText(q).width + 64;
  c.fillStyle = renk;
  yuvarlakKutu(c, pad, y - 92, qw, 92, 46); c.fill();
  c.fillStyle = "#fff";
  c.fillText(q, pad + 32, y - 27);
  if (indirim) {
    c.font = '600 32px "Inter", sans-serif';
    c.fillStyle = acik;
    c.fillText(t("admin.ig.uzvlere"), pad + qw + 28, y - 56);
    c.fillStyle = "#fff";
    c.font = '700 40px "Inter", sans-serif';
    c.fillText(para(urun.uyeFiyati), pad + qw + 28, y - 14);
  }
  y -= 92 + 40;

  // Ad
  c.font = `600 ${story ? 84 : 76}px "Cormorant Garamond", Georgia, serif`;
  c.fillStyle = "#fff";
  const satirlar = satirlaraBol(c, yerel(urun.ad), W - pad * 2, 2);
  const sh = story ? 88 : 80;
  for (let i = satirlar.length - 1; i >= 0; i--) { c.fillText(satirlar[i], pad, y); y -= sh; }

  // Brend
  if (urun.marka) {
    c.font = '700 28px "Inter", sans-serif';
    c.fillStyle = acik;
    aralikliYaz(c, urun.marka.toLocaleUpperCase("az"), pad, y + 16, 6);
  }

  // Story: aşağıda "Link bioda"
  if (story) {
    c.font = '600 34px "Inter", sans-serif';
    c.fillStyle = "rgba(255,255,255,.85)";
    const m = t("admin.ig.linkBioda");
    c.fillText(m, (W - c.measureText(m).width) / 2, H - 190);
  }
}

// ---------- Modal ----------
export async function instagramAc(urunId) {
  const arxa = document.createElement("div");
  arxa.className = "modal-arxa";
  arxa.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><p class="bos">${kacis(t("genel.yukleniyor"))}</p></div>`;
  document.body.appendChild(arxa);
  const bagla = () => arxa.remove();
  arxa.addEventListener("click", (e) => { if (e.target === arxa) bagla(); });

  let urun, img, sablon = VARSAYILAN_SABLON, katAd = "";
  try {
    const [us, fs, as] = await Promise.all([
      getDoc(doc(db, "urunler", urunId)),
      getDoc(doc(db, "urunFoto", `${urunId}_0`)),
      getDoc(doc(db, "ayarlar", "instagram")).catch(() => null),
    ]);
    if (!us.exists()) throw new Error("yok");
    urun = { id: us.id, ...us.data() };
    img = await resim(fs.exists() ? fs.data().veri : urun.kapak).catch(() => null);
    if (as?.exists() && as.data().sablon) sablon = as.data().sablon;
    if (urun.kategoriId) {
      const ks = await getDoc(doc(db, "kategoriler", urun.kategoriId)).catch(() => null);
      katAd = ks?.exists() ? yerel(ks.data().ad) : "";
    }
  } catch (e) {
    bildir(hataMesaji(e), "hata");
    bagla();
    return;
  }

  const indirim = Number(urun.indirimYuzde) > 0 && urun.uyeFiyati < urun.satisFiyati;
  const link = `${MAGAZA_URL || location.origin}/urun.html?id=${encodeURIComponent(urun.id)}`;
  const metin = metinUret(sablon, {
    ad: yerel(urun.ad),
    marka: urun.marka || "",
    qiymet: para(urun.satisFiyati),
    uzvQiymeti: indirim ? para(urun.uyeFiyati) : "",
    olculer: (urun.olculer || []).join(", "),
    renkler: (urun.renkler || []).join(", "),
    kateqoriya: katAd,
    link,
    kateqoriyaTag: etiket(katAd),
    markaTag: etiket(urun.marka),
  });

  const paylasVar = typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [new File([new Blob(["x"], { type: "image/jpeg" })], "x.jpg", { type: "image/jpeg" })] });

  const modal = $(".modal", arxa);
  modal.innerHTML = `
    <div class="modal-ust"><h2>${IKON.instagram} Instagram</h2>
      <button class="btn btn-link" id="bagla" aria-label="${kacis(t("admin.ig.bagla"))}">${IKON.bagla}</button></div>
    <div class="segment" style="margin-bottom:12px">
      <button type="button" class="secili" data-format="post">${kacis(t("admin.ig.post"))}</button>
      <button type="button" data-format="story">${kacis(t("admin.ig.story"))}</button>
    </div>
    <div class="ig-onizleme"><canvas id="ig-canvas"></canvas></div>
    <div class="alan" style="margin-top:14px"><label>${kacis(t("admin.ig.metin"))}</label>
      <textarea id="ig-metin" style="min-height:170px;font-size:14px">${kacis(metin)}</textarea></div>
    <div style="display:grid;gap:8px">
      ${paylasVar ? `<button class="btn btn-tam" id="ig-paylas">${IKON.paylas} ${kacis(t("admin.ig.paylas"))}</button>` : ""}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <button class="btn ${paylasVar ? "btn-ince" : ""}" id="ig-yukle">${IKON.yukle} ${kacis(t("admin.ig.yukle"))}</button>
        <button class="btn btn-ince" id="ig-kopyala">${IKON.kopyala} ${kacis(t("admin.ig.kopyala"))}</button>
      </div>
      <p class="ipucu" style="text-align:center;margin:0">${kacis(t(paylasVar ? "admin.ig.ipucuTelefon" : "admin.ig.ipucuKomputer"))}</p>
    </div>`;
  $("#bagla", modal).addEventListener("click", bagla);

  const canvas = $("#ig-canvas", modal);
  let format = "post";
  let blob = null;
  const dosyaAdi = () => `avenuebaku-${(yerel(urun.ad) || "mehsul").toLocaleLowerCase("az").replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 40)}-${format}.jpg`;

  async function yenile() {
    blob = null;
    await sekilCiz(canvas, { img, urun, format, renk: vurguRengi() });
    blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.92));
  }
  await yenile();

  $$("[data-format]", modal).forEach((b) => b.addEventListener("click", async () => {
    format = b.dataset.format;
    $$("[data-format]", modal).forEach((x) => x.classList.toggle("secili", x === b));
    await yenile();
  }));

  const metniKopyala = () => navigator.clipboard?.writeText($("#ig-metin", modal).value).catch(() => {});

  $("#ig-kopyala", modal).addEventListener("click", async () => {
    try { await navigator.clipboard.writeText($("#ig-metin", modal).value); bildir(t("admin.ig.kopyalandi"), "basari"); }
    catch { $("#ig-metin", modal).select(); bildir(t("admin.ig.elleKopyala"), "hata"); }
  });

  $("#ig-yukle", modal).addEventListener("click", () => {
    if (!blob) return;
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: dosyaAdi() });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    metniKopyala();
    bildir(t("admin.ig.yuklendi"), "basari");
  });

  $("#ig-paylas", modal)?.addEventListener("click", () => {
    if (!blob) return;
    const fayl = new File([blob], dosyaAdi(), { type: "image/jpeg" });
    metniKopyala(); // Instagram mətni avtomatik götürmür — yapışdırmaq üçün kopyalanır
    navigator.share({ files: [fayl], text: $("#ig-metin", modal).value })
      .then(() => bildir(t("admin.ig.kopyalandi"), "basari"))
      .catch((e) => { if (e?.name !== "AbortError") bildir(t("hata.genel"), "hata"); });
  });
}
