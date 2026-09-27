// Yedek: tüm verileri tek bir JSON dosyası olarak indirir
import { db, collection, getDocs } from "../../ortak/firebase.js";
import { t } from "../../ortak/i18n.js";
import { $, kacis, bildir, hataMesaji } from "../../ortak/yardim.js";

const KOLEKSIYONLAR = ["kategoriler", "urunler", "urunDetay", "urunFoto", "kullanicilar", "siparisler"];

// Firestore Timestamp → ISO tarih metni
const temizle = (v) => {
  if (v && typeof v.toDate === "function") return v.toDate().toISOString();
  if (Array.isArray(v)) return v.map(temizle);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, temizle(x)]));
  return v;
};

export function yedekSekmesi(kok) {
  kok.innerHTML = `
    <div class="bolum-ust"><h1>${kacis(t("admin.sekme.yedek"))}</h1></div>
    <div class="kart">
      <p>${kacis(t("admin.yedek.aciklama"))}</p>
      <label class="onay" style="margin-bottom:12px"><input type="checkbox" id="fotolu" checked> ${kacis(t("admin.yedek.fotolarDahil"))}</label>
      <button class="btn" id="indir">⬇ ${kacis(t("admin.yedek.indir"))}</button>
      <p class="ipucu" id="durum"></p>
    </div>`;

  $("#indir", kok).addEventListener("click", async (e) => {
    const b = e.target;
    b.disabled = true;
    try {
      const veri = { uygulama: "AvenueBaku", tarih: new Date().toISOString(), koleksiyonlar: {} };
      for (const k of KOLEKSIYONLAR) {
        if (k === "urunFoto" && !$("#fotolu", kok).checked) continue;
        $("#durum", kok).textContent = `${t("genel.yukleniyor")} ${k}…`;
        const s = await getDocs(collection(db, k));
        veri.koleksiyonlar[k] = Object.fromEntries(s.docs.map((d) => [d.id, temizle(d.data())]));
      }
      const blob = new Blob([JSON.stringify(veri, null, 1)], { type: "application/json" });
      const a = Object.assign(document.createElement("a"), {
        href: URL.createObjectURL(blob),
        download: `avenuebaku-yedek-${new Date().toISOString().slice(0, 10)}.json`,
      });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      $("#durum", kok).textContent = `${t("admin.yedek.hazir")} (${Math.round(blob.size / 1024)} KB)`;
    } catch (err) {
      bildir(hataMesaji(err), "hata");
      $("#durum", kok).textContent = "";
    } finally { b.disabled = false; }
  });
}
