const COLS = [
  ["Date", "visitDate"], ["Rep", "repName"], ["Company", "clientCompany"],
  ["Client", "clientName"], ["Phone", "clientPhone"], ["Email", "clientEmail"],
  ["Item", "item"], ["Qty", "quantity"], ["Price quoted", "priceQuoted"],
  ["Target price", "targetPrice"], ["Reason", "reason"], ["Competitor", "competitor"],
  ["Competitor price", "competitorPrice"], ["Rep notes", "notes"],
  ["Would reconsider", "reconsider"], ["Follow-up date", "followUpDate"],
  ["Status", "status"], ["Manager notes", "managerNotes"]
];

const money = (n) =>
  n == null || n === "" ? "" :
  "R " + Number(n).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\s/g, " ");

const PDF_COLS = [
  ["Date", "visitDate"], ["Rep", "repName"], ["Company", "clientCompany"],
  ["Client", "clientName"], ["Item", "item"], ["Qty", "quantity"],
  ["Quoted", "priceQuoted", money], ["Target", "targetPrice", money],
  ["Reason", "reason"], ["Competitor", "competitor"], ["Status", "status"],
  ["Manager notes", "managerNotes"]
];

const pick = (list, opts) => (opts.rep ? list.filter((c) => c[1] !== "managerNotes") : list);

export function exportExcel(rows, name = "declines", opts = {}) {
  const cols = pick(COLS, opts);
  const data = [cols.map((c) => c[0]), ...rows.map((r) => cols.map((c) => r[c[1]] ?? ""))];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = cols.map((c) => ({ wch: Math.max(12, c[0].length + 2) }));

  const moneyKeys = ["priceQuoted", "targetPrice", "competitorPrice"];
  cols.forEach((c, ci) => {
    if (!moneyKeys.includes(c[1])) return;
    for (let ri = 1; ri < data.length; ri++) {
      const cell = ws[XLSX.utils.encode_cell({ r: ri, c: ci })];
      if (cell && cell.t === "n") cell.z = '"R" #,##0.00';
    }
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Declines");
  XLSX.writeFile(wb, name + ".xlsx");
}

function loadLogo() {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = "logo.jpg";
  });
}

export async function exportPDF(rows, name = "declines", title = "Declined Sales Report", opts = {}) {
  const cols = pick(PDF_COLS, opts);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  let y = 30;

  try {
    const logo = await loadLogo();
    const w = 140, h = (w * logo.naturalHeight) / logo.naturalWidth;
    doc.addImage(logo, "JPEG", 30, y, w, h);
    y += h + 12;
  } catch (e) { /* export without logo if it fails to load */ }

  doc.setFontSize(14);
  doc.text(title, 30, y + 10);
  doc.setFontSize(8);
  doc.text(`Generated ${new Date().toLocaleDateString("en-ZA")} - ${rows.length} records`, 30, y + 24);

  doc.autoTable({
    startY: y + 34,
    head: [cols.map((c) => c[0])],
    body: rows.map((r) => cols.map((c) => (c[2] ? c[2](r[c[1]]) : r[c[1]] ?? ""))),
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: { fillColor: [29, 78, 216] },
    margin: { left: 30, right: 30 }
  });
  doc.save(name + ".pdf");
}