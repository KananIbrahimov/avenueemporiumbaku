// Müşteri listesi (ad, soyad, e-posta, kayıt tarihi, sipariş sayısı)
import { db, collection, getDocs } from "../../ortak/firebase.js";
import { t } from "../../ortak/i18n.js";
import { para } from "../../ortak/fiyat.js";
import { $, kacis, tarih, hataMesaji } from "../../ortak/yardim.js";
import { siparisler } from "./siparisler.js";

export async function musterilerSekmesi(kok) {
  kok.innerHTML = `<p class="bos">${kacis(t("genel.yukleniyor"))}</p>`;
  let kullanicilar;
  try {
    const s = await getDocs(collection(db, "kullanicilar"));
    kullanicilar = s.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.olusturma?.toMillis?.() || 0) - (a.olusturma?.toMillis?.() || 0));
  } catch (e) { kok.innerHTML = `<p class="bos">${kacis(hataMesaji(e))}</p>`; return; }

  const istatistik = (uid) => {
    const s = siparisler.filter((o) => o.kullaniciId === uid && o.durum !== "legv");
    return { adet: s.length, tutar: s.reduce((t, o) => t + o.birimFiyat * o.adet, 0) };
  };

  kok.innerHTML = `
    <div class="bolum-ust"><h1>${kacis(t("admin.sekme.musteriler"))} <span class="soluk">(${kullanicilar.length})</span></h1></div>
    <input type="search" id="ara" placeholder="${kacis(t("filtre.ara"))}" style="margin-bottom:12px;max-width:420px">
    <div class="liste" id="govde"></div>`;

  const ciz = (q = "") => {
    q = q.toLocaleLowerCase("az");
    $("#govde", kok).innerHTML = kullanicilar
      .filter((k) => !q || `${k.ad} ${k.soyad} ${k.email}`.toLocaleLowerCase("az").includes(q))
      .map((k) => {
        const s = istatistik(k.id);
        return `<div class="kart liste-oge" style="padding:14px">
          <div class="bilgi">
            <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">
              <b>${kacis(k.ad)} ${kacis(k.soyad)}</b>
              <span class="durum ${k.rol === "admin" ? "durum-sifarisVerildi" : "durum-legv"}">${kacis(t("admin.mus.rol." + (k.rol || "musteri")))}</span>
            </div>
            <div class="soluk"><a href="mailto:${kacis(k.email)}">${kacis(k.email)}</a></div>
            <div class="soluk">${kacis(t("admin.mus.kayit"))}: ${kacis(tarih(k.olusturma))}</div>
            <div class="soluk">${kacis(t("admin.sekme.siparisler"))}: <b>${s.adet}</b>${s.adet ? ` · ${para(s.tutar)}` : ""}</div>
          </div></div>`;
      }).join("");
  };
  $("#ara", kok).addEventListener("input", (e) => ciz(e.target.value));
  ciz();
}
