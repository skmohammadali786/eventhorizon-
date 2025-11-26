import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// User Provided Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBMAfii7AKxIXQd4GrhH5oqK2Sd8M0m3I8",
  authDomain: "event-horizon-94dd8.firebaseapp.com",
  databaseURL: "https://event-horizon-94dd8-default-rtdb.firebaseio.com",
  projectId: "event-horizon-94dd8",
  storageBucket: "event-horizon-94dd8.firebasestorage.app",
  messagingSenderId: "1089214209790",
  appId: "1:1089214209790:web:daab17f09caf2f687d8faf",
  measurementId: "G-61RRRJTHM7"
};

let app;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    console.error("Firebase Initialization Error:", e);
}

export { auth, db };