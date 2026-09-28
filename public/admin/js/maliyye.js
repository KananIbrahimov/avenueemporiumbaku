// Sifariş maliyyəsi: "Qəbul et" pəncərəsi (alış, kargo, vergi, satış, bəh) və məlumat qatı.
// Xərclər siparisMaliyye/{sifarişId} sənədində saxlanılır (YALNIZ admin oxuyur).
// Müştərinin sifarişinə yalnız bəh (beh) və ödəyəcəyi məbləğ (odenecek) yazılır — müştəri bunları görür.
import { db, doc, getDoc, getDocs, setDoc, updateDoc, collection, Timestamp } from "../../ortak/firebase.js";
import { t } from "../../ortak/i18n.js";
import { para } from "../../ortak/fiyat.js";
import { $, kacis, bildir, hataMesaji } from "../../ortak/yardim.js";
import { detayGetir } from "./veri.js";

const sayi = (x) => { const n = parseFloat(String(x ?? "").replace(",", ".")); return Number.isFinite(n) ? n : 0; };
const iki = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

export async function maliyyeGetir(id) {
  try { const s = await getDoc(doc(db, "siparisMaliyye", id)); return s.exists() ? s.data() : null; }
  catch { return null; }
}

export async function butunMaliyye() {
  const s = await getDocs(collection(db, "siparisMaliyye"));
  return new Map(s.docs.map((d) => [d.id, d.data()]));
}

/**
 * Pəncərə: qəbul zamanı (rejim "qebul") və ya sonradan düzəliş üçün (rejim "duzelt").
 * @param o sifariş; @param durumDegistir (id, durum, elave) => Promise
 */
