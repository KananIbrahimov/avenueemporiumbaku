// Ayarlar → Kateqoriyalar / Brendlər / Ölçülər / Rənglər
// Hər birində: axtarış, əlavə et, adını dəyiş, sil. Neçə məhsulda istifadə olunduğu görünür.
import {
  db, collection, doc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp,
} from "../../ortak/firebase.js";
import { t, yerel, DILLER } from "../../ortak/i18n.js";
import { $, kacis, bildir, hataMesaji } from "../../ortak/yardim.js";
import { kategorileriGetir } from "./veri.js";
import { ozelMi, ozelIkon, kategoriyeAit } from "../../ortak/kategori.js";
import { siyahilariGetir, siyahiYaz, markalariTohumla } from "./siyahilar.js";
import { adSorus, kategoriAdlariSor } from "./secici.js";
import { renkNoktasi } from "../../ortak/renk.js";

const norm = (s) => String(s || "").toLocaleLowerCase("az").trim();
const ILK_DIL = DILLER[0].kod;

// ---------- Hər siyahı üçün adapter ----------
function metinSiyahisi(ad, sahe, coxlu) {
  // Brend (tək dəyər), ölçü və rəng (massiv) — ayarlar/siyahilar sənədində
  const istifade = (u, deger) => (coxlu ? (u[sahe] || []).includes(deger) : u[sahe] === deger);
  return {
    async yukle(urunler) {
      const liste = ad === "markalar" ? await markalariTohumla(urunler) : (await siyahilariGetir())[ad];
      return liste.map((x) => ({ id: x, ad: x, say: urunler.filter((u) => istifade(u, x)).length }));
    },
    async elave(yeni, siyahi) { await siyahiYaz(ad, [...siyahi.map((x) => x.id), yeni]); },
    async adDeyis(kohne, yeni, siyahi, urunDocs) {
      await siyahiYaz(ad, siyahi.map((x) => (x.id === kohne ? yeni : x.id)));
      // Bu dəyəri istifadə edən məhsulları da yenilə
      const deyisen = urunDocs.filter((d) => istifade(d.data(), kohne));
      for (let i = 0; i < deyisen.length; i += 400) {
        const b = writeBatch(db);
        for (const d of deyisen.slice(i, i + 400)) {
          const v = d.data();
          b.update(doc(db, "urunler", d.id), {
            [sahe]: coxlu ? [...new Set(v[sahe].map((x) => (x === kohne ? yeni : x)))] : yeni,
          });
        }
        await b.commit();
      }
      return deyisen.length;
    },
    async sil(id, siyahi) { await siyahiYaz(ad, siyahi.filter((x) => x.id !== id).map((x) => x.id)); },
    async sirala(siyahi) { await siyahiYaz(ad, siyahi.map((x) => x.id)); },
    silmekOlar: () => true,
  };
}

const kategoriAdapter = {
  async yukle(urunler) {
    const k = await kategorileriGetir();
    return k.map((x) => ({ id: x.id, ad: yerel(x.ad), ham: x, ozel: ozelMi(x.id), say: urunler.filter((u) => kategoriyeAit(u, x.id)).length }));
  },
  async elave(yeni, siyahi) {
    const sira = siyahi.length ? Math.max(...siyahi.map((k) => k.ham?.sira ?? 0)) + 1 : 0;
    await setDoc(doc(collection(db, "kategoriler")), { ad: yeni, sira, olusturma: serverTimestamp() });
  },
  // Yeni kateqoriya: hər dildə ad məcburidir
  yeniSor: (ilk) => kategoriAdlariSor(ilk),
  // Hər dil üçün ayrıca ad soruşulur (AZ məcburi, digərləri boş qala bilər)
  adSor: (x) => kategoriAdlariSor(x.ham?.ad || {}, t("admin.kaydet")),
  async adDeyis(id, yeni) {
    await updateDoc(doc(db, "kategoriler", id), { ad: yeni });
    return 0;
  },
  async sil(id) { await deleteDoc(doc(db, "kategoriler", id)); },
  async sirala(siyahi) { await Promise.all(siyahi.map((k, i) => updateDoc(doc(db, "kategoriler", k.id), { sira: i }))); },
  // Sale və 24 saat heç vaxt silinmir; içində məhsul olan kateqoriya da silinmir
  silmekOlar: (x) => !x.ozel && x.say === 0,
  silinmezMesaj: (x) => (x.ozel ? "admin.kat.ozelSilinmez" : "admin.kat.doluSilinmez"),
};

