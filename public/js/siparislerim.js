// Müşterinin kendi siparişleri
import { db, collection, query, where, onSnapshot } from "../ortak/firebase.js";
import { t } from "../ortak/i18n.js";
import { para } from "../ortak/fiyat.js";
import { $, kacis, tarih, durumEtiketi, bildir } from "../ortak/yardim.js";
import { adimlarHtml, kargoHtml } from "../ortak/izleme-ui.js";
import { girisHazir } from "./ust.js";

const liste = $("#liste");
const { kullanici } = await girisHazir;

if (!kullanici) {
  location.href = `giris.html?geri=${encodeURIComponent(location.pathname)}`;
} else {
  onSnapshot(
    query(collection(db, "siparisler"), where("kullaniciId", "==", kullanici.uid)),
    (s) => {
      const sip = s.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.olusturma?.toMillis?.() || Date.now()) - (a.olusturma?.toMillis?.() || Date.now()));
      liste.innerHTML = sip.length
        ? sip.map((o) => `
          <div class="kart liste-oge">
            <div class="bilgi">
              <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">
                <a href="urun.html?id=${encodeURIComponent(o.urunId)}" style="font-weight:600">${kacis(o.urunAd)}</a>
                ${durumEtiketi(o.durum)}
              </div>
              <div class="soluk">${kacis([o.marka, o.olcu, o.renk].filter(Boolean).join(" · "))}</div>
              <div class="soluk">${kacis(t("urun.adet"))}: ${o.adet} × ${para(o.birimFiyat)} = <b>${para(o.adet * o.birimFiyat)}</b></div>
              <div class="soluk">${kacis(tarih(o.olusturma))}</div>
              ${o.beh != null && o.odenecek != null && o.durum !== "legv" ? `<div class="odeme-satir">
                <span>${kacis(t("siparislerim.odenib"))}: <b>${para(o.beh)}</b></span>
                <span>${kacis(t("siparislerim.qaliq"))}: <b>${para(Math.max(0, o.odenecek - o.beh))}</b></span></div>` : ""}
              <div style="margin-top:12px">${adimlarHtml(o)}</div>
              ${kargoHtml(o) ? `<div style="margin-top:10px">${kargoHtml(o)}</div>` : ""}
            </div>
          </div>`).join("")
        : `<div class="bos"><p>${kacis(t("siparislerim.bos"))}</p><a class="btn" href="./">${kacis(t("genel.vitrineDon"))}</a></div>`;
    },
    (e) => { console.error(e); liste.innerHTML = `<p class="bos">${kacis(t("hata.yukleme"))}</p>`; },
  );
}

// İzləmə koduna toxunanda kopyala
liste.addEventListener("click", async (e) => {
  const k = e.target.closest("[data-kopyala]");
  if (!k) return;
  try { await navigator.clipboard.writeText(k.dataset.kopyala); bildir(t("izleme.kodKopyalandi"), "basari"); } catch {}
});
