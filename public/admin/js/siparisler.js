// Siparişler: canlı liste, durum değiştirme, panel açıkken web bildirimi
import { db, collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "../../ortak/firebase.js";
import { t } from "../../ortak/i18n.js";
import { para, yuvarla } from "../../ortak/fiyat.js";
import { $, $$, kacis, tarih, bildir, hataMesaji, durumEtiketi, SIPARIS_DURUMLARI } from "../../ortak/yardim.js";
import { detayGetir } from "./veri.js";

export let siparisler = [];
let ilkYukleme = true;
let kok = null;          // sekme açıksa çizim yapılacak alan
let filtre = "yeni";
const baslik = document.title;

// ---------- Bildirim ----------
function ses() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.18].forEach((gecikme, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = i ? 1175 : 880; o.type = "sine";
      g.gain.setValueAtTime(0.0001, ctx.currentTime + gecikme);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + gecikme + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + gecikme + 0.3);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + gecikme); o.stop(ctx.currentTime + gecikme + 0.32);
    });
  } catch {}
}

function yeniSiparisBildir(o) {
  ses();
  bildir(t("admin.sip.yeniGeldi", { ad: o.musteriAd }), "basari");
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      const n = new Notification(t("admin.sip.bildirimBaslik"), {
        body: `${o.musteriAd} — ${o.urunAd} (${para(o.birimFiyat * o.adet)})`,
        icon: "../ikon/admin-192.png",
        tag: o.id,
      });
      n.onclick = () => { window.focus(); location.hash = "siparisler"; n.close(); };
    } catch {}
  }
}

function sayacGuncelle() {
  const n = siparisler.filter((o) => o.durum === "yeni").length;
  const el = $("#yeni-sayac");
  el.hidden = n === 0;
  el.textContent = n;
  document.title = n ? `(${n}) ${baslik}` : baslik;
}

export function siparisleriBaslat() {
  onSnapshot(
    query(collection(db, "siparisler"), orderBy("olusturma", "desc")),
    (s) => {
      siparisler = s.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (!ilkYukleme) {
        s.docChanges().forEach((c) => {
          if (c.type === "added" && c.doc.data().durum === "yeni") yeniSiparisBildir({ id: c.doc.id, ...c.doc.data() });
        });
      }
      ilkYukleme = false;
      sayacGuncelle();
      if (kok?.isConnected) ciz();
    },
    (e) => bildir(hataMesaji(e), "hata"),
  );
}

// ---------- Sekme ----------
export function siparislerSekmesi(alan) {
  kok = alan;
  ciz();
}

