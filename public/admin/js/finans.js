// Finans: aylıq hesabat — alınan mal, xərc, satış, qazanc (reallaşan + yolda olan), bəh, qalıq alacaq; qrafik və cədvəl
import { t, say } from "../../ortak/i18n.js";
import { para } from "../../ortak/fiyat.js";
import { $, $$, kacis, tarih, hataMesaji, durumEtiketi } from "../../ortak/yardim.js";
import { siparisler, siparisDinle, durumDegistir } from "./siparisler.js";
import { butunMaliyye, maliyyePenceresi } from "./maliyye.js";

const AYLAR = t("fin.aylar").split(",");
const iki = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
const ayAcar = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const QISA = t("fin.aylarQisa").split(",");
const ayAdi = (a, qisa = false) => { const [y, m] = a.split("-").map(Number); return qisa ? QISA[m - 1] : `${AYLAR[m - 1]} ${y}`; };
const ayKecir = (a, n) => { const [y, m] = a.split("-").map(Number); return ayAcar(new Date(y, m - 1 + n, 1)); };
const tarixOf = (ts) => (ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null);

let secilenAy = ayAcar(new Date());

/** Bir ayın göstəriciləri */
function hesabla(sipler, maliyye, ay) {
  const r = { sifaris: 0, mal: 0, xerc: 0, satis: 0, qazancReal: 0, qazancYolda: 0, beh: 0, alacaq: 0, legvSay: 0, legvXerc: 0, siyahi: [] };
  for (const o of sipler) {
    const m = maliyye.get(o.id);
    if (!m) continue;
    const d = tarixOf(m.qebulTarixi);
    if (!d || ayAcar(d) !== ay) continue;
    const maya = iki((m.alis || 0) + (m.kargo || 0) + (m.vergi || 0));
    const qazanc = iki((m.satis || 0) - maya);
    r.siyahi.push({ o, m, maya, qazanc });
    if (o.durum === "legv") { r.legvSay++; r.legvXerc += maya; continue; }
    r.sifaris++;
    r.mal += m.adet || o.adet || 1;
    r.xerc += maya;
    r.satis += m.satis || 0;
    r.beh += m.beh || 0;
    if (o.durum === "catdirildi") r.qazancReal += qazanc;
    else { r.qazancYolda += qazanc; r.alacaq += (m.satis || 0) - (m.beh || 0); }
  }
  for (const k of ["xerc", "satis", "qazancReal", "qazancYolda", "beh", "alacaq", "legvXerc"]) r[k] = iki(r[k]);
  r.qazanc = iki(r.qazancReal + r.qazancYolda);
  return r;
}