export const SIYAHILAR = {
  kategoriler: { basliq: "admin.sekme.kategoriler", tek: "secici.yeniKategori", ikon: "🗂️", adapter: kategoriAdapter },
  markalar: { basliq: "admin.siyahi.markalar", tek: "secici.yeniMarka", ikon: "🏷️", adapter: metinSiyahisi("markalar", "marka", false) },
  olculer: { basliq: "admin.siyahi.olculer", tek: "secici.yeniOlcu", ikon: "📏", adapter: metinSiyahisi("olculer", "olculer", true) },
  renkler: { basliq: "admin.siyahi.renkler", tek: "secici.yeniRenk", ikon: "🎨", adapter: metinSiyahisi("renkler", "renkler", true) },
};

/** Kateqoriyanın tərcüməsi çatışmayan dilləri: "⚠ RU" */
function eksikDil(x) {
  if (!x.ham?.ad) return "";
  const yox = DILLER.filter((d) => !x.ham.ad[d.kod]).map((d) => d.kod.toUpperCase());
  return yox.length ? ` <span class="dil-eksik" title="${kacis(t("admin.kat.tercumeYox"))}">⚠ ${yox.join(", ")}</span>` : "";
}

export function siyahiSekmesi(novu) {
  return async function (kok) {
    const c = SIYAHILAR[novu];
    kok.innerHTML = `<p class="bos">${kacis(t("genel.yukleniyor"))}</p>`;
    let urunDocs = [], siyahi = [], ara = "";

    async function yukle() {
      const us = await getDocs(collection(db, "urunler"));
      urunDocs = us.docs;
      siyahi = await c.adapter.yukle(urunDocs.map((d) => d.data()));
    }

    function ciz() {
      const q = norm(ara);
      const gorunen = siyahi.filter((x) => !q || norm(x.ad).includes(q));
      $("#s-liste", kok).innerHTML = gorunen.length ? gorunen.map((x) => {
        return `<div class="siyahi-satir" data-id="${kacis(x.id)}">
          <div class="siyahi-ad"><b>${novu === "renkler" ? renkNoktasi(x.ad) : ""}${x.ozel ? `${ozelIkon(x.id)} ` : ""}${kacis(x.ad)}${x.ozel ? ` <span class="soluk" title="${kacis(t("admin.kat.sabit"))}">📌</span>` : ""}</b><span class="soluk">${kacis(t("admin.siyahi.mehsulSay", { say: x.say }))}</span>${eksikDil(x)}</div>
          <div class="siyahi-aksiyon">
            <button type="button" class="ikon-btn" data-is="deyis" aria-label="${kacis(t("admin.siyahi.deyis"))}">✎</button>
            <button type="button" class="ikon-btn tehlike" data-is="sil" aria-label="${kacis(t("admin.sil"))}">✕</button>
          </div></div>`;
      }).join("") : `<p class="bos">${kacis(t(siyahi.length ? "vitrin.bos" : "secici.bos"))}</p>`;
      $("#s-say", kok).textContent = siyahi.length;
    }

    async function yenile() { await yukle(); ciz(); }

    async function isle(id, is) {
      const x = siyahi.find((y) => y.id === id);
      if (!x) return;
      try {
        if (is === "deyis") {
          if (c.adapter.adSor) {
            const ad = await c.adapter.adSor(x);
            if (!ad) return;
            if (siyahi.some((y) => y.id !== id && norm(y.ham?.ad?.[ILK_DIL]) === norm(ad[ILK_DIL]))) return bildir(t("admin.siyahi.varDir"), "hata");
            await c.adapter.adDeyis(id, ad);
            bildir(t("admin.kaydedildi"), "basari");
            await yenile();
            return;
          }
          const yeni = await adSorus(t("admin.siyahi.deyisBaslik"), x.ad);
          if (!yeni || yeni === x.ad) return;
          if (siyahi.some((y) => y.id !== id && norm(y.ad) === norm(yeni))) return bildir(t("admin.siyahi.varDir"), "hata");
          const n = await c.adapter.adDeyis(id, yeni, siyahi, urunDocs);
          bildir(n ? t("admin.siyahi.deyisdiMehsul", { say: n }) : t("admin.kaydedildi"), "basari");
        } else if (is === "sil") {
          if (!c.adapter.silmekOlar(x)) return bildir(t(c.adapter.silinmezMesaj?.(x) || "admin.kat.doluSilinmez"), "hata");
          const sual = x.say ? t("admin.siyahi.silIstifade", { ad: x.ad, say: x.say }) : t("admin.siyahi.silOnay", { ad: x.ad });
          if (!confirm(sual)) return;
          await c.adapter.sil(id, siyahi);
          bildir(t("admin.silindi"), "basari");
        }
        await yenile();
      } catch (e) { bildir(hataMesaji(e), "hata"); }
    }

    try { await yukle(); } catch (e) { kok.innerHTML = `<p class="bos">${kacis(hataMesaji(e))}</p>`; return; }

    kok.innerHTML = `
      <div class="bolum-ust">
        <h1>${c.ikon} ${kacis(t(c.basliq))} <span class="soluk" id="s-say"></span></h1>
        <a class="btn btn-ince btn-kucuk" href="#ayarlar">← ${kacis(t("admin.sekme.ayarlar"))}</a>
      </div>
      <div class="siyahi-ust">
        <div class="axtaris">
          <svg class="ikon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>
          <input type="search" id="s-ara" placeholder="${kacis(t("secici.axtar"))}" autocomplete="off">
        </div>
        <button type="button" class="btn" id="s-yeni">+ ${kacis(t("secici.elaveEt"))}</button>
      </div>
      ${novu === "kategoriler" ? `<p class="ipucu">${kacis(t("admin.kat.siraIpucu"))}</p>` : ""}
      <div class="kart siyahi-kart" id="s-liste"></div>`;
    ciz();

    $("#s-ara", kok).addEventListener("input", (e) => { ara = e.target.value; ciz(); });
    $("#s-yeni", kok).addEventListener("click", async () => {
      if (c.adapter.yeniSor) {
        const ad = await c.adapter.yeniSor(ara.trim());
        if (!ad) return;
        if (siyahi.some((y) => norm(y.ham?.ad?.[ILK_DIL]) === norm(ad[ILK_DIL]))) return bildir(t("admin.siyahi.varDir"), "hata");
        try {
          await c.adapter.elave(ad, siyahi);
          bildir(t("secici.elaveOlundu", { ad: yerel(ad) }), "basari");
          ara = ""; $("#s-ara", kok).value = "";
          await yenile();
        } catch (e) { bildir(hataMesaji(e), "hata"); }
        return;
      }
      const yeni = await adSorus(t(c.tek), ara.trim());
      if (!yeni) return;
      if (siyahi.some((y) => norm(y.ad) === norm(yeni))) return bildir(t("admin.siyahi.varDir"), "hata");
      try {
        await c.adapter.elave(yeni, siyahi);
        bildir(t("secici.elaveOlundu", { ad: yeni }), "basari");
        ara = ""; $("#s-ara", kok).value = "";
        await yenile();
      } catch (e) { bildir(hataMesaji(e), "hata"); }
    });
    $("#s-liste", kok).addEventListener("click", (e) => {
      const b = e.target.closest("[data-is]");
      if (b) isle(b.closest("[data-id]").dataset.id, b.dataset.is);
    });
  };
}

/** Ayarlar səhifəsi üçün saylar */
export async function siyahiSaylari() {
  const [k, s, us] = await Promise.all([kategorileriGetir(), siyahilariGetir(), getDocs(collection(db, "urunler"))]);
  const markalar = await markalariTohumla(us.docs.map((d) => d.data()));
  return { kategoriler: k.length, markalar: markalar.length, olculer: s.olculer.length, renkler: s.renkler.length };
}