async function ciz() {
  const sayilar = Object.fromEntries(SIPARIS_DURUMLARI.map((d) => [d, siparisler.filter((o) => o.durum === d).length]));
  const liste = filtre === "hepsi" ? siparisler : siparisler.filter((o) => o.durum === filtre);
  const izin = "Notification" in window ? Notification.permission : "yok";

  kok.innerHTML = `
    <div class="bolum-ust">
      <h1>${kacis(t("admin.sekme.siparisler"))}</h1>
      ${izin === "default" ? `<button class="btn btn-kucuk" id="bildirim-ac">🔔 ${kacis(t("admin.sip.bildirimAc"))}</button>` : ""}
      ${izin === "denied" ? `<span class="soluk">${kacis(t("admin.sip.bildirimKapali"))}</span>` : ""}
    </div>
    <p class="ipucu" style="margin-top:-8px">${kacis(t("admin.sip.aciklama"))}</p>
    <div class="cipler">
      ${["yeni", "tesdiq", "sifarisVerildi", "yolda", "catdirildi", "legv", "hepsi"].map((d) => `
        <button class="cip ${filtre === d ? "secili" : ""}" data-filtre="${d}">
          ${kacis(d === "hepsi" ? t("filtre.tumu") : t("durum." + d))} (${d === "hepsi" ? siparisler.length : sayilar[d]})
        </button>`).join("")}
    </div>
    <div class="liste" id="sip-liste">
      ${liste.length ? liste.map(kartHtml).join("") : `<p class="bos">${kacis(t("admin.sip.bos"))}</p>`}
    </div>`;

  $("#bildirim-ac")?.addEventListener("click", async () => {
    await Notification.requestPermission();
    ciz();
  });
  $$("[data-filtre]", kok).forEach((b) => b.addEventListener("click", () => { filtre = b.dataset.filtre; ciz(); }));
  $$("[data-durum-sec]", kok).forEach((s) => s.addEventListener("change", async () => {
    try {
      await updateDoc(doc(db, "siparisler", s.dataset.durumSec), { durum: s.value });
      bildir(t("admin.kaydedildi"), "basari");
    } catch (e) { bildir(hataMesaji(e), "hata"); }
  }));
  $$("[data-sil]", kok).forEach((b) => b.addEventListener("click", async () => {
    if (!confirm(t("admin.sip.silOnay"))) return;
    try { await deleteDoc(doc(db, "siparisler", b.dataset.sil)); } catch (e) { bildir(hataMesaji(e), "hata"); }
  }));

  // Kaynak linkleri ve kâr (gizli detaylardan)
  for (const o of liste) {
    const d = await detayGetir(o.urunId).catch(() => null);
    const kutu = $(`[data-kaynak="${o.id}"]`, kok);
    if (!kutu) continue;
    if (!d) { kutu.innerHTML = `<span class="soluk">${kacis(t("admin.sip.urunSilinmis"))}</span>`; continue; }
    const maliyet = yuvarla((+d.alisFiyati || 0) + (+d.kargo || 0) + (+d.vergi || 0));
    kutu.innerHTML = `
      ${d.kaynakLink ? `<a class="btn btn-kucuk" href="${kacis(d.kaynakLink)}" target="_blank" rel="noopener noreferrer">🔗 ${kacis(t("admin.sip.kaynakAc"))}</a>` : ""}
      <span class="soluk">${kacis(t("admin.hesap.qazanc"))}: <b>${para((o.birimFiyat - maliyet) * o.adet)}</b></span>`;
  }
}

function kartHtml(o) {
  const tel = (o.telefon || "").replace(/[^\d+]/g, "");
  const wa = tel.replace(/^\+/, "");
  return `
    <div class="kart siparis-kart ${o.durum === "yeni" ? "yeni" : ""}">
      <div class="ust-satir">
        <div><b>${kacis(o.musteriAd)}</b> <span class="soluk">· ${kacis(tarih(o.olusturma))}</span></div>
        ${durumEtiketi(o.durum)}
      </div>
      <div>
        <a href="../urun.html?id=${encodeURIComponent(o.urunId)}" target="_blank" rel="noopener">${kacis(o.urunAd)}</a>
        <span class="soluk">${kacis([o.marka, o.olcu && `${t("urun.olcu")}: ${o.olcu}`, o.renk && `${t("urun.renk")}: ${o.renk}`].filter(Boolean).join(" · "))}</span>
      </div>
      <div>${o.adet} × ${para(o.birimFiyat)} = <b>${para(o.adet * o.birimFiyat)}</b></div>
      <div class="soluk">
        ✉️ <a href="mailto:${kacis(o.musteriEmail)}">${kacis(o.musteriEmail)}</a>
        ${tel ? ` · 📞 <a href="tel:${kacis(tel)}">${kacis(o.telefon)}</a> · <a href="https://wa.me/${kacis(wa)}" target="_blank" rel="noopener">WhatsApp</a>` : ""}
      </div>
      ${o.musteriNotu ? `<div class="kutu-mesaj kutu-bilgi" style="margin:0">${kacis(o.musteriNotu)}</div>` : ""}
      <div class="aksiyonlar" data-kaynak="${kacis(o.id)}"></div>
      <div class="aksiyonlar">
        <select data-durum-sec="${kacis(o.id)}">
          ${SIPARIS_DURUMLARI.map((d) => `<option value="${d}" ${d === o.durum ? "selected" : ""}>${kacis(t("durum." + d))}</option>`).join("")}
        </select>
        <button class="btn btn-link btn-kucuk" data-sil="${kacis(o.id)}">${kacis(t("admin.sil"))}</button>
      </div>
    </div>`;
}
