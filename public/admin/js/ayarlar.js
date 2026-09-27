// Admin → Ayarlar: hesab, görünüş (tema), Instagram mətni şablonu, ehtiyat nüsxə
import { auth, db, doc, getDoc, setDoc, signOut, profilGetir, serverTimestamp } from "../../ortak/firebase.js";
import { t } from "../../ortak/i18n.js";
import { $, kacis, bildir, hataMesaji } from "../../ortak/yardim.js";
import { yedekBolumu } from "./yedek.js";
import { VARSAYILAN_SABLON, SABLON_ACARLARI } from "./instagram.js";

export async function ayarlarSekmesi(kok) {
  kok.innerHTML = `
    <div class="bolum-ust"><h1>${kacis(t("admin.sekme.ayarlar"))}</h1></div>
    <div style="max-width:640px">
      <div class="bolum-baslik">${kacis(t("ayarlar.hesab"))}</div>
      <div class="kart" id="hesab"><p class="soluk">${kacis(t("genel.yukleniyor"))}</p></div>

      <div class="bolum-baslik">${kacis(t("admin.ayar.magaza"))}</div>
      <div class="kart" style="padding:4px 18px">
        <a class="ayar-satir" href="#urunler" style="text-decoration:none"><span>🏷️ ${kacis(t("admin.urun.siyahi"))}</span><span class="soluk">›</span></a>
        <a class="ayar-satir" href="#kategoriler" style="text-decoration:none"><span>🗂️ ${kacis(t("admin.sekme.kategoriler"))}</span><span class="soluk">›</span></a>
      </div>

      <div class="bolum-baslik">Instagram</div>
      <form class="kart" id="ig-form">
        <div class="alan"><label>${kacis(t("admin.ig.sablon"))}</label>
          <textarea name="sablon" style="min-height:230px;font-size:14px"></textarea>
          <div class="ipucu">${kacis(t("admin.ig.sablonIpucu"))} ${SABLON_ACARLARI.map((a) => `<code>{${a}}</code>`).join(" ")}</div>
        </div>
        <div class="aksiyonlar">
          <button class="btn btn-kucuk" type="submit">${kacis(t("admin.kaydet"))}</button>
          <button class="btn btn-ince btn-kucuk" type="button" id="ig-sifirla">${kacis(t("admin.ig.sifirla"))}</button>
        </div>
      </form>

      <div class="bolum-baslik">${kacis(t("admin.sekme.yedek"))}</div>
      <div id="yedek"></div>
    </div>`;

  yedekBolumu($("#yedek", kok));

  // Hesab
  const u = auth.currentUser;
  const p = u ? await profilGetir(u.uid).catch(() => null) : null;
  $("#hesab", kok).innerHTML = `
    <div class="ayar-satir" style="padding-top:0">
      <div><b>${kacis(p ? `${p.ad} ${p.soyad}` : "")}</b><div class="soluk">${kacis(u?.email || "")}</div></div>
      <span class="durum durum-sifarisVerildi">Admin</span>
    </div>
    <div class="ayar-satir" style="padding-bottom:0">
      <a href="../" target="_blank" rel="noopener">${kacis(t("admin.magazaAc"))}</a>
      <button class="btn btn-ince btn-kucuk" id="cikis">${kacis(t("nav.cikis"))}</button>
    </div>`;
  $("#cikis", kok).addEventListener("click", async () => { await signOut(auth); location.replace("./"); });

  // Instagram şablonu (Firestore: ayarlar/instagram — bütün cihazlarda eyni)
  const form = $("#ig-form", kok);
  try {
    const s = await getDoc(doc(db, "ayarlar", "instagram"));
    form.sablon.value = (s.exists() && s.data().sablon) || VARSAYILAN_SABLON;
  } catch { form.sablon.value = VARSAYILAN_SABLON; }
  $("#ig-sifirla", kok).addEventListener("click", () => { form.sablon.value = VARSAYILAN_SABLON; });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "ayarlar", "instagram"), { sablon: form.sablon.value.slice(0, 3000), guncelleme: serverTimestamp() });
      bildir(t("admin.kaydedildi"), "basari");
    } catch (err) { bildir(hataMesaji(err), "hata"); }
  });
}
