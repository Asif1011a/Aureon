import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCmhCgi4250eFa-fSRrybNE_GFffa-QpRQ",
  authDomain: "aureon-7147b.firebaseapp.com",
  projectId: "aureon-7147b",
  storageBucket: "aureon-7147b.firebasestorage.app",
  messagingSenderId: "981580485913",
  appId: "1:981580485913:web:f4134b8cafa374f2cd6188",
  measurementId: "G-W21998BYH7"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
export default app;
