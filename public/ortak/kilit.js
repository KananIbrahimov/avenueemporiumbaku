// Face ID / Touch ID kilidi (cihazın öz biometrik yoxlaması — WebAuthn platform doğrulayıcı).
// - Ayarlar-dan açılır; yalnız bu cihazda və bu saytda işləyir.
// - Tətbiq açılanda və 1 dəqiqədən çox arxa fonda qalıb qayıdanda kilid ekranı çıxır.
// - "Şifrə ilə daxil ol" kilidi söndürür, hesabdan çıxarır və giriş səhifəsinə aparır.
import { t } from "./i18n.js";
import { kacis, bildir } from "./yardim.js";

const ACAR = "kilit";                 // localStorage: { id, tarix }
const ACIQ = "kilitAcildi";           // sessionStorage: kilid bu sessiyada açılıb
const GIZLI = "kilitGizlendi";        // sessionStorage: arxa fona keçmə vaxtı
const MUDDET = 60 * 1000;             // bu qədər arxa fonda qalanda yenidən kilidlə

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64Oxu = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
const tesadufi = (n) => crypto.getRandomValues(new Uint8Array(n));

const ss = {
  get: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { sessionStorage.setItem(k, v); } catch {} },
  del: (k) => { try { sessionStorage.removeItem(k); } catch {} },
};

export function kilitMelumat() {
  try { return JSON.parse(localStorage.getItem(ACAR)) || null; } catch { return null; }
}
export const kilitAktiv = () => !!kilitMelumat()?.id;

export async function kilitDestekleyir() {
  try {
    return !!(window.PublicKeyCredential &&
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
  } catch { return false; }
}

/** Kilidi qurur: cihazda biometrik açar yaradılır */
export async function kilitQur(ad = "AvenueBaku") {
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: tesadufi(32),
      rp: { name: "AvenueBaku", id: location.hostname },
      user: { id: tesadufi(16), name: ad, displayName: ad },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "discouraged" },
      timeout: 60000,
    },
  });
  localStorage.setItem(ACAR, JSON.stringify({ id: b64(cred.rawId), tarix: Date.now() }));
  ss.set(ACIQ, String(Date.now()));
}

export function kilitSondur() {
  try { localStorage.removeItem(ACAR); } catch {}
  ss.del(ACIQ);
  document.documentElement.classList.remove("kilitli");
  document.getElementById("kilit-ekran")?.remove();
}

/** Biometrik yoxlama (Face ID / Touch ID) — uğurlu olsa true */
export async function kilitYoxla() {
  const m = kilitMelumat();
  if (!m?.id) return true;
  await navigator.credentials.get({
    publicKey: {
      challenge: tesadufi(32),
      rpId: location.hostname,
      allowCredentials: [{ type: "public-key", id: b64Oxu(m.id), transports: ["internal"] }],
      userVerification: "required",
      timeout: 60000,
    },
  });
  return true;
}

// ---------- Kilid ekranı ----------
function ekranGoster(cixis) {
  document.documentElement.classList.add("kilitli");
  if (document.getElementById("kilit-ekran")) return;
  const el = document.createElement("div");
  el.id = "kilit-ekran";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.innerHTML = `
    <div class="kilit-ic">
      <div class="logo">AVENUE<small>BAKU</small></div>
      <div class="kilit-ikon">🔒</div>
      <p>${kacis(t("kilit.kilidlidir"))}</p>
      <button type="button" class="btn btn-tam" id="kilit-ac">${kacis(t("kilit.ac"))}</button>
      <button type="button" class="btn btn-link" id="kilit-sifre">${kacis(t("kilit.sifreIle"))}</button>
    </div>`;
  document.body.appendChild(el);
  const ac = async () => {
    try {
      await kilitYoxla();
      ss.set(ACIQ, String(Date.now()));
      document.documentElement.classList.remove("kilitli");
      el.remove();
    } catch (e) {
      if (e?.name !== "NotAllowedError" && e?.name !== "AbortError") bildir(t("kilit.xeta"), "hata");
    }
  };
  el.querySelector("#kilit-ac").addEventListener("click", ac);
  el.querySelector("#kilit-sifre").addEventListener("click", async () => {
    if (!confirm(t("kilit.sifreSual"))) return;
    kilitSondur();
    await cixis?.();
  });
  setTimeout(ac, 300); // mümkünsə dərhal Face ID pəncərəsini aç
}

/**
 * Səhifə açılanda çağırılır.
 * @param {{ girisli: () => Promise<boolean>, cixis: () => Promise<void> }} o
 */
export async function kilitBaslat(o) {
  if (!kilitAktiv()) { document.documentElement.classList.remove("kilitli"); return; }
  // Daxil olmayıbsa kilidə ehtiyac yoxdur (məs. hesabdan çıxıb)
  if (!(await o.girisli())) { kilitSondur(); return; }
  if (!ss.get(ACIQ)) ekranGoster(o.cixis);
  else document.documentElement.classList.remove("kilitli");

  document.addEventListener("visibilitychange", () => {
    if (!kilitAktiv()) return;
    if (document.visibilityState === "hidden") { ss.set(GIZLI, String(Date.now())); return; }
    const g = Number(ss.get(GIZLI) || 0);
    ss.del(GIZLI);
    if (g && Date.now() - g > MUDDET) { ss.del(ACIQ); ekranGoster(o.cixis); }
  });
}

/** Ayarlar-da "Face ID / Touch ID kilidi" bölməsi */
export function kilitAyari(kok, adAl = () => "AvenueBaku") {
  const ciz = async () => {
    const destek = await kilitDestekleyir();
    const aktiv = kilitAktiv();
    kok.innerHTML = `
      <label class="ayar-satir kecid-satir" style="padding:0;border:0">
        <span><b>${kacis(t("kilit.faceId"))}</b>
          <span class="soluk" style="display:block;font-size:.8rem">${kacis(t(destek ? "kilit.aciklama" : "kilit.desteklemir"))}</span></span>
        <input type="checkbox" class="kecid" id="kilit-kecid" ${aktiv ? "checked" : ""} ${destek || aktiv ? "" : "disabled"}>
      </label>`;
    kok.querySelector("#kilit-kecid").addEventListener("change", async (e) => {
      const k = e.target;
      k.disabled = true;
      try {
        if (k.checked) {
          await kilitQur(adAl());
          bildir(t("kilit.acildi"), "basari");
        } else {
          await kilitYoxla(); // söndürmək üçün də təsdiq
          kilitSondur();
          bildir(t("kilit.sonduruldu"), "basari");
        }
      } catch (err) {
        k.checked = !k.checked;
        if (err?.name !== "NotAllowedError" && err?.name !== "AbortError") bildir(t("kilit.xeta"), "hata");
      }
      ciz();
    });
  };
  ciz();
}
