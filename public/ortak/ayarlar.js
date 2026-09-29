// ============================================================
//  FIREBASE AYARLARI
//  Firebase Console > Project settings > Your apps > Web app
//  bölümündeki "firebaseConfig" bilgilerini buraya yapıştırın.
//
//  Not: localhost'ta açınca bu bilgiler yerine otomatik olarak
//  emulator kullanılır (gerçek veritabanına dokunulmaz).
// ============================================================
export const firebaseConfig = {
  apiKey: "AIzaSyCvUQO36ciwkoTF0gwDB07hiL4O3qCMk-k",
  authDomain: "avenueemporiumbaku.firebaseapp.com",
  projectId: "avenueemporiumbaku",
  storageBucket: "avenueemporiumbaku.firebasestorage.app",
  messagingSenderId: "36787456873",
  appId: "1:36787456873:web:24de88a27c5d016f4e0bf8",
};

// Sitelerin adresleri (e-posta doğrulama ve şifre sıfırlama linkleri buraya döner).
// Boş bırakılırsa o anki adres kullanılır.
export const MAGAZA_URL = "https://avenueemporiumbaku.web.app";

// Para birimi
export const PARA = { kod: "AZN", simge: "₼" };
