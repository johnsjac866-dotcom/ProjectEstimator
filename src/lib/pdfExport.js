import { jsPDF } from "jspdf";

const PRIMARY = [37, 87, 55]; // dark green matching app theme
const GRAY = [100, 100, 100];
const LIGHT_GRAY = [180, 180, 180];
const BLACK = [30, 30, 30];
const PAGE_W = 210; // A4 width mm
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;

function addHeader(doc, title, subtitle, date) {
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, PAGE_W, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(title, MARGIN, 11);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(date, PAGE_W - MARGIN, 11, { align: "right" });

  doc.setTextColor(...BLACK);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(subtitle, MARGIN, 25);

  return 32; // y position after header
}

function checkPageBreak(doc, y, needed = 10) {
  if (y + needed > 280) {
    doc.addPage();
    return 14;
  }
  return y;
}

// ─── PROJECT SUMMARY PDF ──────────────────────────────────────────────────────

export function generateProjectSummaryPDF({ project, areas, parseOps, OP_CONFIG, getOpsForArea, getEntryLabel }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const subtitle = [project.client_name, project.address].filter(Boolean).join("  ·  ");

  let y = addHeader(doc, `${project.name} — Project Summary`, subtitle, date);

  const totalOps = areas.reduce((sum, a) =>
    sum + getOpsForArea(a).reduce((s, op) => s + parseOps(a[OP_CONFIG[op].dataKey]).length, 0), 0);

  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(`${areas.length} area${areas.length !== 1 ? "s" : ""}  ·  ${totalOps} operation${totalOps !== 1 ? "s" : ""} configured`, MARGIN, y);
  y += 8;

  areas.forEach((area) => {
    const ops = getOpsForArea(area);
    const areaOps = ops.filter(op => parseOps(area[OP_CONFIG[op].dataKey]).length > 0);
    if (areaOps.length === 0) return;

    y = checkPageBreak(doc, y, 14);

    // Area header bar
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(MARGIN, y, CONTENT_W, 8, 1, 1, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLACK);
    doc.text(area.name, MARGIN + 3, y + 5.5);
    y += 11;

    areaOps.forEach(op => {
      const cfg = OP_CONFIG[op];
      const entries = parseOps(area[cfg.dataKey]);

      y = checkPageBreak(doc, y, 8);

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...PRIMARY);
      doc.text(`  ${op}`, MARGIN, y);
      y += 5;

      entries.forEach((entry, idx) => {
        y = checkPageBreak(doc, y, 6);
        const label = getEntryLabel(entry, idx);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...GRAY);
        doc.setFontSize(7.5);
        doc.text(`    • ${label}`, MARGIN, y);
        if (entry._flags?.length > 0) {
          doc.setTextColor(200, 100, 0);
          doc.text(` ⚑ Flagged`, MARGIN + 60, y);
          doc.setTextColor(...GRAY);
        }
        y += 5;
      });
      y += 1;
    });
    y += 3;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...LIGHT_GRAY);
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, 291, { align: "right" });
  }

  doc.save(`${project.name}_Project_Summary.pdf`);
}

// ─── ESTIMATION SUMMARY PDF ───────────────────────────────────────────────────

export function generateEstimationSummaryPDF({ project, areas, buckets, entryDescription, totalsFromEntries, getSubTypeKey }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const subtitle = [project.client_name, project.address].filter(Boolean).join("  ·  ");

  let y = addHeader(doc, `${project.name} — Estimation Summary`, subtitle, date);

  const totalEntries = buckets.reduce((s, b) => s + b.rows.length, 0);
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(`${areas.length} area${areas.length !== 1 ? "s" : ""}  ·  ${totalEntries} total entries`, MARGIN, y);
  y += 8;

  const nonTaxable = buckets.filter(b => !b.taxable);
  const taxable = buckets.filter(b => b.taxable);

  function renderSection(title, sectionBuckets, headerRgb) {
    if (sectionBuckets.length === 0) return;

    y = checkPageBreak(doc, y, 12);

    // Section label pill
    doc.setFillColor(...headerRgb);
    doc.roundedRect(MARGIN, y, 30, 6, 1, 1, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), MARGIN + 15, y + 4.2, { align: "center" });
    doc.setDrawColor(...LIGHT_GRAY);
    doc.line(MARGIN + 32, y + 3, MARGIN + CONTENT_W, y + 3);
    y += 10;

    sectionBuckets.forEach(cat => {
      y = checkPageBreak(doc, y, 12);

      const totals = totalsFromEntries(cat.dataKey, cat.rows.map(r => r.entry));

      // Category header
      doc.setFillColor(245, 245, 245);
      doc.rect(MARGIN, y, CONTENT_W, 7, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BLACK);
      doc.text(cat.label, MARGIN + 2, y + 4.8);
      if (totals) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...GRAY);
        doc.text(totals, PAGE_W - MARGIN - 2, y + 4.8, { align: "right" });
      }
      y += 9;

      // Group by sub-type then area
      const subGroups = {};
      cat.rows.forEach(({ area, entry }) => {
        const key = getSubTypeKey(cat.dataKey, entry);
        if (!subGroups[key]) subGroups[key] = { label: key, rows: [] };
        subGroups[key].rows.push({ area, entry });
      });

      const subGroupEntries = Object.entries(subGroups);
      const multiSub = subGroupEntries.length > 1;

      subGroupEntries.forEach(([subKey, { label, rows }]) => {
        if (multiSub) {
          y = checkPageBreak(doc, y, 7);
          doc.setFontSize(7.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...PRIMARY);
          doc.text(`  ${label}`, MARGIN, y);
          y += 5;
        }

        const byArea = rows.reduce((acc, { area, entry }) => {
          if (!acc[area.id]) acc[area.id] = { area, entries: [] };
          acc[area.id].entries.push(entry);
          return acc;
        }, {});

        Object.values(byArea).forEach(({ area, entries }) => {
          y = checkPageBreak(doc, y, 7);
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...GRAY);
          doc.text(`    ${area.name.toUpperCase()}`, MARGIN, y);
          y += 4.5;

          entries.forEach((entry, idx) => {
            y = checkPageBreak(doc, y, 5.5);
            const desc = entryDescription(cat.dataKey, entry) || `Entry #${idx + 1}`;
            doc.setFont("helvetica", "normal");
            doc.setTextColor(...GRAY);
            doc.setFontSize(7);
            const lines = doc.splitTextToSize(`      • ${desc}`, CONTENT_W - 4);
            lines.forEach(line => {
              y = checkPageBreak(doc, y, 5);
              doc.text(line, MARGIN, y);
              y += 4.5;
            });
          });
          y += 1;
        });
      });
      y += 3;
    });
    y += 2;
  }

  renderSection("Non-Taxable", nonTaxable, [80, 80, 80]);
  renderSection("Taxable", taxable, [180, 120, 0]);

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...LIGHT_GRAY);
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, 291, { align: "right" });
  }

  doc.save(`${project.name}_Estimation_Summary.pdf`);
}