// Admin → Ayarlar: hesab, görünüş (tema), Instagram mətni şablonu, ehtiyat nüsxə
import { auth, db, doc, getDoc, setDoc, signOut, profilGetir, serverTimestamp } from "../../ortak/firebase.js";
import { t } from "../../ortak/i18n.js";
import { $, kacis, bildir, hataMesaji } from "../../ortak/yardim.js";
import { yedekBolumu } from "./yedek.js";
import { imzaHtml } from "../../ortak/surum.js";
import { VARSAYILAN_SABLON, SABLON_ACARLARI } from "./instagram.js";
import { VALYUTALAR, SIMGE, teyinliKurslar, kurslariYaz, bazarKurslari } from "./kurs.js";

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

      <div class="bolum-baslik">💱 ${kacis(t("admin.kurs.baslik"))}</div>
      <form class="kart" id="kurs-form">
        <p class="ipucu" style="margin-top:0">${kacis(t("admin.kurs.aciklama"))}</p>
        <div class="kurs-izgara" id="kurs-izgara"><p class="soluk">${kacis(t("genel.yukleniyor"))}</p></div>
        <button class="btn btn-kucuk" type="submit" style="margin-top:12px">${kacis(t("admin.kaydet"))}</button>
      </form>

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
      ${imzaHtml()}
    </div>`;

  yedekBolumu($("#yedek", kok));
  kursBolumu($("#kurs-form", kok));

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

// Valyuta kursları: 1 USD = 1.70 ₼ kimi; məhsul formunda alış qiyməti bununla manata çevrilir
async function kursBolumu(form) {
  const teyin = await teyinliKurslar();
  const izgara = form.querySelector("#kurs-izgara");
  izgara.innerHTML = VALYUTALAR.filter((v) => v !== "AZN").map((v) => `
    <label class="kurs-oge">
      <span class="kurs-ad">1 ${v} <span class="soluk">${kacis(SIMGE[v] || "")}</span></span>
      <span class="kurs-giris"><input name="${v}" inputmode="decimal" placeholder="—" value="${kacis(teyin[v] ?? "")}"><span>₼</span></span>
      <span class="ipucu" data-bazar="${v}"></span>
    </label>`).join("");
  bazarKurslari().then((b) => {
    if (!b) return;
    for (const v of VALYUTALAR) {
      const el = izgara.querySelector(`[data-bazar="${v}"]`);
      if (el && b[v]) el.textContent = `${t("admin.kurs.bazar")}: ${b[v]}`;
    }
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const kurs = {};
    for (const v of VALYUTALAR) {
      if (v === "AZN") continue;
      const x = parseFloat(String(form.elements[v].value).replace(",", "."));
      if (x > 0) kurs[v] = Math.round(x * 10000) / 10000;
    }
    try { await kurslariYaz(kurs); bildir(t("admin.kaydedildi"), "basari"); }
    catch (err) { bildir(hataMesaji(err), "hata"); }
  });
}
