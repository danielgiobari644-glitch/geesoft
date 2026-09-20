/* ============================================================
   Giobari Daniel — Portfolio
   Firebase bootstrap (modular Web SDK via CDN, v12.19.0)
   Auth + Firestore + Analytics. No Firebase Storage is used —
   all media are externally hosted URLs stored in Firestore.
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyDTEMnocXA_ev2q4vbB9enMiNHeE_VWiJg",
  authDomain: "giobari-daniel.firebaseapp.com",
  projectId: "giobari-daniel",
  storageBucket: "giobari-daniel.firebasestorage.app",
  messagingSenderId: "920455475164",
  appId: "1:920455475164:web:554d4362639b2de48e2919",
  measurementId: "G-2M6ZZX1Z5D"
};

const app = initializeApp(firebaseConfig);

/* Analytics is optional — it can be blocked by ad-blockers or run in
   environments where it is unsupported. Never let it break the site. */
export let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (_) {
  /* non-fatal */
}

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
