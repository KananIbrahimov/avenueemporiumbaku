// Admin → Ayarlar: sadə menyu. Hesab · Görünüş və təhlükəsizlik · Mağaza siyahıları · Alətlər (ayrı səhifələr) · Çıxış
import { auth, db, doc, getDoc, setDoc, signOut, profilGetir, serverTimestamp } from "../../ortak/firebase.js";
import { t } from "../../ortak/i18n.js";
import { $, kacis, bildir, hataMesaji } from "../../ortak/yardim.js";
import { yedekBolumu } from "./yedek.js";
import { imzaHtml } from "../../ortak/surum.js";
import { temaAyarlari } from "../../ortak/tema.js";
import { kilitAyari } from "../../ortak/kilit.js";
import { siyahiSaylari } from "./siyahi-sehife.js";
import { VARSAYILAN_SABLON, SABLON_ACARLARI } from "./instagram.js";
import { VALYUTALAR, SIMGE, teyinliKurslar, kurslariYaz, bazarKurslari } from "./kurs.js";

const satir = (href, ikon, metin, say = "") =>
  `<a class="ayar-satir" href="${href}"><span>${ikon} ${kacis(metin)}</span><span class="soluk">${say} ›</span></a>`;

const geriBasliq = (ikon, basliq) => `
  <div class="bolum-ust">
    <h1>${ikon} ${kacis(basliq)}</h1>
    <a class="btn btn-ince btn-kucuk" href="#ayarlar">← ${kacis(t("admin.sekme.ayarlar"))}</a>
  </div>`;

export async function ayarlarSekmesi(kok) {
  kok.innerHTML = `
    <div class="bolum-ust"><h1>${kacis(t("admin.sekme.ayarlar"))}</h1></div>
    <div class="ayar-kap">
      <div class="bolum-baslik">👤 ${kacis(t("ayarlar.hesab"))}</div>
      <div class="kart" id="hesab"><p class="soluk">${kacis(t("genel.yukleniyor"))}</p></div>

      <div class="bolum-baslik">🎨 ${kacis(t("ayarlar.gorunus"))}</div>
      <div class="kart" id="tema"></div>

      <div class="bolum-baslik">🔐 ${kacis(t("kilit.baslik"))}</div>
      <div class="kart" id="kilit"></div>

      <div class="bolum-baslik">${kacis(t("admin.ayar.magaza"))}</div>
      <div class="kart menyu-kart">
        ${satir("#musteriler", "👥", t("admin.sekme.musteriler"))}
        ${satir("#urunler", "🛍️", t("admin.urun.siyahi"))}
        ${satir("#kategoriler", "🗂️", t("admin.sekme.kategoriler"), `<span data-say="kategoriler"></span>`)}
        ${satir("#markalar", "🏷️", t("admin.siyahi.markalar"), `<span data-say="markalar"></span>`)}
        ${satir("#olculer", "📏", t("admin.siyahi.olculer"), `<span data-say="olculer"></span>`)}
        ${satir("#renkler", "🎨", t("admin.siyahi.renkler"), `<span data-say="renkler"></span>`)}
      </div>

      <div class="bolum-baslik">${kacis(t("admin.ayar.aletler"))}</div>
      <div class="kart menyu-kart">
        ${satir("#kurslar", "💱", t("admin.kurs.baslik"), `<span id="kurs-qisa"></span>`)}
        ${satir("#instagram", "📸", t("admin.ig.sablonBaslik"))}
        ${satir("#yedek", "💾", t("admin.sekme.yedek"))}
      </div>

      <button type="button" class="btn btn-ince btn-tam cixis-btn" id="cixis">⎋ ${kacis(t("nav.cikis"))}</button>
      ${imzaHtml()}
    </div>`;

  temaAyarlari($("#tema", kok));
  kilitAyari($("#kilit", kok), () => auth.currentUser?.email || "AvenueBaku Admin");
  $("#cixis", kok).addEventListener("click", async () => {
    if (!confirm(t("admin.cixisOnay"))) return;
    await signOut(auth);
    location.replace("./");
  });
  siyahiSaylari().then((say) => {
    for (const [k, n] of Object.entries(say)) { const el = kok.querySelector(`[data-say="${k}"]`); if (el) el.textContent = n; }
  }).catch(() => {});
  teyinliKurslar().then((k) => {
    const el = $("#kurs-qisa", kok);
    if (el) el.textContent = ["USD", "EUR"].filter((v) => k[v]).map((v) => `${v} ${k[v]}`).join(" · ");
  }).catch(() => {});

  const u = auth.currentUser;
  const p = u ? await profilGetir(u.uid).catch(() => null) : null;
  const h = $("#hesab", kok);
  if (h) h.innerHTML = `
    <div class="ayar-satir" style="padding:0;border:0">
      <div style="min-width:0"><b>${kacis(p ? `${p.ad} ${p.soyad}` : "")}</b>
        <div class="soluk" style="overflow:hidden;text-overflow:ellipsis">${kacis(u?.email || "")}</div></div>
      <span class="durum durum-sifarisVerildi">Admin</span>
    </div>`;
}

// ---------- Valyuta kursları (ayrı səhifə) ----------
export async function kurslarSekmesi(kok) {
  kok.innerHTML = `${geriBasliq("💱", t("admin.kurs.baslik"))}
    <form class="kart ayar-kap" id="kurs-form">
      <p class="ipucu" style="margin-top:0">${kacis(t("admin.kurs.aciklama"))}</p>
      <div class="kurs-izgara" id="kurs-izgara"><p class="soluk">${kacis(t("genel.yukleniyor"))}</p></div>
      <button class="btn" type="submit" style="margin-top:14px">${kacis(t("admin.kaydet"))}</button>
    </form>`;
  const form = $("#kurs-form", kok);
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
    try { await kurslariYaz(kurs); bildir(t("admin.kaydedildi"), "basari"); location.hash = "ayarlar"; }
    catch (err) { bildir(hataMesaji(err), "hata"); }
  });
}

// ---------- Instagram mətn şablonu (ayrı səhifə) ----------
export async function instagramSablonSekmesi(kok) {
  kok.innerHTML = `${geriBasliq("📸", t("admin.ig.sablonBaslik"))}
    <form class="kart ayar-kap" id="ig-form">
      <textarea name="sablon" style="min-height:260px;font-size:14px"></textarea>
      <div class="ipucu">${kacis(t("admin.ig.sablonIpucuQisa"))} ${SABLON_ACARLARI.map((a) => `<code>{${a}}</code>`).join(" ")}</div>
      <div class="aksiyonlar" style="margin-top:14px">
        <button class="btn" type="submit">${kacis(t("admin.kaydet"))}</button>
        <button class="btn btn-ince" type="button" id="ig-sifirla">${kacis(t("admin.ig.sifirla"))}</button>
      </div>
    </form>`;
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
      location.hash = "ayarlar";
    } catch (err) { bildir(hataMesaji(err), "hata"); }
  });
}

// ---------- Ehtiyat nüsxə (ayrı səhifə) ----------
export function yedekSekmesi(kok) {
  kok.innerHTML = `${geriBasliq("💾", t("admin.sekme.yedek"))}<div class="ayar-kap" id="yedek"></div>`;
  yedekBolumu($("#yedek", kok));
}
