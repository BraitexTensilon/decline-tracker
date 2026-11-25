import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const msg = document.getElementById("msg");

async function route(user) {
  const snap = await getDoc(doc(db, "managers", user.uid));
  window.location.href = snap.exists() ? "dashboard.html" : "rep.html";
}

onAuthStateChanged(auth, (user) => { if (user) route(user); });

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "";
  try {
    await signInWithEmailAndPassword(
      auth,
      document.getElementById("email").value.trim(),
      document.getElementById("password").value
    );
  } catch (err) {
    msg.textContent = "Wrong email or password.";
  }
});

document.getElementById("resetLink").addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  if (!email) { msg.textContent = "Enter your email above first."; return; }
  try {
    await sendPasswordResetEmail(auth, email);
    msg.textContent = "Reset email sent. Check your junk folder.";
  } catch (err) {
    msg.textContent = "Couldn't send reset email.";
  }
});