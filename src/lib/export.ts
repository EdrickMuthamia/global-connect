"use client";

export type ReportRow = Record<string, string | number>;

const HEADERS: Record<string, string> = {
  id: "ID",
  name: "Full Name",
  email: "Email",
  country: "Country",
  account_status: "Account Status",
  verified: "Verified",
  payment_status: "Payment Status",
  payment_reference: "M-Pesa Reference",
  amount_kes: "Amount (KES)",
  payment_method: "Payment Method",
  payment_date: "Payment Date",
  joined: "Date Joined",
  // payments tab extras
  payment_id: "Payment ID",
  member_name: "Member Name",
  currency: "Currency",
  note: "Note",
  submitted_date: "Submitted Date",
};

function label(key: string) {
  return HEADERS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─── Excel (.xlsx) ─────────────────────────────────────────────────────── */
export async function exportXlsx(filename: string, title: string, rows: ReportRow[]) {
  const XLSX = await import("xlsx");
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const wsData = [
    [title],
    [`Generated: ${new Date().toLocaleString()}`],
    [],
    headers.map(label),
    ...rows.map((r) => headers.map((h) => r[h] ?? "")),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(label(h).length + 4, 18) }));

  // Merge title across all columns
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, filename);
}

/* ─── PDF ────────────────────────────────────────────────────────────────── */
export async function exportPdf(filename: string, title: string, rows: ReportRow[]) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Title
  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175); // blue-700
  doc.text("Global Connect", 14, 16);

  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text(title, 14, 24);

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated: ${new Date().toLocaleString()}  ·  Total records: ${rows.length}`, 14, 30);

  autoTable(doc, {
    startY: 35,
    head: [headers.map(label)],
    body: rows.map((r) => headers.map((h) => String(r[h] ?? ""))),
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    tableLineColor: [203, 213, 225],
    tableLineWidth: 0.2,
  });

  doc.save(filename);
}
