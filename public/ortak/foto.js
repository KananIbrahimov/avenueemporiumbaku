// Fotoğrafları tarayıcıda küçültüp sıkıştırır (WebP / JPEG).
// Şimdilik fotoğraflar Firestore'da saklanıyor (ücretsiz Spark planı, Storage gerekmez).
// Firestore belge sınırı 1 MB olduğu için her fotoğraf ~550 KB altına indirilir.
//
// iPhone: Safari qalereyadan seçilən şəkilləri adətən JPEG-ə çevirir. "Fayllar"dan seçilən
// HEIC şəkillər isə bəzi brauzerlərdə açılmır — onda heic2any kitabxanası ilə JPEG-ə çevrilir.

export const FOTO_MAX_ADET = 8;
const BUYUK = { kenar: 1400, hedefKB: 550 };
const KUCUK = { kenar: 480, hedefKB: 60 };
const HEIC_KITABXANA = "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js";

function resimYukle(kaynak) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("foto-okunamadi"));
    img.src = kaynak;
  });
}

const webpVar = (() => {
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    return c.toDataURL("image/webp").startsWith("data:image/webp");
  } catch { return false; }
})();

const boyutKB = (dataUrl) => Math.round((dataUrl.length * 3) / 4 / 1024);

function sikistirImg(img, { kenar, hedefKB }) {
  let olcek = Math.min(1, kenar / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
  const tur = webpVar ? "image/webp" : "image/jpeg";
  let kalite = 0.82;
  let sonuc = "";
  for (let deneme = 0; deneme < 8; deneme++) {
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round((img.naturalWidth || img.width) * olcek));
    c.height = Math.max(1, Math.round((img.naturalHeight || img.height) * olcek));
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; // şeffaf PNG'ler JPEG'de siyah olmasın
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height); // brauzerlər EXIF istiqamətini (dik/yan) özü tətbiq edir
    sonuc = c.toDataURL(tur, kalite);
    c.width = c.height = 0; // iPhone-da yaddaşı tez boşalt
    if (boyutKB(sonuc) <= hedefKB) break;
    if (kalite > 0.5) kalite -= 0.12;
    else olcek *= 0.8;
  }
  return sonuc;
}

const heicMi = (dosya) =>
  /image\/hei[cf]/i.test(dosya.type) || /\.(heic|heif)$/i.test(dosya.name || "");

const sekilMi = (dosya) =>
  (dosya.type || "").startsWith("image/") || /\.(jpe?g|png|webp|gif|heic|heif|avif|bmp)$/i.test(dosya.name || "");

let heicYukleniyor = null;
function heicKitabxana() {
  if (window.heic2any) return Promise.resolve(window.heic2any);
  heicYukleniyor ||= new Promise((ok, xeta) => {
    const s = document.createElement("script");
    s.src = HEIC_KITABXANA;
    s.onload = () => (window.heic2any ? ok(window.heic2any) : xeta(new Error("heic")));
    s.onerror = () => { heicYukleniyor = null; xeta(new Error("heic")); };
    document.head.appendChild(s);
  });
  return heicYukleniyor;
}

async function blobdanImg(blob) {
  const url = URL.createObjectURL(blob);
  try { return await resimYukle(url); }
  finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
}

/**
 * Seçilen dosyayı büyük boy (ürün sayfası) olarak sıkıştırır → dataURL.
 * Hata kodları: "foto-tur" (şəkil deyil), "foto-heic" (HEIC çevrilə bilmədi), "foto-okunamadi"
 */
export async function fotoHazirla(dosya) {
  if (!sekilMi(dosya)) throw new Error("foto-tur");
  let img;
  try {
    img = await blobdanImg(dosya);
  } catch (e) {
    if (!heicMi(dosya)) throw e;
    // Brauzer HEIC-i aça bilmədi → JPEG-ə çevir
    try {
      const heic2any = await heicKitabxana();
      const jpeg = await heic2any({ blob: dosya, toType: "image/jpeg", quality: 0.9 });
      img = await blobdanImg(Array.isArray(jpeg) ? jpeg[0] : jpeg);
    } catch {
      throw new Error("foto-heic");
    }
  }
  return sikistirImg(img, BUYUK);
}

/** Vitrin kartı için küçük kapak fotoğrafı üretir → dataURL */
export async function kapakHazirla(dataUrl) {
  return sikistirImg(await resimYukle(dataUrl), KUCUK);
}
