// Siparişler: canlı liste, durum değiştirme, panel açıkken web bildirimi
import { db, collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, arrayUnion, Timestamp } from "../../ortak/firebase.js";
import { t } from "../../ortak/i18n.js";
import { para, yuvarla } from "../../ortak/fiyat.js";
import { $, $$, kacis, tarih, bildir, hataMesaji, durumEtiketi, SIPARIS_DURUMLARI } from "../../ortak/yardim.js";
import { detayGetir } from "./veri.js";
import { adimlarHtml, IZLEME_ADIMLARI } from "../../ortak/izleme-ui.js";
import { kargoHtml, kargoBagla, kargoDatalist } from "./kargo.js";
import { maliyyePenceresi } from "./maliyye.js";

export let siparisler = [];
const dinleyiciler = new Set();

/** Sifariş siyahısı yenilənəndə çağırılır (məs. İzləmə bölməsi). Ləğv etmək üçün qaytarılan funksiyanı çağırın. */
export function siparisDinle(fn) {
  dinleyiciler.add(fn);
  return () => dinleyiciler.delete(fn);
}

/** Statusu dəyişir və tarixçəyə yazır (müştəri addımların tarixini görür) */
export function durumDegistir(id, durum, elave = {}) {
  return updateDoc(doc(db, "siparisler", id), {
    ...elave,
    durum,
    tarixce: arrayUnion({ durum, tarix: Timestamp.now() }),
  });
}
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
      dinleyiciler.forEach((fn) => { try { fn(siparisler); } catch (e) { console.error(e); } });
    },
    (e) => bildir(hataMesaji(e), "hata"),
  );
}

// ---------- Sekme ----------
export function siparislerSekmesi(ana) {
  // Ayrı konteyner: başqa bölməyə keçəndə silinir və canlı yenilənmə onu çəkmir
  kok = document.createElement("div");
  ana.appendChild(kok);
  ciz();
}

