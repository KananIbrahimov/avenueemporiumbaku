// Firebase bağlantısı — SDK sürümü sadece bu dosyada yazılır.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getAuth, connectAuthEmulator, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  sendEmailVerification, sendPasswordResetEmail, updateProfile, reload,
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import {
  getFirestore, connectFirestoreEmulator,
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp, writeBatch, Timestamp, arrayUnion,
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { firebaseConfig } from "./ayarlar.js";

// Bilgisayarda (localhost) çalışırken gerçek Firebase yerine emulator kullanılır,
// böylece denemeler gerçek veritabanına dokunmaz.
export const YEREL = ["localhost", "127.0.0.1"].includes(location.hostname);
const ayar = YEREL ? { ...firebaseConfig, apiKey: "demo-api-key", projectId: "demo-avenuebaku" } : firebaseConfig;

export const app = initializeApp(ayar);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (YEREL) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

export {
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  sendEmailVerification, sendPasswordResetEmail, updateProfile, reload,
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp, writeBatch, Timestamp, arrayUnion,
};

/** Giriş durumu ilk kez belli olunca çözülür. */
export function mevcutKullanici() {
  return new Promise((resolve) => {
    const kapat = onAuthStateChanged(auth, (k) => { kapat(); resolve(k); });
  });
}

/** kullanicilar/{uid} profilini getirir (yoksa null). */
export async function profilGetir(uid) {
  const s = await getDoc(doc(db, "kullanicilar", uid));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}
