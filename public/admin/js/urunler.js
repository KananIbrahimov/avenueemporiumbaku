// Ürünler: liste + ekleme/düzenleme formu (fiyat hesabı, fotoğraflar, gizli detaylar)
import {
  db, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, serverTimestamp,
} from "../../ortak/firebase.js";
import { t, yerel, DILLER } from "../../ortak/i18n.js";
import { hesapla, para } from "../../ortak/fiyat.js";
import { fotoHazirla, kapakHazirla, FOTO_MAX_ADET } from "../../ortak/foto.js";
import { $, $$, kacis, bildir, hataMesaji } from "../../ortak/yardim.js";
import { tumDetaylar, detayGuncelle, kategorileriGetir } from "./veri.js";
import { instagramAc } from "./instagram.js";
import { IKON } from "../../ortak/ikon.js";

const HAZIR_OLCULER = {
  geyim: ["XS", "S", "M", "L", "XL", "XXL"],
  ayaqqabi: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
};

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
              <div class="soluk">${kacis([u.marka, katAd[u.kategoriId]].filter(Boolean).join(" · "))}</div>
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
                <label class="onay" style="margin-left:auto"><input type="checkbox" data-aktif="${kacis(u.id)}" ${u.aktif ? "checked" : ""}> ${kacis(t("admin.urun.aktif"))}</label>
              </div>
            </div></div>`;
        }).join("")}</div>`
        : `<p class="bos">${kacis(t(urunler.length ? "vitrin.bos" : "admin.urun.bos"))}</p>`;

      $$("[data-ig]", kok).forEach((b) => b.addEventListener("click", () => instagramAc(b.dataset.ig)));
      $$("[data-aktif]", kok).forEach((c) => c.addEventListener("change", async () => {
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
const listeyeCevir = (s) => [...new Set(s.split(",").map((x) => x.trim()).filter(Boolean))];

async function formAc(kok, id) {
  kok.innerHTML = `<p class="bos">${kacis(t("genel.yukleniyor"))}</p>`;
  let urun = {}, detay = {}, eskiFotolar = [];
  let kategoriler = [], markalar = [];
  try {
    const istekler = [kategorileriGetir(), getDocs(collection(db, "urunler"))];
    if (id) {
      istekler.push(
        getDoc(doc(db, "urunler", id)),
        getDoc(doc(db, "urunDetay", id)),
        getDocs(query(collection(db, "urunFoto"), where("urunId", "==", id))),
      );
    }
    const [k, tum, us, ds, fs] = await Promise.all(istekler);
    kategoriler = k;
    markalar = [...new Set(tum.docs.map((d) => d.data().marka).filter(Boolean))].sort();
    if (id) {
      if (!us.exists()) { bildir(t("urun.yok"), "hata"); location.hash = "urunler"; return; }
      urun = us.data();
      detay = ds.exists() ? ds.data() : {};
      eskiFotolar = fs.docs.map((d) => ({ docId: d.id, ...d.data() })).sort((a, b) => a.sira - b.sira);
    }
  } catch (e) {
    kok.innerHTML = `<p class="bos">${kacis(hataMesaji(e))}</p>`;
    return;
  }

  let fotolar = eskiFotolar.map((f) => f.veri); // dataURL listesi (ilk = kapak)
  const elle = id ? Math.abs(hesapla({ ...detay }).onerilen - urun.satisFiyati) > 0.009 : false;
  const v = (x) => kacis(x ?? "");

  kok.innerHTML = `
    <div class="bolum-ust">
      <h1>${kacis(t(id ? "admin.urun.duzenle" : "admin.urun.yeni"))}</h1>
      <a class="btn btn-ince" href="#urunler">← ${kacis(t("genel.geri"))}</a>
    </div>
    <form id="urun-form" class="kart" novalidate>
      ${DILLER.map((d) => `
        <div class="alan"><label>${kacis(t("admin.urun.ad"))}${DILLER.length > 1 ? ` (${d.kod.toUpperCase()})` : ""}</label>
          <input name="ad_${d.kod}" maxlength="200" value="${v(urun.ad?.[d.kod])}" ${d.kod === DILLER[0].kod ? "required" : ""}></div>
        <div class="alan"><label>${kacis(t("admin.urun.aciklama"))}${DILLER.length > 1 ? ` (${d.kod.toUpperCase()})` : ""}</label>
          <textarea name="aciklama_${d.kod}" maxlength="3000">${v(urun.aciklama?.[d.kod])}</textarea></div>`).join("")}

      <div class="satir">
        <div class="alan"><label>${kacis(t("admin.urun.marka"))}</label>
          <input name="marka" list="markalar" maxlength="60" value="${v(urun.marka)}">
          <datalist id="markalar">${markalar.map((m) => `<option value="${v(m)}">`).join("")}</datalist></div>
        <div class="alan"><label>${kacis(t("admin.urun.kategori"))}</label>
          <select name="kategoriId" required>
            <option value="">—</option>
            ${kategoriler.map((k) => `<option value="${v(k.id)}" ${k.id === urun.kategoriId ? "selected" : ""}>${kacis(yerel(k.ad))}</option>`).join("")}
          </select></div>
      </div>

      <div class="alan"><label>${kacis(t("admin.urun.olculer"))}</label>
        <input name="olculer" value="${v((urun.olculer || []).join(", "))}" placeholder="S, M, L">
        <div class="hazir-butonlar">
          <button type="button" class="cip" data-hazir="geyim">${kacis(t("admin.urun.hazirGeyim"))}</button>
          <button type="button" class="cip" data-hazir="ayaqqabi">${kacis(t("admin.urun.hazirAyaqqabi"))}</button>
        </div>
        <div class="ipucu">${kacis(t("admin.urun.virgulIle"))}</div></div>
      <div class="alan"><label>${kacis(t("admin.urun.renkler"))}</label>
        <input name="renkler" value="${v((urun.renkler || []).join(", "))}" placeholder="Qara, Ağ, Bej">
        <div class="ipucu">${kacis(t("admin.urun.virgulIle"))}</div></div>

      <div class="form-bolum">
        <h2>🔒 ${kacis(t("admin.urun.gizliBaslik"))}</h2>
        <p class="ipucu" style="margin-top:-6px">${kacis(t("admin.urun.gizliAciklama"))}</p>
        <div class="alan"><label>${kacis(t("admin.urun.kaynakLink"))}</label>
          <input name="kaynakLink" type="url" maxlength="2000" value="${v(detay.kaynakLink)}" placeholder="https://www.trendyol.com/..."></div>
        <div class="satir">
          <div class="alan"><label>${kacis(t("admin.hesap.alis"))} (₼)</label><input name="alisFiyati" type="number" step="0.01" min="0" inputmode="decimal" value="${v(detay.alisFiyati)}"></div>
          <div class="alan"><label>${kacis(t("admin.hesap.kargo"))} (₼)</label><input name="kargo" type="number" step="0.01" min="0" inputmode="decimal" value="${v(detay.kargo)}"></div>
          <div class="alan"><label>${kacis(t("admin.hesap.vergi"))} (₼)</label><input name="vergi" type="number" step="0.01" min="0" inputmode="decimal" value="${v(detay.vergi)}"></div>
          <div class="alan"><label>${kacis(t("admin.hesap.karYuzde"))} (%)</label><input name="karYuzde" type="number" step="0.1" min="0" inputmode="decimal" value="${v(detay.karYuzde)}"></div>
        </div>
        <div class="alan"><label>${kacis(t("admin.urun.adminNotu"))}</label>
          <textarea name="adminNotu" maxlength="1000" style="min-height:60px">${v(detay.adminNotu)}</textarea></div>
      </div>

      <div class="form-bolum">
        <h2>💰 ${kacis(t("admin.urun.satisBaslik"))}</h2>
        <label class="onay"><input type="checkbox" name="elle" ${elle ? "checked" : ""}> ${kacis(t("admin.hesap.elle"))}</label>
        <div class="satir" style="margin-top:10px">
          <div class="alan"><label>${kacis(t("admin.hesap.satis"))} (₼)</label><input name="satisFiyati" type="number" step="0.01" min="0" inputmode="decimal" value="${v(urun.satisFiyati)}"></div>
          <div class="alan"><label>${kacis(t("admin.hesap.indirim"))} (%)</label><input name="indirimYuzde" type="number" step="1" min="0" max="90" inputmode="numeric" value="${v(urun.indirimYuzde ?? 0)}"></div>
        </div>
        <div class="hesap-kutusu" id="hesap"></div>
      </div>

      <div class="form-bolum">
        <h2>📷 ${kacis(t("admin.urun.fotolar"))}</h2>
        <input type="file" id="foto-sec" accept="image/*" multiple>
        <div class="ipucu">${kacis(t("admin.urun.fotoIpucu", { adet: FOTO_MAX_ADET }))}</div>
        <div class="foto-izgara" id="fotolar"></div>
      </div>

      <div class="form-bolum form-alt yapiskan">
        <label class="onay"><input type="checkbox" name="aktif" ${urun.aktif !== false ? "checked" : ""}> ${kacis(t("admin.urun.vitrindeGoster"))}</label>
        <div class="aksiyonlar">
          ${id ? `<button type="button" class="btn btn-tehlike" id="sil">${kacis(t("admin.sil"))}</button>` : ""}
          <button type="submit" class="btn">${kacis(t("admin.kaydet"))}</button>
        </div>
      </div>
    </form>`;

  const form = $("#urun-form", kok);
  const f = (ad) => form.elements[ad];

  // ---- Canlı fiyat hesabı ----
  const hesapGuncelle = () => {
    const eleMi = f("elle").checked;
    f("satisFiyati").readOnly = !eleMi;
    const h = hesapla({
      alisFiyati: f("alisFiyati").value, kargo: f("kargo").value, vergi: f("vergi").value,
      karYuzde: f("karYuzde").value, satisFiyati: f("satisFiyati").value,
      indirimYuzde: f("indirimYuzde").value, elle: eleMi,
    });
    if (!eleMi) f("satisFiyati").value = h.onerilen ? h.onerilen.toFixed(2) : "";
    $("#hesap", kok).innerHTML = `
      <div class="satir-h"><span>${kacis(t("admin.hesap.maya"))} <span class="soluk">(${kacis(t("admin.hesap.mayaFormul"))})</span></span><b>${para(h.maliyet)}</b></div>
      <div class="satir-h"><span>${kacis(t("admin.hesap.onerilen"))}</span><span>${para(h.onerilen)}</span></div>
      <div class="satir-h buyuk"><span>${kacis(t("admin.hesap.musteriGorur"))}</span><span>${para(h.satis)}</span></div>
      <div class="satir-h"><span>${kacis(t("admin.hesap.uyeFiyati"))}</span><b>${para(h.uyeFiyati)}</b></div>
      <div class="satir-h"><span>${kacis(t("admin.hesap.qazanc"))}</span><b style="color:${h.kar < 0 ? "var(--tehlike)" : "var(--basari)"}">${para(h.kar)} (${h.karYuzdeGercek}%)</b></div>
      <div class="satir-h"><span>${kacis(t("admin.hesap.uyeyeSatista"))}</span><span style="color:${h.uyeKar < 0 ? "var(--tehlike)" : "inherit"}">${para(h.uyeKar)}</span></div>`;
    return h;
  };
  ["alisFiyati", "kargo", "vergi", "karYuzde", "satisFiyati", "indirimYuzde", "elle"]
    .forEach((ad) => f(ad).addEventListener("input", hesapGuncelle));
  hesapGuncelle();

  // ---- Hazır ölçüler ----
  $$("[data-hazir]", kok).forEach((b) => b.addEventListener("click", () => {
    const mevcut = listeyeCevir(f("olculer").value);
    f("olculer").value = [...new Set([...mevcut, ...HAZIR_OLCULER[b.dataset.hazir]])].join(", ");
  }));

  // ---- Fotoğraflar ----
  const fotoCiz = () => {
    $("#fotolar", kok).innerHTML = fotolar.map((src, i) => `
      <div class="foto-oge">
        <img src="${kacis(src)}" alt="">
        ${i === 0 ? `<span class="kapak-etiket">${kacis(t("admin.urun.kapak"))}</span>` : ""}
        <div class="araclar">
          <button type="button" data-foto="sol" data-i="${i}" ${i === 0 ? "disabled" : ""}>←</button>
          <button type="button" data-foto="sil" data-i="${i}">✕</button>
          <button type="button" data-foto="sag" data-i="${i}" ${i === fotolar.length - 1 ? "disabled" : ""}>→</button>
        </div>
      </div>`).join("");
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
  $("#foto-sec", kok).addEventListener("change", async (e) => {
    const dosyalar = [...e.target.files].slice(0, FOTO_MAX_ADET - fotolar.length);
    if (e.target.files.length > dosyalar.length) bildir(t("admin.urun.fotoLimit", { adet: FOTO_MAX_ADET }), "hata");
    for (const d of dosyalar) {
      try { fotolar.push(await fotoHazirla(d)); fotoCiz(); }
      catch { bildir(t("admin.urun.fotoHata", { ad: d.name }), "hata"); }
    }
    e.target.value = "";
  });
  fotoCiz();

  // ---- Kaydet ----
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const h = hesapGuncelle();
    const ilkDil = DILLER[0].kod;
    const ad = Object.fromEntries(DILLER.map((d) => [d.kod, f(`ad_${d.kod}`).value.trim()]).filter(([, x]) => x));
    const aciklama = Object.fromEntries(DILLER.map((d) => [d.kod, f(`aciklama_${d.kod}`).value.trim()]).filter(([, x]) => x));
    const kaynakLink = f("kaynakLink").value.trim();

    if (!ad[ilkDil]) return bildir(t("admin.urun.adGerekli"), "hata");
    if (!f("kategoriId").value) return bildir(t("admin.urun.kategoriGerekli"), "hata");
    if (!(h.satis > 0)) return bildir(t("admin.urun.fiyatGerekli"), "hata");
    if (kaynakLink && !/^https?:\/\//i.test(kaynakLink)) return bildir(t("admin.urun.linkHata"), "hata");
    if (h.kar < 0 && !confirm(t("admin.urun.zararOnay"))) return;

    const buton = form.querySelector("button[type=submit]");
    buton.disabled = true;
    buton.textContent = t("genel.bekleyin");
    try {
      const ref = id ? doc(db, "urunler", id) : doc(collection(db, "urunler"));
      const uid = ref.id;
      const kapak = fotolar[0] ? await kapakHazirla(fotolar[0]) : "";

      await setDoc(ref, {
        ad, aciklama,
        marka: f("marka").value.trim(),
        kategoriId: f("kategoriId").value,
        olculer: listeyeCevir(f("olculer").value),
        renkler: listeyeCevir(f("renkler").value),
        satisFiyati: h.satis,
        indirimYuzde: Math.min(90, Math.max(0, Number(f("indirimYuzde").value) || 0)),
        uyeFiyati: h.uyeFiyati,
        aktif: f("aktif").checked,
        kapak,
        fotoSayisi: fotolar.length,
        olusturma: urun.olusturma || serverTimestamp(),
        guncelleme: serverTimestamp(),
      });

      const yeniDetay = {
        alisFiyati: Number(f("alisFiyati").value) || 0,
        kargo: Number(f("kargo").value) || 0,
        vergi: Number(f("vergi").value) || 0,
        karYuzde: Number(f("karYuzde").value) || 0,
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
