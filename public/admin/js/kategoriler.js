// Kategoriler: ekle, yeniden adlandır, sırala, sil
import { db, collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, limit, serverTimestamp } from "../../ortak/firebase.js";
import { t, yerel, DILLER } from "../../ortak/i18n.js";
import { $, $$, kacis, bildir, hataMesaji } from "../../ortak/yardim.js";
import { kategorileriGetir } from "./veri.js";

export async function kategorilerSekmesi(kok) {
  kok.innerHTML = `<p class="bos">${kacis(t("genel.yukleniyor"))}</p>`;
  let kategoriler = [];
  try { kategoriler = await kategorileriGetir(); }
  catch (e) { kok.innerHTML = `<p class="bos">${kacis(hataMesaji(e))}</p>`; return; }

  const dilEtiket = (d) => (DILLER.length > 1 ? ` (${d.kod.toUpperCase()})` : "");

  kok.innerHTML = `
    <div class="bolum-ust"><h1>${kacis(t("admin.sekme.kategoriler"))}</h1>
      <a class="btn btn-ince" href="#ayarlar">← ${kacis(t("admin.sekme.ayarlar"))}</a></div>
    <form class="kart" id="yeni-kat" style="margin-bottom:16px">
      <div class="satir">
        ${DILLER.map((d) => `<div class="alan"><label>${kacis(t("admin.kat.ad"))}${dilEtiket(d)}</label>
          <input name="ad_${d.kod}" maxlength="40" ${d === DILLER[0] ? "required" : ""}></div>`).join("")}
      </div>
      <button class="btn" type="submit">+ ${kacis(t("admin.kat.ekle"))}</button>
      ${kategoriler.length ? "" : `<button class="btn btn-ince" type="button" id="hazir">${kacis(t("admin.kat.hazirEkle"))}</button>`}
    </form>
    <div class="liste">
      ${kategoriler.length ? kategoriler.map((k, i) => `
        <div class="kart liste-oge" data-id="${kacis(k.id)}">
          <div class="bilgi satir">
            ${DILLER.map((d) => `<input data-dil="${d.kod}" value="${kacis(k.ad?.[d.kod] || "")}" maxlength="40" placeholder="${kacis(t("admin.kat.ad"))}${dilEtiket(d)}">`).join("")}
          </div>
          <div class="aksiyonlar">
            <button class="btn btn-ince btn-kucuk" data-is="yukari" ${i === 0 ? "disabled" : ""}>↑</button>
            <button class="btn btn-ince btn-kucuk" data-is="asagi" ${i === kategoriler.length - 1 ? "disabled" : ""}>↓</button>
            <button class="btn btn-kucuk" data-is="kaydet">${kacis(t("admin.kaydet"))}</button>
            <button class="btn btn-link btn-kucuk" data-is="sil">${kacis(t("admin.sil"))}</button>
          </div>
        </div>`).join("") : `<p class="bos">${kacis(t("admin.kat.bos"))}</p>`}
    </div>`;

  const yenile = () => kategorilerSekmesi(kok);

  async function ekle(adlar) {
    const ref = doc(collection(db, "kategoriler"));
    const sira = kategoriler.length ? Math.max(...kategoriler.map((k) => k.sira ?? 0)) + 1 : 0;
    await setDoc(ref, { ad: adlar, sira, olusturma: serverTimestamp() });
    kategoriler.push({ id: ref.id, ad: adlar, sira });
  }

  $("#yeni-kat", kok).addEventListener("submit", async (e) => {
    e.preventDefault();
    const adlar = Object.fromEntries(DILLER.map((d) => [d.kod, e.target.elements[`ad_${d.kod}`].value.trim()]).filter(([, v]) => v));
    if (!adlar[DILLER[0].kod]) return;
    try { await ekle(adlar); bildir(t("admin.kaydedildi"), "basari"); yenile(); }
    catch (err) { bildir(hataMesaji(err), "hata"); }
  });

  $("#hazir", kok)?.addEventListener("click", async () => {
    try {
      await ekle({ az: "Geyim" });
      await ekle({ az: "Ayaqqabı" });
      yenile();
    } catch (err) { bildir(hataMesaji(err), "hata"); }
  });

  $$("[data-is]", kok).forEach((b) => b.addEventListener("click", async () => {
    const kart = b.closest("[data-id]");
    const id = kart.dataset.id;
    const i = kategoriler.findIndex((k) => k.id === id);
    try {
      if (b.dataset.is === "kaydet") {
        const adlar = Object.fromEntries($$("input[data-dil]", kart).map((x) => [x.dataset.dil, x.value.trim()]).filter(([, v]) => v));
        if (!adlar[DILLER[0].kod]) return bildir(t("admin.kat.adGerekli"), "hata");
        await updateDoc(doc(db, "kategoriler", id), { ad: adlar });
        bildir(t("admin.kaydedildi"), "basari");
      } else if (b.dataset.is === "sil") {
        const kullanan = await getDocs(query(collection(db, "urunler"), where("kategoriId", "==", id), limit(1)));
        if (!kullanan.empty) return bildir(t("admin.kat.doluSilinmez"), "hata");
        if (!confirm(t("admin.kat.silOnay", { ad: yerel(kategoriler[i].ad) }))) return;
        await deleteDoc(doc(db, "kategoriler", id));
        yenile();
      } else {
        const j = b.dataset.is === "yukari" ? i - 1 : i + 1;
        [kategoriler[i], kategoriler[j]] = [kategoriler[j], kategoriler[i]];
        await Promise.all(kategoriler.map((k, s) => updateDoc(doc(db, "kategoriler", k.id), { sira: s })));
        yenile();
      }
    } catch (err) { bildir(hataMesaji(err), "hata"); }
  }));
}
