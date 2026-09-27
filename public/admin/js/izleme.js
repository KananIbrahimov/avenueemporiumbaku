// Sifariş izləmə: təsdiqlənmiş sifarişlərin mərhələləri + kargo məlumatı (müştəri də görür)
import { db, doc, updateDoc } from "../../ortak/firebase.js";
import { t } from "../../ortak/i18n.js";
import { para } from "../../ortak/fiyat.js";
import { $, $$, kacis, tarih, bildir, hataMesaji } from "../../ortak/yardim.js";
import { adimlarHtml, IZLEME_ADIMLARI } from "../../ortak/izleme-ui.js";
import { siparisler, siparisDinle, durumDegistir } from "./siparisler.js";
import { detayGetir } from "./veri.js";

const KARGO_SIRKETLERI = [
  "Trendyol Express", "Yurtiçi Kargo", "Aras Kargo", "MNG Kargo", "PTT Kargo",
  "DHL", "UPS", "FedEx", "TNT", "Azərpoçt", "Camex", "AzerExpress", "Kolli", "Ailexpress",
];
const FILTRLER = {
  aktiv: (o) => ["tesdiq", "sifarisVerildi", "yolda"].includes(o.durum),
  catdirildi: (o) => o.durum === "catdirildi",
  hamisi: (o) => o.durum !== "yeni",
};

let filtre = "aktiv";
const acik = new Set(); // kargo formu açıq olan sifarişlər

export function izlemeSekmesi(ana) {
  // Ayrı konteyner: başqa bölməyə keçəndə silinir (isConnected=false) və dinləmə dayanır
  const kok = document.createElement("div");
  ana.appendChild(kok);
  let gozleyen = false;
  const ciz = () => {
    // İstifadəçi yazı yazarkən səhifəni yenidən çəkmə
    if (kok.contains(document.activeElement) && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
      gozleyen = true;
      return;
    }
    gozleyen = false;
    cizDahili(kok);
  };
  const lequ = siparisDinle(() => (kok.isConnected ? ciz() : lequ()));
  kok.addEventListener("focusout", () => setTimeout(() => { if (gozleyen) ciz(); }, 50));
  ciz();
}

function cizDahili(kok) {
  const say = Object.fromEntries(Object.entries(FILTRLER).map(([k, f]) => [k, siparisler.filter(f).length]));
  const liste = siparisler.filter(FILTRLER[filtre]);

  kok.innerHTML = `
    <div class="bolum-ust"><h1>${kacis(t("admin.sekme.izleme"))}</h1></div>
    <p class="ipucu" style="margin-top:-8px">${kacis(t("izleme.aciklama"))}</p>
    <div class="cipler">
      ${Object.keys(FILTRLER).map((k) => `<button class="cip ${k === filtre ? "secili" : ""}" data-filtre="${k}">
        ${kacis(t("izleme.filtre." + k))} (${say[k]})</button>`).join("")}
    </div>
    <datalist id="kargolar">${KARGO_SIRKETLERI.map((k) => `<option value="${kacis(k)}">`).join("")}</datalist>
    <div class="liste">
      ${liste.length ? liste.map(kartHtml).join("") : `<p class="bos">${kacis(t(filtre === "aktiv" ? "izleme.bosAktiv" : "admin.sip.bos"))}</p>`}
    </div>`;

  $$("[data-filtre]", kok).forEach((b) => b.addEventListener("click", () => { filtre = b.dataset.filtre; cizDahili(kok); }));

  // Addıma klik → status dəyişir
  $$("[data-sip] [data-adim]", kok).forEach((b) => b.addEventListener("click", async () => {
    const id = b.closest("[data-sip]").dataset.sip;
    try {
      await durumDegistir(id, b.dataset.adim);
      bildir(`${t("admin.kaydedildi")}: ${t("durum." + b.dataset.adim)}`, "basari");
    } catch (e) { bildir(hataMesaji(e), "hata"); }
  }));

  // Kargo formunu aç/bağla
  $$("[data-ac]", kok).forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.ac;
    acik.has(id) ? acik.delete(id) : acik.add(id);
    cizDahili(kok);
  }));

  // Kargo məlumatını yadda saxla
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
      const o = siparisler.find((x) => x.id === id);
      // Kod yazılıb, amma hələ "Yolda" deyilsə — birbaşa "Yolda" et
      if (izleme.kod && o && ["tesdiq", "sifarisVerildi"].includes(o.durum) && f.yoldaEt?.checked) {
        await durumDegistir(id, "yolda", { izleme });
      } else {
        await updateDoc(doc(db, "siparisler", id), { izleme });
      }
      acik.delete(id);
      document.activeElement?.blur();
      bildir(t("admin.kaydedildi"), "basari");
    } catch (err) {
      bildir(hataMesaji(err), "hata");
      btn.disabled = false;
    }
  }));

  // Ləğv et
  $$("[data-legv]", kok).forEach((b) => b.addEventListener("click", async () => {
    if (!confirm(t("izleme.legvOnay"))) return;
    try { await durumDegistir(b.dataset.legv, "legv"); } catch (e) { bildir(hataMesaji(e), "hata"); }
  }));

  // Kaynaq linkləri (gizli detallardan)
  for (const o of liste) {
    detayGetir(o.urunId).then((d) => {
      const yer = $(`[data-kaynaq="${o.id}"]`, kok);
      if (yer && d?.kaynakLink) yer.innerHTML = `<a href="${kacis(d.kaynakLink)}" target="_blank" rel="noopener noreferrer">🔗 ${kacis(t("admin.sip.kaynakAc"))}</a>`;
    }).catch(() => {});
  }
}

