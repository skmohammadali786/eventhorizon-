import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// REPLACE THESE VALUES WITH YOUR ACTUAL FIREBASE PROJECT CONFIG
// You can find these in your Firebase Console > Project Settings
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "00000000000",
  appId: "1:00000000000:web:00000000000000"
};

// Initialize Firebase only if config is present (Mock safety)
let app;
let auth;
let db;
let functions;

try {
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        functions = getFunctions(app);
        console.log("Firebase initialized");
    } else {
        console.warn("Firebase config missing. Running in Mock Mode.");
    }
} catch (e) {
    console.error("Firebase init failed:", e);
}

export { auth, db, functions };