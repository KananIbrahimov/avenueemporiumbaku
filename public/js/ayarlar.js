// Mağaza → Ayarlar: hesab, görünüş (tema), dil
import { auth, db, doc, updateDoc, signOut, sendEmailVerification } from "../ortak/firebase.js";
import { MAGAZA_URL } from "../ortak/ayarlar.js";
import { t, DILLER, dil, dilDegistir } from "../ortak/i18n.js";
import { $, kacis, bildir, hataMesaji } from "../ortak/yardim.js";
import { girisDinle } from "./ust.js";
import { imzaHtml } from "../ortak/surum.js";

$("#imza").innerHTML = imzaHtml();

if (DILLER.length > 1) {
  $("#dil-alan").hidden = false;
  $("#dil-sec").innerHTML = DILLER.map((d) => `<option value="${d.kod}" ${d.kod === dil() ? "selected" : ""}>${kacis(d.ad)}</option>`).join("");
  $("#dil-sec").addEventListener("change", (e) => dilDegistir(e.target.value));
}

girisDinle(({ kullanici, profil, uye }) => {
  const kok = $("#hesab-bolum");
  if (!kullanici) {
    kok.innerHTML = `
      <p style="margin-top:0">${kacis(t("ayarlar.girisYok"))}</p>
      <div style="display:grid;gap:10px">
        <a class="btn btn-tam" href="giris.html">${kacis(t("nav.giris"))}</a>
        <a class="btn btn-ince btn-tam" href="kayit.html">${kacis(t("nav.kayit"))}</a>
      </div>`;
    return;
  }
  kok.innerHTML = `
    <div class="ayar-satir" style="padding-top:0">
      <div><b>${kacis(profil ? `${profil.ad} ${profil.soyad}` : kullanici.displayName || "")}</b>
        <div class="soluk">${kacis(kullanici.email)}</div></div>
      <span class="durum ${uye ? "durum-catdirildi" : "durum-yeni"}">${kacis(t(uye ? "ayarlar.uye" : "ayarlar.tesdiqsiz"))}</span>
    </div>
    ${uye ? "" : `<div class="ayar-satir"><span class="soluk">${kacis(t("dogrula.gerekli"))}</span>
      <button class="btn btn-ince btn-kucuk" id="tekrar">${kacis(t("dogrula.tekrarGonder"))}</button></div>`}
    ${profil ? `
    <form id="profil-form" class="ayar-satir" style="display:block">
      <div class="satir">
        <div class="alan" style="margin:0"><label>${kacis(t("alan.ad"))}</label><input name="ad" maxlength="50" value="${kacis(profil.ad)}"></div>
        <div class="alan" style="margin:0"><label>${kacis(t("alan.soyad"))}</label><input name="soyad" maxlength="50" value="${kacis(profil.soyad)}"></div>
      </div>
      <button class="btn btn-ince btn-kucuk" style="margin-top:10px">${kacis(t("admin.kaydet"))}</button>
    </form>` : ""}
    <div class="ayar-satir">
      <a href="siparislerim.html">${kacis(t("nav.siparislerim"))}</a>
      <button class="btn btn-ince btn-kucuk" id="cikis">${kacis(t("nav.cikis"))}</button>
    </div>`;

  $("#cikis").addEventListener("click", async () => { await signOut(auth); location.href = "./"; });
  $("#tekrar")?.addEventListener("click", async () => {
    try {
      await sendEmailVerification(kullanici, { url: `${MAGAZA_URL || location.origin}/giris.html` });
      bildir(t("dogrula.gonderildi"), "basari");
    } catch (e) { bildir(hataMesaji(e), "hata"); }
  });
  $("#profil-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const ad = e.target.ad.value.trim(), soyad = e.target.soyad.value.trim();
    if (!ad || !soyad) return bildir(t("hata.bosAlan"), "hata");
    try {
      await updateDoc(doc(db, "kullanicilar", kullanici.uid), { ad, soyad });
      bildir(t("admin.kaydedildi"), "basari");
    } catch (err) { bildir(hataMesaji(err), "hata"); }
  });
});