function kartHtml(o) {
  const z = o.izleme || {};
  const acilib = acik.has(o.id);
  const kargoVar = z.sirket || z.kod || z.link || z.tahmini;
  const aktivMi = FILTRLER.aktiv(o);
  return `
    <div class="kart siparis-kart" data-sip="${kacis(o.id)}">
      <div class="ust-satir">
        <div><b>${kacis(o.musteriAd)}</b> <span class="soluk">· ${kacis(tarih(o.olusturma))}</span></div>
        <b>${para(o.adet * o.birimFiyat)}</b>
      </div>
      <div class="soluk">${kacis(o.urunAd)} · ${kacis([o.olcu, o.renk].filter(Boolean).join(" · "))}${o.adet > 1 ? ` · ×${o.adet}` : ""}
        <span data-kaynaq="${kacis(o.id)}"></span></div>
      ${adimlarHtml(o, { tiklanan: true })}
      ${kargoVar && !acilib ? `<div class="kargo-kutu" style="font-size:.84rem">
        ${z.sirket ? `<div>🚚 <b>${kacis(z.sirket)}</b></div>` : ""}
        ${z.kod ? `<div>${kacis(t("izleme.kod"))}: <b class="kod">${kacis(z.kod)}</b></div>` : ""}
        ${z.tahmini ? `<div>${kacis(t("izleme.tahmini"))}: <b>${kacis(z.tahmini.split("-").reverse().join("."))}</b></div>` : ""}
      </div>` : ""}
      ${acilib ? `
        <form data-kargo="${kacis(o.id)}" class="kargo-form">
          <div class="satir">
            <div class="alan"><label>${kacis(t("izleme.sirket"))}</label><input name="sirket" list="kargolar" value="${kacis(z.sirket || "")}" autocomplete="off"></div>
            <div class="alan"><label>${kacis(t("izleme.kod"))}</label><input name="kod" value="${kacis(z.kod || "")}" autocomplete="off" autocapitalize="characters"></div>
          </div>
          <div class="alan"><label>${kacis(t("izleme.link"))}</label><input name="link" type="url" value="${kacis(z.link || "")}" placeholder="https://"></div>
          <div class="alan"><label>${kacis(t("izleme.tahmini"))}</label><input name="tahmini" type="date" value="${kacis(z.tahmini || "")}"></div>
          <div class="alan"><label>${kacis(t("izleme.qeyd"))}</label><textarea name="qeyd" maxlength="500" style="min-height:60px">${kacis(z.qeyd || "")}</textarea></div>
          ${["tesdiq", "sifarisVerildi"].includes(o.durum) ? `<label class="onay" style="margin-bottom:12px"><input type="checkbox" name="yoldaEt" checked> ${kacis(t("izleme.yoldaEt"))}</label>` : ""}
          <div class="aksiyonlar">
            <button class="btn btn-kucuk" type="submit">${kacis(t("admin.kaydet"))}</button>
            <button class="btn btn-ince btn-kucuk" type="button" data-ac="${kacis(o.id)}">${kacis(t("izleme.bagla"))}</button>
          </div>
        </form>` : `
        <div class="aksiyonlar">
          <button class="btn btn-ince btn-kucuk" type="button" data-ac="${kacis(o.id)}">🚚 ${kacis(t(kargoVar ? "izleme.kargoDuzenle" : "izleme.kargoElaveEt"))}</button>
          ${aktivMi ? `<button class="btn btn-ince btn-kucuk btn-legv" type="button" data-legv="${kacis(o.id)}">✕ ${kacis(t("izleme.legv"))}</button>` : ""}
          ${o.telefon ? `<a class="btn btn-link btn-kucuk" href="https://wa.me/${kacis(o.telefon.replace(/\D/g, ""))}" target="_blank" rel="noopener">WhatsApp</a>` : ""}
        </div>`}
    </div>`;
}

export { IZLEME_ADIMLARI };
