// Fotoğrafları tarayıcıda küçültüp sıkıştırır (WebP / JPEG).
// Şimdilik fotoğraflar Firestore'da saklanıyor (ücretsiz Spark planı, Storage gerekmez).
// Firestore belge sınırı 1 MB olduğu için her fotoğraf ~600 KB altına indirilir.

export const FOTO_MAX_ADET = 8;
const BUYUK = { kenar: 1400, hedefKB: 550 };
const KUCUK = { kenar: 480, hedefKB: 60 };

function resimYukle(kaynak) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("foto-okunamadi"));
    img.src = kaynak;
  });
}

function dosyaOku(dosya) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(dosya);
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

async function sikistir(kaynak, { kenar, hedefKB }) {
  const img = await resimYukle(kaynak);
  let olcek = Math.min(1, kenar / Math.max(img.width, img.height));
  const tur = webpVar ? "image/webp" : "image/jpeg";
  let kalite = 0.82;
  let sonuc = "";
  for (let deneme = 0; deneme < 8; deneme++) {
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.width * olcek));
    c.height = Math.max(1, Math.round(img.height * olcek));
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; // şeffaf PNG'ler JPEG'de siyah olmasın
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    sonuc = c.toDataURL(tur, kalite);
    if (boyutKB(sonuc) <= hedefKB) break;
    if (kalite > 0.5) kalite -= 0.12;
    else olcek *= 0.8;
  }
  return sonuc;
}

/** Seçilen dosyayı büyük boy (ürün sayfası) olarak sıkıştırır → dataURL */
export async function fotoHazirla(dosya) {
  if (!dosya.type.startsWith("image/")) throw new Error("foto-tur");
  return sikistir(await dosyaOku(dosya), BUYUK);
}

/** Vitrin kartı için küçük kapak fotoğrafı üretir → dataURL */
export function kapakHazirla(dataUrl) {
  return sikistir(dataUrl, KUCUK);
}
