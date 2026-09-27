// Sifariş kartında kargo məlumatı: xülasə, əlavə et/dəyiş formu
import { db, doc, updateDoc } from "../../ortak/firebase.js";
import { t } from "../../ortak/i18n.js";
import { $$, kacis, bildir, hataMesaji } from "../../ortak/yardim.js";

const KARGO_SIRKETLERI = [
  "Trendyol Express", "Yurtiçi Kargo", "Aras Kargo", "MNG Kargo", "PTT Kargo",
  "DHL", "UPS", "FedEx", "TNT", "Azərpoçt", "Camex", "AzerExpress", "Kolli", "Ailexpress",
];
const acik = new Set(); // formu açıq olan sifarişlər

export const kargoDatalist = () =>
  `<datalist id="kargolar">${KARGO_SIRKETLERI.map((k) => `<option value="${kacis(k)}">`).join("")}</datalist>`;

/** Sifariş kartının kargo hissəsi */
export function kargoHtml(o) {
  if (["yeni", "legv"].includes(o.durum)) return "";
  const z = o.izleme || {};
  const varMi = z.sirket || z.kod || z.link || z.tahmini || z.qeyd;
  if (acik.has(o.id)) {
    return `<form data-kargo="${kacis(o.id)}" class="kargo-form kart" style="background:var(--kart-2);padding:14px">
      <div class="satir">
        <div class="alan"><label>${kacis(t("izleme.sirket"))}</label><input name="sirket" list="kargolar" value="${kacis(z.sirket || "")}" autocomplete="off"></div>
        <div class="alan"><label>${kacis(t("izleme.kod"))}</label><input name="kod" value="${kacis(z.kod || "")}" autocomplete="off" autocapitalize="characters"></div>
      </div>
      <div class="alan"><label>${kacis(t("izleme.link"))}</label><input name="link" type="url" value="${kacis(z.link || "")}" placeholder="https://"></div>
      <div class="alan"><label>${kacis(t("izleme.tahmini"))}</label><input name="tahmini" type="date" value="${kacis(z.tahmini || "")}"></div>
      <div class="alan"><label>${kacis(t("izleme.qeyd"))}</label><textarea name="qeyd" maxlength="500" style="min-height:56px">${kacis(z.qeyd || "")}</textarea></div>
      ${["tesdiq", "sifarisVerildi"].includes(o.durum) ? `<label class="onay" style="margin-bottom:12px"><input type="checkbox" name="yoldaEt" checked> ${kacis(t("izleme.yoldaEt"))}</label>` : ""}
      <div class="aksiyonlar">
        <button class="btn btn-kucuk" type="submit">${kacis(t("admin.kaydet"))}</button>
        <button class="btn btn-ince btn-kucuk" type="button" data-kargo-ac="${kacis(o.id)}">${kacis(t("izleme.bagla"))}</button>
      </div>
    </form>`;
  }
  return `${varMi ? `<div class="kargo-kutu" style="font-size:.85rem">
      ${z.sirket ? `<div>🚚 <b>${kacis(z.sirket)}</b></div>` : ""}
      ${z.kod ? `<div>${kacis(t("izleme.kod"))}: <b class="kod">${kacis(z.kod)}</b></div>` : ""}
      ${z.tahmini ? `<div>${kacis(t("izleme.tahmini"))}: <b>${kacis(z.tahmini.split("-").reverse().join("."))}</b></div>` : ""}
      ${z.qeyd ? `<div class="soluk" style="white-space:pre-line">${kacis(z.qeyd)}</div>` : ""}
    </div>` : ""}
    <div><button class="btn btn-ince btn-kucuk" type="button" data-kargo-ac="${kacis(o.id)}">🚚 ${kacis(t(varMi ? "izleme.kargoDuzenle" : "izleme.kargoElaveEt"))}</button></div>`;
}

/** Kargo düymələrini və formlarını bağlayır. durumDegistir: statusu tarixçə ilə dəyişən funksiya */
export function kargoBagla(kok, { siparisler, durumDegistir, yenidenCiz }) {
  $$("[data-kargo-ac]", kok).forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.kargoAc;
    acik.has(id) ? acik.delete(id) : acik.add(id);
    document.activeElement?.blur();
    yenidenCiz();
  }));
  $$("form[data-kargo]", kok).forEach((f) => f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = f.dataset.kargo;
    const link = f.link.value.trim();
    if (link && !/^https?:\/\//i.test(link)) return bildir(t("admin.urun.linkHata"), "hata");
    const izleme = {
      sirket: f.sirket.value.trim().slice(0, 60),
      kod: f.kod.value.trim().slice(0, 80),
      link: link.slice(0, 500),
      tahmini: f.tahmini.value,
      qeyd: f.qeyd.value.trim().slice(0, 500),
    };
    const btn = f.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      const o = siparisler().find((x) => x.id === id);
      // İzləmə kodu yazılıb və sifariş hələ "Qəbul edildi"-dirsə — "Yoldadır" et
      if (izleme.kod && o && ["tesdiq", "sifarisVerildi"].includes(o.durum) && f.yoldaEt?.checked) {
        await durumDegistir(id, "yolda", { izleme });
      } else {
        await updateDoc(doc(db, "siparisler", id), { izleme });
      }
      acik.delete(id);
      document.activeElement?.blur();
      bildir(t("admin.kaydedildi"), "basari");
      yenidenCiz();
    } catch (err) {
      bildir(hataMesaji(err), "hata");
      btn.disabled = false;
    }
  }));
}
