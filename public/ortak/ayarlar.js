// ============================================================
//  FIREBASE AYARLARI
//  Firebase Console > Project settings > Your apps > Web app
//  bölümündeki "firebaseConfig" bilgilerini buraya yapıştırın.
//
//  Şimdilik "demo-avenuebaku" ile bilgisayarda (emulator) çalışır,
//  gerçek Firebase projesine gerek yoktur.
// ============================================================
export const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-avenuebaku.firebaseapp.com",
  projectId: "demo-avenuebaku",
  storageBucket: "demo-avenuebaku.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000",
};

// Sitelerin adresleri (e-posta doğrulama ve şifre sıfırlama linkleri buraya döner).
// Boş bırakılırsa o anki adres kullanılır.
export const MAGAZA_URL = ""; // örn. "https://avenueemporiumbaku.web.app"
export const ADMIN_URL = "";  // örn. "https://avenueemporiumbaku-admin.web.app"

// Para birimi
export const PARA = { kod: "AZN", simge: "₼" };
