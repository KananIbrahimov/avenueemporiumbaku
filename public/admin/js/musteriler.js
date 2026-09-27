// Müştərilər: ad, soyad, sifariş sayı, uğurlu (çatdırılan), ləğv edilən, davam edən
import { db, collection, getDocs } from "../../ortak/firebase.js";
import { t } from "../../ortak/i18n.js";
import { para } from "../../ortak/fiyat.js";
import { $, $$, kacis, tarih, hataMesaji } from "../../ortak/yardim.js";
import { siparisler, siparisDinle } from "./siparisler.js";

let sirala = "sifaris";

function istatistik(uid) {
  const s = siparisler.filter((o) => o.kullaniciId === uid);
  const ugurlu = s.filter((o) => o.durum === "catdirildi");
  return {
    hamisi: s.length,
    ugurlu: ugurlu.length,
    legv: s.filter((o) => o.durum === "legv").length,
    davam: s.filter((o) => !["catdirildi", "legv"].includes(o.durum)).length,
    tutar: ugurlu.reduce((c, o) => c + o.birimFiyat * o.adet, 0),
    son: s.reduce((m, o) => Math.max(m, o.olusturma?.toMillis?.() || 0), 0),
  };
}

export async function musterilerSekmesi(ana) {
  const kok = document.createElement("div");
  ana.appendChild(kok);
  kok.innerHTML = `<p class="bos">${kacis(t("genel.yukleniyor"))}</p>`;
  let kullanicilar;
  try {
    const s = await getDocs(collection(db, "kullanicilar"));
    kullanicilar = s.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) { kok.innerHTML = `<p class="bos">${kacis(hataMesaji(e))}</p>`; return; }

  let ara = "";
  const ciz = () => {
    const q = ara.toLocaleLowerCase("az");
    const liste = kullanicilar
      .map((k) => ({ ...k, st: istatistik(k.id) }))
      .filter((k) => !q || `${k.ad} ${k.soyad} ${k.email}`.toLocaleLowerCase("az").includes(q))
      .sort({
        sifaris: (a, b) => b.st.hamisi - a.st.hamisi || b.st.son - a.st.son,
        yeni: (a, b) => (b.olusturma?.toMillis?.() || 0) - (a.olusturma?.toMillis?.() || 0),
        ad: (a, b) => `${a.ad} ${a.soyad}`.localeCompare(`${b.ad} ${b.soyad}`, "az"),
      }[sirala]);

    const cem = liste.reduce((c, k) => ({
      hamisi: c.hamisi + k.st.hamisi, ugurlu: c.ugurlu + k.st.ugurlu, legv: c.legv + k.st.legv,
    }), { hamisi: 0, ugurlu: 0, legv: 0 });

    $("#m-liste", kok).innerHTML = `
      <div class="stat-satir" style="margin-bottom:12px">
        <div class="stat"><b>${liste.length}</b><span>${kacis(t("admin.mus.musteri"))}</span></div>
        <div class="stat"><b>${cem.hamisi}</b><span>${kacis(t("admin.mus.sifaris"))}</span></div>
        <div class="stat ugurlu"><b>${cem.ugurlu}</b><span>${kacis(t("admin.mus.ugurlu"))}</span></div>
        <div class="stat legv"><b>${cem.legv}</b><span>${kacis(t("admin.mus.legv"))}</span></div>
      </div>
      ${liste.map((k) => `
        <div class="kart musteri-kart">
          <div class="ust-satir">
            <div style="min-width:0">
              <b>${kacis(k.ad)} ${kacis(k.soyad)}</b>
              ${k.rol === "admin" ? `<span class="durum durum-sifarisVerildi" style="margin-left:6px">Admin</span>` : ""}
              <div class="soluk" style="overflow:hidden;text-overflow:ellipsis"><a href="mailto:${kacis(k.email)}">${kacis(k.email)}</a></div>
              ${k.telefon ? `<div class="soluk">📞 <a href="tel:${kacis(k.telefon.replace(/[^\d+]/g, ""))}">${kacis(k.telefon)}</a>
                · <a href="https://wa.me/${kacis(((k.whatsappEyni === false && k.whatsapp) || k.telefon).replace(/\D/g, ""))}" target="_blank" rel="noopener">WhatsApp${k.whatsappEyni === false && k.whatsapp ? `: ${kacis(k.whatsapp)}` : ""}</a></div>` : ""}
            </div>
          </div>
          <div class="stat-satir">
            <div class="stat"><b>${k.st.hamisi}</b><span>${kacis(t("admin.mus.sifaris"))}</span></div>
            <div class="stat ugurlu"><b>${k.st.ugurlu}</b><span>${kacis(t("admin.mus.ugurlu"))}</span></div>
            <div class="stat legv"><b>${k.st.legv}</b><span>${kacis(t("admin.mus.legv"))}</span></div>
            <div class="stat"><b>${k.st.davam}</b><span>${kacis(t("admin.mus.davam"))}</span></div>
          </div>
          <div class="soluk" style="font-size:.8rem">
            ${kacis(t("admin.mus.kayit"))}: ${kacis(tarih(k.olusturma))}
            ${k.st.ugurlu ? ` · ${kacis(t("admin.mus.alisveris"))}: <b style="color:var(--yazi)">${para(k.st.tutar)}</b>` : ""}
          </div>
        </div>`).join("") || `<p class="bos">${kacis(t("vitrin.bos"))}</p>`}`;
  };

  kok.innerHTML = `
    <div class="bolum-ust"><h1>👥 ${kacis(t("admin.sekme.musteriler"))}</h1>
      <a class="btn btn-ince btn-kucuk" href="#ayarlar">← ${kacis(t("admin.sekme.ayarlar"))}</a></div>
    <input type="search" id="ara" placeholder="${kacis(t("filtre.ara"))}" style="margin-bottom:10px">
    <div class="cipler" style="padding-top:0">
      ${["sifaris", "yeni", "ad"].map((s) => `<button class="cip ${s === sirala ? "secili" : ""}" data-sirala="${s}">${kacis(t("admin.mus.sirala." + s))}</button>`).join("")}
    </div>
    <div class="liste" id="m-liste"></div>`;
  $("#ara", kok).addEventListener("input", (e) => { ara = e.target.value; ciz(); });
  $$("[data-sirala]", kok).forEach((b) => b.addEventListener("click", () => {
    sirala = b.dataset.sirala;
    $$("[data-sirala]", kok).forEach((x) => x.classList.toggle("secili", x === b));
    ciz();
  }));
  ciz();
  const lequ = siparisDinle(() => (kok.isConnected ? ciz() : lequ()));
}
