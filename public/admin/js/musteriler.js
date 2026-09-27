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
    <input type="search" id="ara" placeholder="${kacis(t("filtre.ara"))}" style="margin-bottom:12px;max-width:320px">
    <div class="kart" style="padding:8px"><div class="tablo-kap"><table>
      <thead><tr><th>${kacis(t("alan.ad"))}</th><th>${kacis(t("alan.email"))}</th><th>${kacis(t("admin.mus.kayit"))}</th>
        <th>${kacis(t("admin.sekme.siparisler"))}</th><th>${kacis(t("admin.mus.rol"))}</th></tr></thead>
      <tbody id="govde"></tbody></table></div></div>`;

  const ciz = (q = "") => {
    q = q.toLocaleLowerCase("az");
    $("#govde", kok).innerHTML = kullanicilar
      .filter((k) => !q || `${k.ad} ${k.soyad} ${k.email}`.toLocaleLowerCase("az").includes(q))
      .map((k) => {
        const s = istatistik(k.id);
        return `<tr>
          <td><b>${kacis(k.ad)} ${kacis(k.soyad)}</b></td>
          <td><a href="mailto:${kacis(k.email)}">${kacis(k.email)}</a></td>
          <td>${kacis(tarih(k.olusturma))}</td>
          <td>${s.adet}${s.adet ? ` <span class="soluk">· ${para(s.tutar)}</span>` : ""}</td>
          <td>${kacis(t("admin.mus.rol." + (k.rol || "musteri")))}</td></tr>`;
      }).join("");
  };
  $("#ara", kok).addEventListener("input", (e) => ciz(e.target.value));
  ciz();
}
