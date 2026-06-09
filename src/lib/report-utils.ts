import { jsPDF } from 'jspdf';

/**
 * Standardized utility for CSV and PDF report generation.
 */

/**
 * Exports data to CSV and triggers a browser download.
 * @param data Array of objects to export
 * @param filename Desired filename (without extension)
 */
export const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const val = row[header];
        const strVal = val === null || val === undefined ? '' : String(val);
        // Escape quotes and wrap in quotes if contains comma
        return `"${strVal.replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exports data to PDF and triggers a browser download.
 * @param title Report Title
 * @param headers Array of column headers
 * @param rows Array of rows (each row is an array of strings)
 * @param filename Desired filename (without extension)
 */
export const exportToPDF = (title: string, headers: string[], rows: string[][], filename: string) => {
  const doc = new jsPDF();

  // Add Title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);

  // Add Date
  const dateStr = new Date().toLocaleString();
  doc.text(`Generated on: ${dateStr}`, 14, 30);

  let y = 45;
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const cellWidth = (pageWidth - margin * 2) / headers.length;

  // Header Background
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 5, pageWidth - margin * 2, 8, 'F');

  // Header Text
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  headers.forEach((header, i) => {
    doc.text(header, margin + i * cellWidth + 2, y);
  });

  y += 10;

  // Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  rows.forEach((row, rowIndex) => {
    if (y > 280) {
      doc.addPage();
      y = 20;

      // Repeat Header on new page
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 5, pageWidth - margin * 2, 8, 'F');
      doc.setFont('helvetica', 'bold');
      headers.forEach((header, i) => {
        doc.text(header, margin + i * cellWidth + 2, y);
      });
      y += 10;
      doc.setFont('helvetica', 'normal');
    }

    // Zebra striping
    if (rowIndex % 2 === 1) {
        doc.setFillColor(252, 252, 252);
        doc.rect(margin, y - 5, pageWidth - margin * 2, 8, 'F');
    }

    row.forEach((cell, i) => {
      const text = String(cell);
      // Simple truncation
      let truncated = text;
      if (doc.getTextWidth(text) > cellWidth - 4) {
          truncated = text.substring(0, Math.floor(cellWidth / 3)) + '...';
      }
      doc.text(truncated, margin + i * cellWidth + 2, y);
    });

    // Bottom line for cell
    doc.setDrawColor(240, 240, 240);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);

    y += 8;
  });

  doc.save(`${filename}.pdf`);
};
