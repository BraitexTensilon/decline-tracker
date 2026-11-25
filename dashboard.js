import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { doc, getDoc, collection, getDocs, updateDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { exportExcel, exportPDF } from "./export.js";

const $ = (id) => document.getElementById(id);
const STATUSES = ["Open", "Under Review", "Requote Sent", "Accepted", "Lost"];
let all = [];
let shown = [];

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = "index.html"; return; }
  const m = await getDoc(doc(db, "managers", user.uid));
  if (!m.exists()) { window.location.href = "rep.html"; return; }
  await load();
});

$("logoutBtn").addEventListener("click", () => signOut(auth));

async function load() {
  const snap = await getDocs(collection(db, "declines"));
  all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const reps = [...new Set(all.map((r) => r.repName).filter(Boolean))].sort();
  for (const r of reps) $("fRep").add(new Option(r, r));
  for (const s of STATUSES) $("fStatus").add(new Option(s, s));

  render();
}

["fRep", "fCompany", "fItem", "fStatus", "fFrom", "fTo"].forEach((id) =>
  $(id).addEventListener("input", render)
);

$("clearBtn").addEventListener("click", () => {
  ["fRep", "fCompany", "fItem", "fStatus", "fFrom", "fTo"].forEach((id) => ($(id).value = ""));
  render();
});

const value = (r) => (r.priceQuoted || 0) * (r.quantity || 1);
const money = (n) => "R " + n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function render() {
  const rep = $("fRep").value;
  const company = $("fCompany").value.trim().toLowerCase();
  const item = $("fItem").value.trim().toLowerCase();
  const status = $("fStatus").value;
  const from = $("fFrom").value;
  const to = $("fTo").value;

  shown = all
    .filter((r) =>
      (!rep || r.repName === rep) &&
      (!company || (r.clientCompany || "").toLowerCase().includes(company)) &&
      (!item || (r.item || "").toLowerCase().includes(item)) &&
      (!status || r.status === status) &&
      (!from || (r.visitDate || "") >= from) &&
      (!to || (r.visitDate || "") <= to)
    )
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  // Summary
  $("sCount").textContent = shown.length;
  $("sValue").textContent = money(shown.reduce((sum, r) => sum + value(r), 0));
  const counts = {};
  for (const r of shown) counts[r.reason] = (counts[r.reason] || 0) + 1;
  const ul = $("sReasons");
  ul.innerHTML = "";
  Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([reason, n]) => {
    const li = document.createElement("li");
    li.textContent = `${reason}: ${n}`;
    ul.appendChild(li);
  });

  // Table
  const tbody = document.querySelector("#tbl tbody");
  tbody.innerHTML = "";
  for (const r of shown) {
    const tr = document.createElement("tr");
    const text = (v) => { const td = document.createElement("td"); td.textContent = v ?? ""; tr.appendChild(td); };

    text(r.visitDate);
    text(r.repName);
    text(r.clientCompany);
    text(r.clientName);
    text([r.clientPhone, r.clientEmail].filter(Boolean).join(" / "));
    text(r.item);
    text(r.quantity);
    text(r.priceQuoted != null ? money(r.priceQuoted) : "");
    text(r.targetPrice != null ? money(r.targetPrice) : "");
    text(r.reason);
    text(r.competitor ? r.competitor + (r.competitorPrice != null ? ` (${money(r.competitorPrice)})` : "") : "");
    text(r.notes);

    const sel = document.createElement("select");
    for (const s of STATUSES) sel.add(new Option(s, s));
    sel.value = r.status || "Open";
    const paint = () => { sel.className = "status status-" + sel.value.toLowerCase().replace(/\s+/g, "-"); };
    paint();
    sel.addEventListener("change", paint);
    const tdSel = document.createElement("td");
    tdSel.appendChild(sel);
    tr.appendChild(tdSel);

    const notes = document.createElement("input");
    notes.type = "text";
    notes.value = r.managerNotes || "";
    const tdNotes = document.createElement("td");
    tdNotes.appendChild(notes);
    tr.appendChild(tdNotes);

    const btn = document.createElement("button");
    btn.textContent = "Save";
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      try {
        await updateDoc(doc(db, "declines", r.id), {
          status: sel.value,
          managerNotes: notes.value.trim(),
          statusUpdatedAt: serverTimestamp()
        });
        r.status = sel.value;
        r.managerNotes = notes.value.trim();
        btn.textContent = "Saved";
      } catch (err) {
        console.error(err);
        btn.textContent = "Error";
      }
      setTimeout(() => { btn.textContent = "Save"; btn.disabled = false; }, 1200);
    });
    const tdBtn = document.createElement("td");
    tdBtn.appendChild(btn);
    tr.appendChild(tdBtn);

    tbody.appendChild(tr);
  }
}

// Excel + Pdf export (exports whatever the current filters show)
$("exportXlsBtn").addEventListener("click", () => exportExcel(shown, "declines"));
$("exportPdfBtn").addEventListener("click", () => exportPDF(shown, "declines", "Declined Sales Report"));