// Ürünler: liste + ekleme/düzenleme formu (fiyat hesabı, fotoğraflar, gizli detaylar)
import {
  db, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, serverTimestamp,
} from "../../ortak/firebase.js";
import { t, yerel, DILLER } from "../../ortak/i18n.js";
import { hesapla, para } from "../../ortak/fiyat.js";
import { fotoHazirla, kapakHazirla, FOTO_MAX_ADET } from "../../ortak/foto.js";
import { $, $$, kacis, bildir, hataMesaji } from "../../ortak/yardim.js";
import { tumDetaylar, detayGuncelle, kategorileriGetir, vitrinEksikleri } from "./veri.js";
import { OZEL_KATEGORILER, ozelMi } from "../../ortak/kategori.js";
import { instagramAc } from "./instagram.js";
import { secici } from "./secici.js";
import { siyahilariGetir, siyahiyaElave, markalariTohumla } from "./siyahilar.js";
import { VALYUTALAR, hesabKursu } from "./kurs.js";
import { IKON } from "../../ortak/ikon.js";


export function urunlerSekmesi(kok, args) {
  if (args[0]) formAc(kok, args[0] === "yeni" ? null : args[0]);
  else listeAc(kok);
}

// ================= LİSTE =================
async function listeAc(kok) {
  kok.innerHTML = `<p class="bos">${kacis(t("genel.yukleniyor"))}</p>`;
  try {
    const [us, detaylar, kategoriler] = await Promise.all([
      getDocs(collection(db, "urunler")), tumDetaylar(true), kategorileriGetir(),
    ]);
    const katAd = Object.fromEntries(kategoriler.map((k) => [k.id, yerel(k.ad)]));
    const urunler = us.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.olusturma?.toMillis?.() || 0) - (a.olusturma?.toMillis?.() || 0));
    let ara = "";

    const ciz = () => {
      const q = ara.toLocaleLowerCase("az");
      const liste = urunler.filter((u) => !q || `${yerel(u.ad)} ${u.marka || ""}`.toLocaleLowerCase("az").includes(q));
      $("#tablo", kok).innerHTML = liste.length ? `
        <div class="urun-liste">${liste.map((u) => {
          const d = detaylar.get(u.id) || {};
          const h = hesapla({ ...d, satisFiyati: u.satisFiyati, indirimYuzde: u.indirimYuzde, elle: true });
          return `<div class="kart urun-satir ${u.aktif ? "" : "pasif"}">
            ${u.kapak ? `<img class="kucuk-foto" src="${kacis(u.kapak)}" alt="">` : `<div class="kucuk-foto"></div>`}
            <div class="bilgi">
              <div class="ad">${kacis(yerel(u.ad))}</div>
              <div class="soluk">${kacis([u.marka, katAd[u.kategoriId], ...OZEL_KATEGORILER.filter((o) => (u.ekKategoriler || []).includes(o.id)).map((o) => `${o.ikon} ${katAd[o.id] || o.ad}`)].filter(Boolean).join(" · "))}</div>
              <div class="rakamlar">
                <span>${kacis(t("admin.hesap.maya"))}: <b>${para(h.maliyet)}</b></span>
                <span>${kacis(t("admin.hesap.satis"))}: <b>${para(u.satisFiyati)}</b></span>
                ${Number(u.indirimYuzde) > 0 ? `<span>${kacis(t("admin.hesap.uyeFiyati"))}: <b>${para(u.uyeFiyati)}</b> (−${kacis(u.indirimYuzde)}%)</span>` : ""}
                <span>${kacis(t("admin.hesap.qazanc"))}: <b style="color:${h.kar < 0 ? "var(--tehlike)" : "var(--basari)"}">${para(h.kar)}</b></span>
              </div>
              <div class="aksiyonlar">
                <a class="btn btn-ince btn-kucuk" href="#urunler/${encodeURIComponent(u.id)}">${kacis(t("admin.duzenle"))}</a>
                <button class="btn btn-ince btn-kucuk" data-ig="${kacis(u.id)}">${IKON.instagram} Instagram</button>
                ${d.kaynakLink ? `<a class="btn btn-link btn-kucuk" href="${kacis(d.kaynakLink)}" target="_blank" rel="noopener noreferrer">🔗 ${kacis(t("admin.sip.kaynakAc"))}</a>` : ""}
                <label class="ios-tik" style="margin-left:auto"><span>${kacis(t("admin.urun.aktif"))}</span><input type="checkbox" class="ios-input" data-aktif="${kacis(u.id)}" ${u.aktif ? "checked" : ""}><span class="ios-switch" aria-hidden="true"></span></label>
              </div>
            </div></div>`;
        }).join("")}</div>`
        : `<p class="bos">${kacis(t(urunler.length ? "vitrin.bos" : "admin.urun.bos"))}</p>`;

      $$("[data-ig]", kok).forEach((b) => b.addEventListener("click", () => instagramAc(b.dataset.ig)));
      $$("[data-aktif]", kok).forEach((c) => c.addEventListener("change", async () => {
        if (c.checked) {
          const u0 = urunler.find((x) => x.id === c.dataset.aktif);
          const eksik = vitrinEksikleri(u0, detaylar.get(u0.id) || {});
          if (eksik.length) {
            c.checked = false;
            bildir(t("admin.yoxla.icazeYox", { liste: eksik.map((s) => t("admin.yoxla." + s)).join(", ") }), "hata");
            return;
          }
        }
        try {
          await updateDoc(doc(db, "urunler", c.dataset.aktif), { aktif: c.checked, guncelleme: serverTimestamp() });
          const u = urunler.find((x) => x.id === c.dataset.aktif);
          u.aktif = c.checked;
          c.closest(".urun-satir").classList.toggle("pasif", !c.checked);
          bildir(t(c.checked ? "admin.urun.aktifEdildi" : "admin.urun.pasifEdildi"), "basari");
        } catch (e) { c.checked = !c.checked; bildir(hataMesaji(e), "hata"); }
      }));
    };

    kok.innerHTML = `
      <div class="bolum-ust">
        <h1>${kacis(t("admin.sekme.urunler"))} <span class="soluk">(${urunler.length})</span></h1>
        <a class="btn" href="#urunler/yeni">+ ${kacis(t("admin.urun.yeni"))}</a>
      </div>
      ${kategoriler.length ? "" : `<div class="kutu-mesaj kutu-bilgi">${kacis(t("admin.urun.onceKategori"))} <a href="#kategoriler">${kacis(t("admin.sekme.kategoriler"))}</a></div>`}
      <input type="search" id="urun-ara" placeholder="${kacis(t("filtre.ara"))}" style="margin-bottom:12px;max-width:420px">
      <div id="tablo"></div>`;
    $("#urun-ara", kok).addEventListener("input", (e) => { ara = e.target.value; ciz(); });
    ciz();
  } catch (e) {
    kok.innerHTML = `<p class="bos">${kacis(hataMesaji(e))}</p>`;
  }
}