export async function finansSekmesi(ana) {
  const kok = document.createElement("div");
  ana.appendChild(kok);
  kok.innerHTML = `<p class="bos">${kacis(t("genel.yukleniyor"))}</p>`;
  let maliyye;
  try { maliyye = await butunMaliyye(); }
  catch (e) { kok.innerHTML = `<p class="bos">${kacis(hataMesaji(e))}</p>`; return; }

  const ciz = () => {
    const r = hesabla(siparisler, maliyye, secilenAy);
    const aylar = Array.from({ length: 6 }, (_, i) => ayKecir(secilenAy, i - 5));
    const tarix = aylar.map((a) => ({ a, ...hesabla(siparisler, maliyye, a) }));
    const maks = Math.max(1, ...tarix.map((x) => Math.max(x.xerc, x.satis)));
    const maksQ = Math.max(1, ...tarix.map((x) => Math.abs(x.qazanc)));
    const kpi = (ikon, ad, deger, sinif = "", alt = "") =>
      `<div class="kpi ${sinif}"><span class="kpi-ad">${ikon} ${kacis(ad)}</span><b>${deger}</b>${alt ? `<small>${alt}</small>` : ""}</div>`;

    kok.innerHTML = `
      <div class="bolum-ust"><h1>📊 ${kacis(t("admin.sekme.finans"))}</h1></div>
      <div class="ay-sec">
        <button type="button" class="ikon-btn" data-ay="-1" aria-label="←">←</button>
        <b>${kacis(ayAdi(secilenAy))}</b>
        <button type="button" class="ikon-btn" data-ay="1" aria-label="→" ${secilenAy >= ayAcar(new Date()) ? "disabled" : ""}>→</button>
      </div>

      <div class="kpi-grid">
        ${kpi("📦", t("fin.alinanMal"), `${r.mal}`, "", kacis(say(r.sifaris, "fin.sifaris")))}
        ${kpi("💸", t("fin.xerc"), para(r.xerc), "xerc", kacis(t("fin.xercAlt")))}
        ${kpi("🧾", t("fin.satis"), para(r.satis), "satis")}
        ${kpi("📈", t("fin.qazanc"), para(r.qazanc), r.qazanc < 0 ? "menfi" : "musbet", r.xerc > 0 ? `${iki((r.qazanc / r.xerc) * 100)}%` : "")}
        ${kpi("✅", t("fin.qazancReal"), para(r.qazancReal), "", kacis(t("fin.qazancRealAlt")))}
        ${kpi("🚚", t("fin.qazancYolda"), para(r.qazancYolda), "", kacis(t("fin.qazancYoldaAlt")))}
        ${kpi("🤝", t("fin.beh"), para(r.beh))}
        ${kpi("⏳", t("fin.alacaq"), para(r.alacaq), "", kacis(t("fin.alacaqAlt")))}
        ${r.legvSay ? kpi("✕", t("fin.legv"), `${r.legvSay}`, "", para(r.legvXerc)) : ""}
      </div>

      <div class="bolum-baslik">${kacis(t("fin.qrafik1"))}</div>
      <div class="kart qrafik-kart">
        <div class="legend"><span><i class="s1"></i>${kacis(t("fin.satis"))}</span><span><i class="s2"></i>${kacis(t("fin.xerc"))}</span></div>
        <div class="qrafik" role="img" aria-label="${kacis(t("fin.qrafik1"))}">
          ${tarix.map((x) => `
            <div class="qrafik-ay ${x.a === secilenAy ? "secili" : ""}" data-ay-sec="${x.a}">
              <span class="deger"></span>
              <div class="sutunlar">
                <span class="sutun s1" style="height:${(x.satis / maks) * 100}%" data-ipucu="${kacis(`${ayAdi(x.a)} · ${t("fin.satis")}: ${para(x.satis)}`)}"></span>
                <span class="sutun s2" style="height:${(x.xerc / maks) * 100}%" data-ipucu="${kacis(`${ayAdi(x.a)} · ${t("fin.xerc")}: ${para(x.xerc)}`)}"></span>
              </div>
              <span class="ay-etiket">${kacis(ayAdi(x.a, true))}</span>
            </div>`).join("")}
        </div>
      </div>

      <div class="bolum-baslik">${kacis(t("fin.qrafik2"))}</div>
      <div class="kart qrafik-kart">
        <div class="qrafik qazanc-qrafik" role="img" aria-label="${kacis(t("fin.qrafik2"))}">
          ${tarix.map((x) => `
            <div class="qrafik-ay ${x.a === secilenAy ? "secili" : ""}" data-ay-sec="${x.a}">
              <span class="deger ${x.qazanc < 0 ? "menfi" : ""}">${x.qazanc ? Math.round(x.qazanc) : ""}</span>
              <div class="sutunlar"><span class="sutun s3 ${x.qazanc < 0 ? "menfi" : ""}" style="height:${(Math.abs(x.qazanc) / maksQ) * 100}%"
                data-ipucu="${kacis(`${ayAdi(x.a)} · ${t("fin.qazanc")}: ${para(x.qazanc)}`)}"></span></div>
              <span class="ay-etiket">${kacis(ayAdi(x.a, true))}</span>
            </div>`).join("")}
        </div>
      </div>

      <div class="bolum-baslik">${kacis(t("fin.cedvel"))}</div>
      <div class="kart" style="padding:6px 10px"><div class="tablo-kap"><table class="fin-cedvel">
        <thead><tr><th>${kacis(t("fin.ay"))}</th><th>${kacis(t("fin.xerc"))}</th><th>${kacis(t("fin.satis"))}</th><th>${kacis(t("fin.qazanc"))}</th></tr></thead>
        <tbody>${tarix.slice().reverse().map((x) => `<tr class="${x.a === secilenAy ? "secili" : ""}">
          <td>${kacis(`${ayAdi(x.a, true)} ${x.a.slice(0, 4)}`)}</td><td>${para(x.xerc)}</td><td>${para(x.satis)}</td>
          <td style="color:${x.qazanc < 0 ? "var(--tehlike)" : "var(--basari)"}">${para(x.qazanc)}</td></tr>`).join("")}</tbody>
      </table></div></div>

      <div class="bolum-baslik">${kacis(t("fin.ayinSifarisleri"))} · ${r.siyahi.length}</div>
      <div class="liste">
        ${r.siyahi.length ? r.siyahi.map(({ o, m, maya, qazanc }) => `
          <div class="kart fin-sip ${o.durum === "legv" ? "pasif" : ""}">
            <div class="ust-satir"><b>${kacis(o.musteriAd)}</b>${durumEtiketi(o.durum)}</div>
            <div class="soluk">${kacis(o.urunAd)} · ×${o.adet} · ${kacis(tarih(m.qebulTarixi))}</div>
            <div class="rakamlar">
              <span>${kacis(t("admin.hesap.maya"))}: <b>${para(maya)}</b></span>
              <span>${kacis(t("fin.satis"))}: <b>${para(m.satis)}</b></span>
              <span>${kacis(t("admin.hesap.qazanc"))}: <b style="color:${qazanc < 0 ? "var(--tehlike)" : "var(--basari)"}">${para(qazanc)}</b></span>
              <span>${kacis(t("admin.mal.beh"))}: <b>${para(m.beh || 0)}</b></span>
              <span>${kacis(t("admin.mal.qaliq"))}: <b>${para((m.satis || 0) - (m.beh || 0))}</b></span>
            </div>
            <div><button class="btn btn-ince btn-kucuk" data-mal="${kacis(o.id)}">💰 ${kacis(t("admin.mal.duzelt"))}</button></div>
          </div>`).join("") : `<p class="bos">${kacis(t("fin.bos"))}</p>`}
      </div>
      <div class="qrafik-ipucu" id="q-ipucu" hidden></div>`;

    $$("[data-ay]", kok).forEach((b) => b.addEventListener("click", () => { secilenAy = ayKecir(secilenAy, +b.dataset.ay); ciz(); }));
    $$("[data-ay-sec]", kok).forEach((el) => el.addEventListener("click", () => { secilenAy = el.dataset.aySec; ciz(); }));
    $$("[data-mal]", kok).forEach((b) => b.addEventListener("click", async () => {
      const o = siparisler.find((x) => x.id === b.dataset.mal);
      if (o && await maliyyePenceresi(o, { rejim: "duzelt", durumDegistir })) { maliyye = await butunMaliyye(); ciz(); }
    }));
    // Sütun üzərinə gələndə / toxunanda dəyər
    const ipucu = $("#q-ipucu", kok);
    $$(".sutun", kok).forEach((s) => {
      const goster = () => {
        const r2 = s.getBoundingClientRect();
        ipucu.textContent = s.dataset.ipucu;
        ipucu.hidden = false;
        ipucu.style.left = `${Math.min(window.innerWidth - 12 - ipucu.offsetWidth, Math.max(12, r2.left + r2.width / 2 - ipucu.offsetWidth / 2))}px`;
        ipucu.style.top = `${r2.top + window.scrollY - ipucu.offsetHeight - 8}px`;
      };
      s.addEventListener("pointerenter", goster);
      s.addEventListener("pointerleave", () => { ipucu.hidden = true; });
    });
  };
  ciz();
  const lequ = siparisDinle(async () => {
    if (!kok.isConnected) return lequ();
    try { maliyye = await butunMaliyye(); } catch {}
    ciz();
  });
}