export async function maliyyePenceresi(o, { rejim = "duzelt", hedef = null, fokus = null, behTeklif = null, durumDegistir }) {
  // rejim "kec": pəncərə təsdiqlənəndə sifariş "hedef" statusuna keçir (odenildi / sifarisVerildi / gomrukde)
  const [evvel, d] = await Promise.all([maliyyeGetir(o.id), detayGetir(o.urunId).catch(() => null)]);
  const adet = o.adet || 1;
  // Başlanğıc dəyərlər: əvvəl yazılıbsa onlar, yoxdursa məhsulun gizli detallarından × say
  const ilk = evvel || {
    alis: iki((d?.alisFiyati || 0) * adet),
    kargo: iki((d?.kargo || 0) * adet),
    vergi: iki((d?.vergi || 0) * adet),
    satis: iki(o.birimFiyat * adet),
    beh: o.beh ?? 0,
  };
  if (behTeklif != null && !(+ilk.beh > 0)) ilk.beh = behTeklif;
  const basliq = rejim === "kec" && hedef ? t(`admin.mal.${hedef}Baslik`) : t("admin.mal.duzeltBaslik");
  const valyutaQeyd = d?.alisValyuta && d.alisValyuta !== "AZN" && d.alisMebleg
    ? `${t("admin.mal.menbe")}: ${d.alisMebleg} ${d.alisValyuta} × ${d.kurs} × ${adet}` : "";

  return new Promise((bitdi) => {
    const arxa = document.createElement("div");
    arxa.className = "modal-arxa";
    arxa.innerHTML = `<form class="modal mal-modal" novalidate>
      <div class="modal-ust"><h2>${kacis(basliq)}</h2></div>
      <div class="soluk" style="margin:-6px 0 12px">${kacis(o.musteriAd)} · ${kacis(o.urunAd)} · ×${adet}</div>
      <div class="alan"><label>💵 ${kacis(t("admin.mal.alis"))} (₼)</label><input name="alis" inputmode="decimal" value="${ilk.alis || ""}" placeholder="0.00">
        ${valyutaQeyd ? `<div class="ipucu">${kacis(valyutaQeyd)}</div>` : ""}</div>
      <div class="satir">
        <div class="alan"><label>🚚 ${kacis(t("admin.hesap.kargo"))} (₼)</label><input name="kargo" inputmode="decimal" value="${ilk.kargo || ""}" placeholder="0.00"></div>
        <div class="alan"><label>🧾 ${kacis(t("admin.hesap.vergi"))} (₼)</label><input name="vergi" inputmode="decimal" value="${ilk.vergi || ""}" placeholder="0.00"></div>
      </div>
      <div class="satir">
        <div class="alan"><label>💰 ${kacis(t("admin.mal.satis"))} (₼)</label><input name="satis" inputmode="decimal" value="${ilk.satis || ""}" placeholder="0.00"></div>
        <div class="alan"><label>🤝 ${kacis(t("admin.mal.beh"))} (₼)</label><input name="beh" inputmode="decimal" value="${ilk.beh || ""}" placeholder="0.00"></div>
      </div>
      <div class="xulase mal-xulase" id="mal-x"></div>
      <div class="aksiyonlar" style="justify-content:flex-end;margin-top:14px">
        <button type="button" class="btn btn-ince" data-legv>${kacis(t("secici.legv"))}</button>
        <button type="submit" class="btn">${kacis(t(rejim === "kec" ? "admin.mal.tesdiqle" : "admin.kaydet"))}</button>
      </div>
    </form>`;
    document.body.appendChild(arxa);
    const f = arxa.querySelector("form");
    const x = () => {
      const alis = sayi(f.alis.value), kargo = sayi(f.kargo.value), vergi = sayi(f.vergi.value);
      const satis = sayi(f.satis.value), beh = sayi(f.beh.value);
      const maya = iki(alis + kargo + vergi), qazanc = iki(satis - maya), qaliq = iki(satis - beh);
      return { alis, kargo, vergi, satis, beh, maya, qazanc, qaliq };
    };
    const ciz = () => {
      const v = x();
      $("#mal-x", arxa).innerHTML = `
        <div class="x-satir cem"><span>${kacis(t("admin.hesap.maya"))}</span><b>${para(v.maya)}</b></div>
        <div class="x-satir"><span>${kacis(t("admin.mal.satis"))}</span><b>${para(v.satis)}</b></div>
        <div class="x-satir buyuk"><span>${kacis(t("admin.hesap.qazanc"))}</span>
          <b style="color:${v.qazanc < 0 ? "var(--tehlike)" : "var(--basari)"}">${para(v.qazanc)}${v.maya > 0 ? ` · ${iki((v.qazanc / v.maya) * 100)}%` : ""}</b></div>
        <div class="x-satir"><span>${kacis(t("admin.mal.beh"))}</span><span>${para(v.beh)}</span></div>
        <div class="x-satir buyuk"><span>${kacis(t("admin.mal.qaliq"))}</span><b>${para(v.qaliq)}</b></div>`;
    };
    f.addEventListener("input", ciz);
    ciz();
    // Bu mərhələdə dəyişdiriləcək sahə vurğulanır və kursor ora qoyulur
    for (const ad of [].concat(fokus || [])) f.elements[ad]?.closest(".alan")?.classList.add("vurgulu");
    const ilkSahe = f.elements[[].concat(fokus || [])[0]];
    if (ilkSahe) setTimeout(() => { ilkSahe.focus(); ilkSahe.select?.(); }, 60);
    const bagla = (n) => { arxa.remove(); bitdi(n); };
    arxa.querySelector("[data-legv]").addEventListener("click", () => bagla(false));
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const v = x();
      if (!(v.satis > 0)) return bildir(t("admin.urun.fiyatGerekli"), "hata");
      if (v.beh > v.satis) return bildir(t("admin.mal.behCox"), "hata");
      const btn = f.querySelector("button[type=submit]");
      btn.disabled = true;
      try {
        await setDoc(doc(db, "siparisMaliyye", o.id), {
          alis: iki(v.alis), kargo: iki(v.kargo), vergi: iki(v.vergi), satis: iki(v.satis), beh: iki(v.beh),
          urunId: o.urunId, kullaniciId: o.kullaniciId, adet,
          qebulTarixi: evvel?.qebulTarixi || Timestamp.now(),
          guncelleme: Timestamp.now(),
        });
        const musteriUcun = { beh: iki(v.beh), odenecek: iki(v.satis) };
        if (rejim === "kec" && hedef) await durumDegistir(o.id, hedef, musteriUcun);
        else await updateDoc(doc(db, "siparisler", o.id), musteriUcun);
        bildir(t("admin.kaydedildi"), "basari");
        bagla(true);
      } catch (err) {
        bildir(hataMesaji(err), "hata");
        btn.disabled = false;
      }
    });
  });
}