// ================= FORM =================
const sayi = (x) => { const n = parseFloat(String(x ?? "").replace(",", ".")); return Number.isFinite(n) ? n : 0; };
const iki = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

async function formAc(kok, id) {
  kok.innerHTML = `<p class="bos">${kacis(t("genel.yukleniyor"))}</p>`;
  let urun = {}, detay = {}, eskiFotolar = [];
  let kategoriler = [], siyahilar, tumUrunler = [];
  try {
    const istekler = [kategorileriGetir(), getDocs(collection(db, "urunler")), siyahilariGetir()];
    if (id) {
      istekler.push(
        getDoc(doc(db, "urunler", id)),
        getDoc(doc(db, "urunDetay", id)),
        getDocs(query(collection(db, "urunFoto"), where("urunId", "==", id))),
      );
    }
    const [k, tum, sy, us, ds, fs] = await Promise.all(istekler);
    kategoriler = k;
    siyahilar = sy;
    tumUrunler = tum.docs.map((d) => d.data());
    if (id) {
      if (!us.exists()) { bildir(t("urun.yok"), "hata"); location.hash = "magaza"; return; }
      urun = us.data();
      detay = ds.exists() ? ds.data() : {};
      eskiFotolar = fs.docs.map((d) => ({ docId: d.id, ...d.data() })).sort((a, b) => a.sira - b.sira);
    }
  } catch (e) {
    kok.innerHTML = `<p class="bos">${kacis(hataMesaji(e))}</p>`;
    return;
  }

  // Siyahılar Ayarlar-dakı siyahılardır (+ bu məhsulun öz dəyərləri, silinmiş olsa belə)
  const birlesdir = (a, b) => [...new Set([...a, ...b].filter(Boolean))];
  const markalar = birlesdir(await markalariTohumla(tumUrunler), [urun.marka]);
  const olculer = birlesdir(siyahilar.olculer, urun.olculer || []);
  const renkler = birlesdir(siyahilar.renkler, urun.renkler || []);

  let fotolar = eskiFotolar.map((f) => f.veri); // dataURL siyahısı (ilk = vitrin)
  const v = (x) => kacis(x ?? "");
  // Köhnə məhsullar: alış qiyməti AZN idi
  const alisValyuta = detay.alisValyuta || "AZN";
  const alisMebleg = detay.alisMebleg ?? detay.alisFiyati ?? "";

  kok.innerHTML = `
    <div class="bolum-ust">
      <h1>${kacis(t(id ? "admin.urun.duzenle" : "admin.urun.yeni"))}</h1>
      <a class="btn btn-ince btn-kucuk" href="#urunler">${kacis(t("admin.urun.siyahi"))}</a>
    </div>
    <form id="urun-form" novalidate>
      <div class="kart">
        ${DILLER.map((d) => `
          <div class="alan" data-yoxla="ad"><label>📝 ${kacis(t("admin.urun.ad"))}${DILLER.length > 1 ? ` (${d.kod.toUpperCase()})` : ""} <span class="vacib">*</span></label>
            <input name="ad_${d.kod}" maxlength="200" value="${v(urun.ad?.[d.kod])}" placeholder="${kacis(t("admin.urun.adOrnek"))}"></div>`).join("")}
        <div class="secici-yigin">
          <div class="alan" id="s-marka" data-yoxla="marka"></div>
          <div class="alan" id="s-kategori" data-yoxla="kategori"></div>
          <div class="alan" id="s-olcu" data-yoxla="olcu"></div>
          <div class="alan" id="s-renk" data-yoxla="renk"></div>
        </div>
        <div class="alan ozel-kat-secim">
          <label>📌 ${kacis(t("admin.urun.ozelKat"))}</label>
          <div class="ios-siyahi">
            ${OZEL_KATEGORILER.map((o) => {
              const k = kategoriler.find((x) => x.id === o.id);
              return `<label class="ios-satir">
                <span class="ios-ad">${o.ikon} ${kacis(k ? yerel(k.ad) : o.ad)}</span>
                <input type="checkbox" class="ios-input" name="ek_${o.id}" ${(urun.ekKategoriler || []).includes(o.id) ? "checked" : ""}>
                <span class="ios-switch" aria-hidden="true"></span>
              </label>`;
            }).join("")}
          </div>
          <p class="ipucu" style="margin:6px 0 0">${kacis(t("admin.urun.ozelKatIpucu"))}</p>
        </div>
        ${DILLER.map((d) => `
          <div class="alan" style="margin-bottom:0"><label>📄 ${kacis(t("admin.urun.aciklama"))}${DILLER.length > 1 ? ` (${d.kod.toUpperCase()})` : ""}</label>
            <textarea name="aciklama_${d.kod}" maxlength="3000" style="min-height:70px">${v(urun.aciklama?.[d.kod])}</textarea></div>`).join("")}
      </div>

      <div class="bolum-baslik">💰 ${kacis(t("admin.urun.qiymetBaslik"))} <span style="text-transform:none;letter-spacing:0;font-weight:500">· ${kacis(t("admin.urun.gizliQisa"))}</span></div>
      <div class="kart">
        <div class="alan" data-yoxla="link"><label>🔗 ${kacis(t("admin.urun.kaynakLink"))} <span class="vacib">*</span></label>
          <input name="kaynakLink" type="url" maxlength="2000" value="${v(detay.kaynakLink)}" placeholder="https://www.trendyol.com/..."></div>

        <div data-yoxla="alis">
        <label>💵 ${kacis(t("admin.hesap.alis"))} <span class="vacib">*</span></label>
        <div class="alis-satir">
          <input name="alisMebleg" inputmode="decimal" placeholder="0.00" value="${v(alisMebleg)}">
          <select name="alisValyuta">${VALYUTALAR.map((x) => `<option ${x === alisValyuta ? "selected" : ""}>${x}</option>`).join("")}</select>
        </div>
        <div class="kurs-satir" id="kurs-satir" ${alisValyuta === "AZN" ? "hidden" : ""}>
          <span>1 <b id="kurs-val">${v(alisValyuta)}</b> =</span>
          <input name="kurs" inputmode="decimal" value="${v(detay.kurs || "")}" aria-label="${kacis(t("admin.hesap.kurs"))}">
          <span>₼</span>
          <span class="soluk" id="kurs-menbe"></span>
        </div>
        <div class="azn-qarsiliq" id="azn-qarsiliq"></div>
        </div>

        <div class="satir" style="margin-top:12px">
          <div class="alan"><label>🚚 ${kacis(t("admin.hesap.kargo"))} (₼)</label><input name="kargo" inputmode="decimal" placeholder="0.00" value="${v(detay.kargo || "")}"></div>
          <div class="alan"><label>🧾 ${kacis(t("admin.hesap.vergi"))} (₼)</label><input name="vergi" inputmode="decimal" placeholder="0.00" value="${v(detay.vergi || "")}"></div>
        </div>
        <div class="maya-kutu"><span>📦 ${kacis(t("admin.hesap.maya"))}</span><b id="maya">0.00 ₼</b></div>

        <div class="satir" style="margin-top:14px">
          <div class="alan"><label>📈 ${kacis(t("admin.hesap.karYuzde"))} (%)</label><input name="karYuzde" inputmode="decimal" placeholder="20" value="${v(detay.karYuzde ?? "")}"></div>
          <div class="alan" data-yoxla="satis"><label>💰 ${kacis(t("admin.hesap.satis"))} (₼) <span class="vacib">*</span></label><input name="satisFiyati" inputmode="decimal" placeholder="0.00" value="${v(urun.satisFiyati ?? "")}"></div>
        </div>
        <p class="ipucu" style="margin-top:-6px">${kacis(t("admin.hesap.ikiTerefli"))}</p>
        <div class="alan" style="max-width:50%"><label>💎 ${kacis(t("admin.hesap.indirim"))} (%)</label>
          <input name="indirimYuzde" inputmode="decimal" placeholder="0" value="${v(urun.indirimYuzde || "")}"></div>
        <div class="alan" style="margin-bottom:0"><label>🗒️ ${kacis(t("admin.urun.adminNotu"))}</label>
          <textarea name="adminNotu" maxlength="1000" style="min-height:56px">${v(detay.adminNotu)}</textarea></div>
      </div>

      <div class="bolum-baslik">🧾 ${kacis(t("admin.hesap.xulase"))}</div>
      <div class="kart xulase" id="xulase"></div>

      <div class="bolum-baslik">📷 ${kacis(t("admin.urun.fotolar"))} <span class="vacib">*</span></div>
      <div class="kart" data-yoxla="foto">
        <div class="foto-butonlar">
          <label class="btn btn-ince btn-kucuk" for="foto-sec">🖼️ ${kacis(t("admin.urun.qalereya"))}</label>
          <label class="btn btn-ince btn-kucuk" for="foto-kamera">📷 ${kacis(t("admin.urun.kamera"))}</label>
        </div>
        <input class="gizli-input" type="file" id="foto-sec" accept="image/*" multiple>
        <input class="gizli-input" type="file" id="foto-kamera" accept="image/*" capture="environment">
        <div class="ipucu">${kacis(t("admin.urun.fotoIpucu", { adet: FOTO_MAX_ADET }))}</div>
        <div class="foto-izgara" id="fotolar"></div>
      </div>

      <div class="form-alt yapiskan">
        <label class="ios-tik"><span>👁️ ${kacis(t("admin.urun.vitrindeGoster"))}</span><input type="checkbox" class="ios-input" name="aktif" ${urun.aktif !== false ? "checked" : ""}><span class="ios-switch" aria-hidden="true"></span></label>
        <div class="aksiyonlar">
          ${id ? `<button type="button" class="btn btn-link btn-kucuk sil-link" id="sil">${kacis(t("admin.sil"))}</button>` : ""}
          <button type="submit" class="btn btn-kucuk">${kacis(t("admin.kaydet"))}</button>
        </div>
      </div>
    </form>`;

  const form = $("#urun-form", kok);
  const f = (ad) => form.elements[ad];

  // ---- Axtarışlı siyahılar ----
  const sMarka = secici($("#s-marka", kok), {
    ikon: "🏷️", vacib: true, deyisdi: () => yoxlamaCiz(),
    etiket: t("admin.urun.marka"), yerTutucu: t("secici.markaSec"), yeniBasliq: t("secici.yeniMarka"),
    secenekler: markalar.map((m) => ({ id: m, ad: m })), secili: urun.marka || "",
    yeniElave: async (ad) => { await siyahiyaElave("markalar", ad); return { id: ad, ad }; },
  });
  const sKategori = secici($("#s-kategori", kok), {
    ikon: "🗂️", vacib: true, deyisdi: () => yoxlamaCiz(),
    etiket: t("admin.urun.kategori"), yerTutucu: t("secici.kategoriSec"), yeniBasliq: t("secici.yeniKategori"),
    secenekler: kategoriler.filter((k) => !ozelMi(k.id)).map((k) => ({ id: k.id, ad: yerel(k.ad) })), secili: ozelMi(urun.kategoriId) ? "" : (urun.kategoriId || ""),
    yeniElave: async (ad) => {
      const ref = doc(collection(db, "kategoriler"));
      const sira = kategoriler.length ? Math.max(...kategoriler.map((k) => k.sira ?? 0)) + 1 : 0;
      await setDoc(ref, { ad: { [DILLER[0].kod]: ad }, sira, olusturma: serverTimestamp() });
      kategoriler.push({ id: ref.id, ad: { [DILLER[0].kod]: ad }, sira });
      return { id: ref.id, ad };
    },
  });
  const sOlcu = secici($("#s-olcu", kok), {
    ikon: "📏", vacib: true, deyisdi: () => yoxlamaCiz(),
    etiket: t("admin.urun.olculer"), yerTutucu: t("secici.olcuSec"), yeniBasliq: t("secici.yeniOlcu"), coxlu: true,
    secenekler: olculer.map((x) => ({ id: x, ad: x })), secili: urun.olculer || [],
    yeniElave: async (ad) => { await siyahiyaElave("olculer", ad); return { id: ad, ad }; },
  });
  const sRenk = secici($("#s-renk", kok), {
    ikon: "🎨", vacib: true, deyisdi: () => yoxlamaCiz(),
    etiket: t("admin.urun.renkler"), yerTutucu: t("secici.renkSec"), yeniBasliq: t("secici.yeniRenk"), coxlu: true, renkli: true,
    secenekler: renkler.map((x) => ({ id: x, ad: x })), secili: urun.renkler || [],
    yeniElave: async (ad) => { await siyahiyaElave("renkler", ad); return { id: ad, ad }; },
  });

  // ---- Vitrinə çıxmaq üçün yoxlama ----
  const YOXLAMA_SAHELERI = ["ad", "marka", "kategori", "olcu", "renk", "link", "alis", "satis", "foto"];
  function indikiEksikler() {
    return vitrinEksikleri({
      ad: Object.fromEntries(DILLER.map((d) => [d.kod, f(`ad_${d.kod}`).value])),
      marka: sMarka.deger(),
      kategoriId: sKategori.deger(),
      olculer: sOlcu.deger(),
      renkler: sRenk.deger(),
      satisFiyati: sayi(f("satisFiyati").value),
      fotoSayisi: fotolar.length,
    }, { kaynakLink: f("kaynakLink").value, alisMebleg: sayi(f("alisMebleg").value) });
  }
  let yoxlamaGoster = !!id; // yeni məhsulda qırmızı işarələr yalnız saxla basılandan sonra
  function yoxlamaCiz() {
    const eksik = indikiEksikler();
    $$("[data-yoxla]", kok).forEach((el) => el.classList.toggle("sahe-eksik", yoxlamaGoster && eksik.includes(el.dataset.yoxla)));
    return eksik;
  }
  form.addEventListener("input", () => yoxlamaCiz());

  // ---- Qiymət hesabı ----
  let kurslar = null;
  const valyuta = () => f("alisValyuta").value;
  const kursDeger = () => (valyuta() === "AZN" ? 1 : sayi(f("kurs").value));
  const alisAzn = () => iki(sayi(f("alisMebleg").value) * kursDeger());
  const maya = () => iki(alisAzn() + sayi(f("kargo").value) + sayi(f("vergi").value));

  function xulaseCiz() {
    const m = maya();
    const satis = sayi(f("satisFiyati").value);
    const endirim = Math.min(90, Math.max(0, sayi(f("indirimYuzde").value)));
    const uye = iki(satis * (1 - endirim / 100));
    const q1 = iki(satis - m), q2 = iki(uye - m);
    const faiz = (q) => (m > 0 ? `${iki((q / m) * 100)}%` : "—");
    const reng = (q) => (q < 0 ? "var(--tehlike)" : "var(--basari)");
    const val = valyuta();

    $("#maya", kok).textContent = para(m);
    $("#azn-qarsiliq", kok).innerHTML = sayi(f("alisMebleg").value) > 0
      ? `≈ <b>${para(alisAzn())}</b>${val !== "AZN" ? ` <span class="soluk">(${kacis(sayi(f("alisMebleg").value))} ${kacis(val)} × ${kacis(kursDeger())})</span>` : ""}` : "";

    $("#xulase", kok).innerHTML = `
      <div class="x-satir"><span>${kacis(t("admin.hesap.alis"))}</span><span>${para(alisAzn())}</span></div>
      <div class="x-satir"><span>${kacis(t("admin.hesap.kargo"))}</span><span>${para(sayi(f("kargo").value))}</span></div>
      <div class="x-satir"><span>${kacis(t("admin.hesap.vergi"))}</span><span>${para(sayi(f("vergi").value))}</span></div>
      <div class="x-satir cem"><span>${kacis(t("admin.hesap.maya"))}</span><b>${para(m)}</b></div>
      <div class="x-satir buyuk"><span>${kacis(t("admin.hesap.satis"))}</span><b>${para(satis)}</b></div>
      <div class="x-satir"><span>${kacis(t("admin.hesap.uyeFiyati"))}${endirim ? ` <span class="soluk">(−${iki(endirim)}%)</span>` : ""}</span><b>${para(uye)}</b></div>
      <div class="qazanc-qutular">
        <div class="qazanc-qutu"><span>${kacis(t("admin.hesap.qazancUzvOlmayan"))}</span>
          <b style="color:${reng(q1)}">${para(q1)}</b><small>${faiz(q1)}</small></div>
        <div class="qazanc-qutu"><span>${kacis(t("admin.hesap.qazancUzv"))}</span>
          <b style="color:${reng(q2)}">${para(q2)}</b><small>${faiz(q2)}</small></div>
      </div>`;
    return { m, satis, uye, q1, endirim };
  }

  // Qazanc % → satış qiyməti
  const satisdanFaiz = () => {
    const m = maya(), s = sayi(f("satisFiyati").value);
    f("karYuzde").value = m > 0 && s > 0 ? iki((s / m - 1) * 100) : "";
  };
  const faizdenSatis = () => {
    const m = maya();
    if (f("karYuzde").value === "" || !(m > 0)) return;
    f("satisFiyati").value = iki(m * (1 + sayi(f("karYuzde").value) / 100)).toFixed(2);
  };
  ["alisMebleg", "kargo", "vergi", "kurs"].forEach((ad) => f(ad).addEventListener("input", () => { faizdenSatis(); xulaseCiz(); }));
  f("karYuzde").addEventListener("input", () => { faizdenSatis(); xulaseCiz(); });
  f("satisFiyati").addEventListener("input", () => { satisdanFaiz(); xulaseCiz(); }); // əl ilə yuvarlaqlaşdırma → faiz özü
  f("indirimYuzde").addEventListener("input", xulaseCiz);

  async function kursYaz(yeniVal) {
    const val = valyuta();
    $("#kurs-satir", kok).hidden = val === "AZN";
    $("#kurs-val", kok).textContent = val;
    if (val === "AZN") { faizdenSatis(); xulaseCiz(); return; }
    $("#kurs-menbe", kok).textContent = t("genel.yukleniyor");
    const k = await hesabKursu(val);
    if (k.deger > 0) {
      if (yeniVal || !f("kurs").value) f("kurs").value = k.deger;
      $("#kurs-menbe", kok).innerHTML = k.menbe === "ayarlar"
        ? `${kacis(t("admin.hesap.kursAyarlar"))} · <a href="#ayarlar">${kacis(t("admin.sekme.ayarlar"))}</a>`
        : kacis(t("admin.hesap.kursMenbe", { tarix: k.tarix || "" }));
    } else {
      $("#kurs-menbe", kok).textContent = t("admin.hesap.kursYoxdur");
    }
    faizdenSatis();
    xulaseCiz();
  }
  f("alisValyuta").addEventListener("change", () => kursYaz(true));
  if (valyuta() !== "AZN") kursYaz(false);
  if (!id && f("karYuzde").value === "") f("karYuzde").value = 20; // standart: 20%
  if (!f("satisFiyati").value) faizdenSatis();
  xulaseCiz();

  // ---- Fotoğraflar ----
  let hazirlanan = 0; // hazırlanmaqda olan şəkil sayı
  const saxlaDuyme = () => form.querySelector("button[type=submit]");
  const fotoCiz = () => {
    $("#fotolar", kok).innerHTML = fotolar.map((src, i) => `
      <div class="foto-oge">
        <img src="${kacis(src)}" alt="">
        ${i === 0 ? `<span class="kapak-etiket">${kacis(t("admin.urun.kapak"))}</span>` : ""}
        <div class="araclar">
          <button type="button" data-foto="sol" data-i="${i}" ${i === 0 ? "disabled" : ""} aria-label="←">←</button>
          <button type="button" data-foto="sil" data-i="${i}" aria-label="${kacis(t("admin.sil"))}">✕</button>
          <button type="button" data-foto="sag" data-i="${i}" ${i === fotolar.length - 1 ? "disabled" : ""} aria-label="→">→</button>
        </div>
      </div>`).join("") +
      Array.from({ length: hazirlanan }, () => `<div class="foto-oge foto-yuklenir"><span class="firlanan"></span></div>`).join("");
    const b = saxlaDuyme();
    if (b) {
      b.disabled = hazirlanan > 0;
      b.textContent = hazirlanan > 0 ? t("admin.urun.fotoHazirlanir") : t("admin.kaydet");
    }
    yoxlamaCiz();
  };
  $("#fotolar", kok).addEventListener("click", (e) => {
    const b = e.target.closest("[data-foto]");
    if (!b) return;
    const i = +b.dataset.i;
    if (b.dataset.foto === "sil") fotolar.splice(i, 1);
    else {
      const j = b.dataset.foto === "sol" ? i - 1 : i + 1;
      [fotolar[i], fotolar[j]] = [fotolar[j], fotolar[i]];
    }
    fotoCiz();
  });
  const fotoXeta = (err, ad) => t({
    "foto-tur": "admin.urun.fotoTur",
    "foto-heic": "admin.urun.fotoHeic",
  }[err?.message] || "admin.urun.fotoHata", { ad });

  async function fotolariEkle(e) {
    const secilen = [...e.target.files];
    e.target.value = "";
    const bos = FOTO_MAX_ADET - fotolar.length - hazirlanan;
    const dosyalar = secilen.slice(0, Math.max(0, bos));
    if (secilen.length > dosyalar.length) bildir(t("admin.urun.fotoLimit", { adet: FOTO_MAX_ADET }), "hata");
    hazirlanan += dosyalar.length;
    fotoCiz();
    for (const d of dosyalar) { // bir-bir (iPhone-da yaddaş dolmasın)
      try { fotolar.push(await fotoHazirla(d)); }
      catch (err) { bildir(fotoXeta(err, d.name || ""), "hata"); }
      hazirlanan--;
      fotoCiz();
    }
  }
  $("#foto-sec", kok).addEventListener("change", fotolariEkle);
  $("#foto-kamera", kok).addEventListener("change", fotolariEkle);
  fotoCiz();

  // ---- Kaydet ----
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (hazirlanan > 0) return bildir(t("admin.urun.fotoHazirlanir"), "hata");
    const x = xulaseCiz();
    const ilkDil = DILLER[0].kod;
    const ad = Object.fromEntries(DILLER.map((d) => [d.kod, f(`ad_${d.kod}`).value.trim()]).filter(([, y]) => y));
    const aciklama = Object.fromEntries(DILLER.map((d) => [d.kod, f(`aciklama_${d.kod}`).value.trim()]).filter(([, y]) => y));
    const kaynakLink = f("kaynakLink").value.trim();

    // Vitrinə çıxarmaq üçün bütün vacib sahələr doldurulmalıdır; yarımçıq məhsul yalnız gizli saxlanıla bilər
    yoxlamaGoster = true;
    const eksik = yoxlamaCiz();
    if (f("aktif").checked && eksik.length) {
      bildir(t("admin.yoxla.icazeYox", { liste: eksik.map((s) => t("admin.yoxla." + s)).join(", ") }), "hata");
      $(".sahe-eksik", kok)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!ad[ilkDil]) return bildir(t("admin.urun.adGerekli"), "hata"); // qaralama üçün də ad lazımdır
    if (valyuta() !== "AZN" && sayi(f("alisMebleg").value) > 0 && !(kursDeger() > 0)) return bildir(t("admin.hesap.kursGerekli"), "hata");
    if (kaynakLink && !/^https?:\/\//i.test(kaynakLink)) return bildir(t("admin.urun.linkHata"), "hata");
    if (x.satis > 0 && x.q1 < 0 && !confirm(t("admin.urun.zararOnay"))) return;

    const buton = form.querySelector("button[type=submit]");
    buton.disabled = true;
    buton.textContent = t("genel.bekleyin");
    try {
      const ref = id ? doc(db, "urunler", id) : doc(collection(db, "urunler"));
      const uid = ref.id;
      const kapak = fotolar[0] ? await kapakHazirla(fotolar[0]) : "";

      await setDoc(ref, {
        ad, aciklama,
        marka: sMarka.deger(),
        kategoriId: sKategori.deger(),
        ekKategoriler: OZEL_KATEGORILER.filter((o) => f(`ek_${o.id}`)?.checked).map((o) => o.id),
        olculer: sOlcu.deger(),
        renkler: sRenk.deger(),
        satisFiyati: iki(x.satis),
        indirimYuzde: iki(x.endirim),
        uyeFiyati: iki(x.uye),
        aktif: f("aktif").checked,
        kapak,
        fotoSayisi: fotolar.length,
        olusturma: urun.olusturma || serverTimestamp(),
        guncelleme: serverTimestamp(),
      });

      const yeniDetay = {
        alisMebleg: sayi(f("alisMebleg").value),
        alisValyuta: valyuta(),
        kurs: kursDeger(),
        alisFiyati: alisAzn(), // AZN qarşılığı (siyahılar və hesablamalar üçün)
        kargo: sayi(f("kargo").value),
        vergi: sayi(f("vergi").value),
        karYuzde: x.m > 0 ? iki((x.satis / x.m - 1) * 100) : 0,
        kaynakLink,
        adminNotu: f("adminNotu").value.trim(),
        guncelleme: serverTimestamp(),
      };
      await setDoc(doc(db, "urunDetay", uid), yeniDetay);
      detayGuncelle(uid, yeniDetay);

      // Fotoğraflar: sadece değişen sıraları yaz, fazlaları sil
      const eskiVeri = eskiFotolar.map((x) => x.veri);
      for (let i = 0; i < fotolar.length; i++) {
        if (eskiVeri[i] !== fotolar[i]) {
          await setDoc(doc(db, "urunFoto", `${uid}_${i}`), { urunId: uid, sira: i, veri: fotolar[i] });
        }
      }
      for (const eski of eskiFotolar) {
        if (eski.sira >= fotolar.length || eski.docId !== `${uid}_${eski.sira}`) {
          await deleteDoc(doc(db, "urunFoto", eski.docId));
        }
      }

      bildir(t("admin.kaydedildi"), "basari");
      location.hash = "urunler";
      // Yeni məhsul əlavə olunubsa, dərhal Instagram üçün hazırlamağı təklif et
      if (!id && f("aktif").checked && confirm(t("admin.ig.yeniMehsulSual"))) instagramAc(uid);
    } catch (err) {
      bildir(hataMesaji(err), "hata");
      buton.disabled = false;
      buton.textContent = t("admin.kaydet");
    }
  });

  // ---- Sil ----
  $("#sil", kok)?.addEventListener("click", async () => {
    if (!confirm(t("admin.urun.silOnay"))) return;
    try {
      for (const eski of eskiFotolar) await deleteDoc(doc(db, "urunFoto", eski.docId));
      await deleteDoc(doc(db, "urunDetay", id));
      await deleteDoc(doc(db, "urunler", id));
      detayGuncelle(id, null);
      bildir(t("admin.silindi"), "basari");
      location.hash = "urunler";
    } catch (err) { bildir(hataMesaji(err), "hata"); }
  });
}
