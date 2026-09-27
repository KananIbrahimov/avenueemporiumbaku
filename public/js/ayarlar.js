// Mağaza → Ayarlar: Hesab (ad, soyad, telefon, WhatsApp, e-poçt), Şifrəni dəyiş, Görünüş (Qaranlıq/Açıq), dil, çıxış
import {
  auth, db, doc, updateDoc, signOut, sendEmailVerification,
  EmailAuthProvider, reauthenticateWithCredential, updatePassword,
} from "../ortak/firebase.js";
import { MAGAZA_URL } from "../ortak/ayarlar.js";
import { t, DILLER, dil, dilDegistir } from "../ortak/i18n.js";
import { $, kacis, bildir, hataMesaji, sifreKontrol } from "../ortak/yardim.js";
import { temaAyarlari } from "../ortak/tema.js";
import { girisDinle } from "./ust.js";
import { imzaHtml } from "../ortak/surum.js";

$("#imza").innerHTML = imzaHtml();
temaAyarlari($("#tema-bolum"));

if (DILLER.length > 1) {
  $("#dil-alan").hidden = false;
  $("#dil-sec").innerHTML = DILLER.map((d) => `<option value="${d.kod}" ${d.kod === dil() ? "selected" : ""}>${kacis(d.ad)}</option>`).join("");
  $("#dil-sec").addEventListener("change", (e) => dilDegistir(e.target.value));
}

const telefonDuzmu = (s) => s.replace(/\D/g, "").length >= 7;

girisDinle(({ kullanici, profil, uye }) => {
  const kok = $("#hesab-bolum");
  const girisli = !!kullanici;
  $("#sifre-alan").hidden = !girisli;
  $("#diger-alan").hidden = !girisli;
  $("#cixis").hidden = !girisli;

  if (!girisli) {
    kok.innerHTML = `
      <p style="margin-top:0">${kacis(t("ayarlar.girisYok"))}</p>
      <div style="display:grid;gap:10px">
        <a class="btn btn-tam" href="giris.html">${kacis(t("nav.giris"))}</a>
        <a class="btn btn-ince btn-tam" href="kayit.html">${kacis(t("nav.kayit"))}</a>
      </div>`;
    return;
  }

  const p = profil || {};
  let yedekTel = "";
  try { yedekTel = localStorage.getItem("telefon") || ""; } catch {}
  const tel = p.telefon || yedekTel;
  const waEyni = p.whatsappEyni !== false; // standart: eyni nömrə
  kok.innerHTML = `
    <div class="ayar-satir" style="padding-top:0">
      <span class="soluk">${kacis(t("ayarlar.status"))}</span>
      <span class="durum ${uye ? "durum-catdirildi" : "durum-yeni"}">${kacis(t(uye ? "ayarlar.uye" : "ayarlar.tesdiqsiz"))}</span>
    </div>
    ${uye ? "" : `<div class="ayar-satir"><span class="soluk" style="font-size:.82rem">${kacis(t("dogrula.gerekli"))}</span>
      <button class="btn btn-ince btn-kucuk" id="tekrar">${kacis(t("dogrula.tekrarGonder"))}</button></div>`}
    <form id="profil-form" novalidate style="padding-top:12px">
      <div class="satir">
        <div class="alan"><label>${kacis(t("alan.ad"))}</label><input name="ad" maxlength="50" autocomplete="given-name" value="${kacis(p.ad || "")}"></div>
        <div class="alan"><label>${kacis(t("alan.soyad"))}</label><input name="soyad" maxlength="50" autocomplete="family-name" value="${kacis(p.soyad || "")}"></div>
      </div>
      <div class="alan"><label>📞 ${kacis(t("ayarlar.telefon"))}</label>
        <input name="telefon" type="tel" autocomplete="tel" placeholder="+994 50 000 00 00" value="${kacis(tel)}"></div>
      <label class="onay" style="margin-bottom:12px"><input type="checkbox" name="waEyni" ${waEyni ? "checked" : ""}> ${kacis(t("ayarlar.waEyni"))}</label>
      <div class="alan" id="wa-alan" ${waEyni ? "hidden" : ""}><label>💬 ${kacis(t("ayarlar.whatsapp"))}</label>
        <input name="whatsapp" type="tel" placeholder="+994 50 000 00 00" value="${kacis(p.whatsapp || "")}"></div>
      <div class="alan"><label>✉️ ${kacis(t("alan.email"))}</label>
        <input value="${kacis(kullanici.email)}" readonly disabled class="kilidli">
        <div class="ipucu">${kacis(t("ayarlar.emailDeyismir"))}</div></div>
      <button class="btn" type="submit">${kacis(t("admin.kaydet"))}</button>
    </form>`;

  const form = $("#profil-form");
  form.waEyni.addEventListener("change", () => { $("#wa-alan").hidden = form.waEyni.checked; });

  $("#tekrar")?.addEventListener("click", async () => {
    try {
      await sendEmailVerification(kullanici, { url: `${MAGAZA_URL || location.origin}/giris.html` });
      bildir(t("dogrula.gonderildi"), "basari");
    } catch (e) { bildir(hataMesaji(e), "hata"); }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const ad = form.ad.value.trim(), soyad = form.soyad.value.trim();
    const telefon = form.telefon.value.trim();
    const eyni = form.waEyni.checked;
    const whatsapp = eyni ? "" : form.whatsapp.value.trim();
    if (!ad || !soyad) return bildir(t("hata.bosAlan"), "hata");
    if (telefon && !telefonDuzmu(telefon)) return bildir(t("urun.telefonHata"), "hata");
    if (!eyni && !telefonDuzmu(whatsapp)) return bildir(t("ayarlar.waHata"), "hata");
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      await updateDoc(doc(db, "kullanicilar", kullanici.uid), { ad, soyad, telefon, whatsapp, whatsappEyni: eyni });
      try { if (telefon) localStorage.setItem("telefon", telefon); } catch {}
      Object.assign(p, { ad, soyad, telefon, whatsapp, whatsappEyni: eyni });
      bildir(t("admin.kaydedildi"), "basari");
    } catch (err) { bildir(hataMesaji(err), "hata"); }
    btn.disabled = false;
  });
});

// Şifrəni dəyiş: hazırkı şifrə ilə təsdiq + yeni şifrə 2 dəfə
$("#sifre-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const u = auth.currentUser;
  if (!u) return;
  const hazirki = $("#s-hazirki").value, yeni = $("#s-yeni").value, yeni2 = $("#s-yeni2").value;
  if (!hazirki || !yeni || !yeni2) return bildir(t("hata.bosAlan"), "hata");
  const eksik = sifreKontrol(yeni);
  if (eksik.length) return bildir(`${t("sifre.eksik")} ${eksik.join(", ")}`, "hata");
  if (yeni !== yeni2) return bildir(t("hata.sifreUyusmuyor"), "hata");
  if (yeni === hazirki) return bildir(t("ayarlar.sifreEyni"), "hata");
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, hazirki));
    await updatePassword(u, yeni);
    e.target.reset();
    bildir(t("ayarlar.sifreDeyisdi"), "basari");
  } catch (err) {
    bildir(["auth/invalid-credential", "auth/wrong-password"].includes(err?.code) ? t("ayarlar.sifreYanlis") : hataMesaji(err), "hata");
  }
  btn.disabled = false;
});

$("#cixis").addEventListener("click", async () => {
  if (!confirm(t("ayarlar.cixisOnay"))) return;
  await signOut(auth);
  location.href = "./";
});
