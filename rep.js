import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { doc, getDoc, addDoc, collection, query, where, getDocs, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { exportExcel, exportPDF } from "./export.js";


const $ = (id) => document.getElementById(id);
let currentUser = null;
let repName = "";
let myRows = [];

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = "index.html"; return; }
  currentUser = user;
  const snap = await getDoc(doc(db, "reps", user.uid));
  repName = snap.exists() ? snap.data().name : user.email;
  $("repName").textContent = repName;
  loadMine();
});

$("logoutBtn").addEventListener("click", () => signOut(auth));

$("reason").addEventListener("change", (e) => {
  $("competitorBox").hidden = e.target.value !== "Chose competitor";
});

const num = (id) => ($(id).value === "" ? null : parseFloat($(id).value));

$("declineForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("submitBtn").disabled = true;
  $("msg").textContent = "";
  try {
    await addDoc(collection(db, "declines"), {
      repUid: currentUser.uid,
      repName,
      visitDate: $("visitDate").value,
      clientName: $("clientName").value.trim(),
      clientCompany: $("clientCompany").value.trim(),
      clientPhone: $("clientPhone").value.trim(),
      clientEmail: $("clientEmail").value.trim(),
      item: $("item").value.trim(),
      quantity: num("quantity"),
      priceQuoted: num("priceQuoted"),
      targetPrice: num("targetPrice"),
      reason: $("reason").value,
      competitor: $("competitor").value.trim(),
      competitorPrice: num("competitorPrice"),
      notes: $("notes").value.trim(),
      reconsider: $("reconsider").value,
      followUpDate: $("followUpDate").value,
      status: "Open",
      managerNotes: "",
      createdAt: serverTimestamp(),
      statusUpdatedAt: serverTimestamp()
    });
    $("declineForm").reset();
    $("competitorBox").hidden = true;
    $("msg").textContent = "Saved.";
    loadMine();
  } catch (err) {
    console.error(err);
    $("msg").textContent = "Couldn't save. Try again.";
  }
  $("submitBtn").disabled = false;
});

async function loadMine() {
  const q = query(collection(db, "declines"), where("repUid", "==", currentUser.uid));
  const snap = await getDocs(q);
  myRows = snap.docs.map((d) => d.data())
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const tbody = document.querySelector("#mine tbody");
  tbody.innerHTML = "";
  for (const r of myRows) {
    const tr = document.createElement("tr");
    for (const val of [r.visitDate, r.clientCompany, r.item, r.reason]) {
      const td = document.createElement("td");
      td.textContent = val ?? "";
      tr.appendChild(td);
    }
    const tdStatus = document.createElement("td");
    const badge = document.createElement("span");
    badge.textContent = r.status || "Open";
    badge.className = "status status-" + badge.textContent.toLowerCase().replace(/\s+/g, "-");
    tdStatus.appendChild(badge);
    tr.appendChild(tdStatus);
    tbody.appendChild(tr);
  }
}

$("exportXlsBtn").addEventListener("click", () => exportExcel(myRows, "my-declines", { rep: true }));
$("exportPdfBtn").addEventListener("click", () => exportPDF(myRows, "my-declines", "My Declined Sales", { rep: true }));