// Bəyəndiklərim: ürək qoyulan məhsullar
import { db, doc, getDoc } from "../ortak/firebase.js";
import { t } from "../ortak/i18n.js";
import { $, kacis } from "../ortak/yardim.js";
import { girisDinle } from "./ust.js";
import { favoriListesi, depoDinle } from "./depo.js";
import { kartHtml, urekleriBagla } from "./kart.js";

const kok = $("#urunler");
const onbellek = new Map(); // id → məhsul (və ya null: silinib / satışda deyil)
let uye = false;

async function ciz() {
  const idler = favoriListesi();
  const lazim = idler.filter((id) => !onbellek.has(id));
  await Promise.all(lazim.map(async (id) => {
    try {
      const s = await getDoc(doc(db, "urunler", id));
      onbellek.set(id, s.exists() && s.data().aktif ? { id, ...s.data() } : null);
    } catch { onbellek.set(id, null); } // pasif məhsulu qaydalar göstərmir
  }));
  const urunler = idler.map((id) => onbellek.get(id)).filter(Boolean);
  kok.innerHTML = urunler.length
    ? urunler.map((u) => kartHtml(u, uye)).join("")
    : `<div class="bos" style="grid-column:1/-1">
        <p style="font-size:2rem;margin:0">♡</p>
        <p>${kacis(t("begen.bos"))}</p>
        <a class="btn" href="./">${kacis(t("genel.vitrineDon"))}</a></div>`;
}

urekleriBagla(kok);
depoDinle(ciz);
girisDinle((d) => { uye = d.uye; ciz(); });