let gozleyen = false;
async function ciz() {
  // Yazı yazılarkən (kargo formu) canlı yenilənmə səhifəni üstündən yazmasın
  const ae = document.activeElement;
  if (kok.contains(ae) && /INPUT|TEXTAREA|SELECT/.test(ae.tagName)) {
    if (!gozleyen) { gozleyen = true; ae.addEventListener("blur", () => setTimeout(() => { gozleyen = false; ciz(); }, 50), { once: true }); }
    return;
  }
  // Köhnə "Sifariş verildi" statusu "Qəbul edildi" sayılır
  const esas = (d) => (d === "sifarisVerildi" ? "tesdiq" : d);
  const sayilar = Object.fromEntries(SIPARIS_DURUMLARI.map((d) => [d, siparisler.filter((o) => esas(o.durum) === d).length]));
  const liste = filtre === "hepsi" ? siparisler : siparisler.filter((o) => esas(o.durum) === filtre);
  const izin = "Notification" in window ? Notification.permission : "yok";

  kok.innerHTML = `
    <div class="bolum-ust">
      <h1>${kacis(t("admin.sekme.siparisler"))}</h1>
      ${izin === "default" ? `<button class="btn btn-kucuk" id="bildirim-ac">🔔 ${kacis(t("admin.sip.bildirimAc"))}</button>` : ""}
      ${izin === "denied" ? `<span class="soluk">${kacis(t("admin.sip.bildirimKapali"))}</span>` : ""}
    </div>
    <p class="ipucu" style="margin-top:-8px">${kacis(t("admin.sip.aciklama"))}</p>
    <div class="cipler">
      ${["yeni", "tesdiq", "yolda", "catdirildi", "legv", "hepsi"].map((d) => `
        <button class="cip ${filtre === d ? "secili" : ""}" data-filtre="${d}">
          ${kacis(d === "hepsi" ? t("filtre.tumu") : t("durum." + d))} (${d === "hepsi" ? siparisler.length : sayilar[d]})
        </button>`).join("")}
    </div>
    ${kargoDatalist()}
    <div class="liste" id="sip-liste">
      ${liste.length ? liste.map(kartHtml).join("") : `<p class="bos">${kacis(t("admin.sip.bos"))}</p>`}
    </div>`;

  $("#bildirim-ac")?.addEventListener("click", async () => {
    await Notification.requestPermission();
    ciz();
  });
  $$("[data-filtre]", kok).forEach((b) => b.addEventListener("click", () => { filtre = b.dataset.filtre; ciz(); }));
  // Növbəti mərhələ / addıma toxunma / ləğv / bərpa
  const deyis = async (id, durum, sual) => {
    if (sual && !confirm(sual)) return;
    // Yeni sifariş qəbul edilərkən maliyyə pəncərəsi açılır (alış, kargo, vergi, bəh)
    const o = siparisler.find((x) => x.id === id);
    if (durum === "tesdiq" && o?.durum === "yeni") { await maliyyePenceresi(o, { rejim: "qebul", durumDegistir }); return; }
    try {
      await durumDegistir(id, durum);
      bildir(`${t("admin.kaydedildi")}: ${t("durum." + durum)}`, "basari");
    } catch (e) { bildir(hataMesaji(e), "hata"); }
  };
  $$("[data-novbeti]", kok).forEach((b) => b.addEventListener("click", () => deyis(b.dataset.id, b.dataset.novbeti)));
  $$("[data-sip] [data-adim]", kok).forEach((b) => b.addEventListener("click", () =>
    deyis(b.closest("[data-sip]").dataset.sip, b.dataset.adim)));
  $$("[data-legv]", kok).forEach((b) => b.addEventListener("click", () => deyis(b.dataset.legv, "legv", t("izleme.legvOnay"))));
  $$("[data-berpa]", kok).forEach((b) => b.addEventListener("click", () => deyis(b.dataset.berpa, "yeni")));
  kargoBagla(kok, { siparisler: () => siparisler, durumDegistir, yenidenCiz: ciz });
  $$("[data-mal]", kok).forEach((b) => b.addEventListener("click", () => {
    const o = siparisler.find((x) => x.id === b.dataset.mal);
    if (o) maliyyePenceresi(o, { rejim: "duzelt", durumDegistir });
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
    <div class="kart siparis-kart ${o.durum === "yeni" ? "yeni" : ""} ${o.durum === "legv" ? "pasif" : ""}" data-sip="${kacis(o.id)}">
      <div class="ust-satir">
        <div><b>${kacis(o.musteriAd)}</b> <span class="soluk">· ${kacis(tarih(o.olusturma))}</span></div>
        ${durumEtiketi(o.durum)}
      </div>
      ${sebetNisani(o)}
      <div>
        <a href="../urun.html?id=${encodeURIComponent(o.urunId)}" target="_blank" rel="noopener">${kacis(o.urunAd)}</a>
        <span class="soluk">${kacis([o.marka, o.olcu && `${t("urun.olcu")}: ${o.olcu}`, o.renk && `${t("urun.renk")}: ${o.renk}`].filter(Boolean).join(" · "))}</span>
      </div>
      <div>${o.adet} × ${para(o.birimFiyat)} = <b>${para(o.adet * o.birimFiyat)}</b></div>
      ${o.beh != null && o.odenecek != null ? `<div class="odeme-satir"><span>🤝 ${kacis(t("admin.mal.beh"))}: <b>${para(o.beh)}</b></span>
        <span>⏳ ${kacis(t("admin.mal.qaliq"))}: <b>${para(o.odenecek - o.beh)}</b></span></div>` : ""}
      <div class="soluk">
        ✉️ <a href="mailto:${kacis(o.musteriEmail)}">${kacis(o.musteriEmail)}</a>
        ${tel ? ` · 📞 <a href="tel:${kacis(tel)}">${kacis(o.telefon)}</a> · <a href="https://wa.me/${kacis(wa)}" target="_blank" rel="noopener">WhatsApp</a>` : ""}
      </div>
      ${o.musteriNotu ? `<div class="kutu-mesaj kutu-bilgi" style="margin:0">${kacis(o.musteriNotu)}</div>` : ""}
      <div class="aksiyonlar" data-kaynak="${kacis(o.id)}"></div>
      ${adimlarHtml(o, { tiklanan: true })}
      ${kargoHtml(o)}
      <div class="aksiyonlar">
        ${novbetiHtml(o)}
        ${o.durum === "legv"
          ? `<button class="btn btn-ince btn-kucuk" data-berpa="${kacis(o.id)}">↺ ${kacis(t("admin.sip.berpa"))}</button>`
          : o.durum !== "catdirildi" ? `<button class="btn btn-ince btn-kucuk btn-legv" data-legv="${kacis(o.id)}">✕ ${kacis(t("izleme.legv"))}</button>` : ""}
        ${o.durum !== "yeni" ? `<button class="btn btn-ince btn-kucuk" data-mal="${kacis(o.id)}">💰 ${kacis(t("admin.mal.duzelt"))}</button>` : ""}
        <button class="btn btn-link btn-kucuk" data-sil="${kacis(o.id)}" style="margin-left:auto">${kacis(t("admin.sil"))}</button>
      </div>
    </div>`;
}

/** Növbəti mərhələyə keçid düyməsi: Yeni → Qəbul et → Yola sal → Çatdırıldı */
function novbetiHtml(o) {
  const cari = o.durum === "sifarisVerildi" ? "tesdiq" : o.durum;
  const i = IZLEME_ADIMLARI.indexOf(cari);
  if (i < 0 || i >= IZLEME_ADIMLARI.length - 1) return "";
  const novbeti = IZLEME_ADIMLARI[i + 1];
  return `<button class="btn btn-kucuk" data-novbeti="${novbeti}" data-id="${kacis(o.id)}">${kacis(t("admin.sip.kec." + novbeti))} →</button>`;
}

/** Eyni səbətdən gələn sifarişlər: "Səbət #ABC · 2/3" */
function sebetNisani(o) {
  if (!o.sebetId) return "";
  const hamisi = siparisler.filter((x) => x.sebetId === o.sebetId);
  if (hamisi.length < 2) return "";
  const sira = hamisi.slice().reverse().findIndex((x) => x.id === o.id) + 1;
  const cem = hamisi.reduce((c, x) => c + x.birimFiyat * x.adet, 0);
  return `<div class="soluk" style="font-size:.8rem">🛍️ ${kacis(t("admin.sip.sebet"))} <b class="kod">#${kacis(o.sebetId)}</b> · ${sira}/${hamisi.length} · ${kacis(t("urun.toplam"))}: <b>${para(cem)}</b></div>`;
}
