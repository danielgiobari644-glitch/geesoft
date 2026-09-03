// GeeSoft — shared Firebase initialisation (Firebase JS SDK v12.18.0, modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC2f86cX0bra8X6c9NKqUOYVXIo0pvbMS0",
  authDomain: "geesoft10.firebaseapp.com",
  projectId: "geesoft10",
  storageBucket: "geesoft10.firebasestorage.app",
  messagingSenderId: "406375923858",
  appId: "1:406375923858:web:f331ab7423a10e5f94264b",
  measurementId: "G-NCV2ZW68F6"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
