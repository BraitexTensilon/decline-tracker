import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCVBVx3PLoEyTUEZmlnF2KEZa_mSjQjk9s",
  authDomain: "decline-tracker.firebaseapp.com",
  projectId: "decline-tracker",
  storageBucket: "decline-tracker.firebasestorage.app",
  messagingSenderId: "258479099355",
  appId: "1:258479099355:web:b5e63c5b4cd2a336dcabfe"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);