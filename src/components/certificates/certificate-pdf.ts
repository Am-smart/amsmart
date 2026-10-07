import type { CertificateDTO } from '@/lib/types';

/**
 * Client-side PDF rendering. `jspdf` is imported dynamically so it never
 * enters the SSR/route bundle. Layout follows a formal academic certificate:
 * portrait, parchment background, institution header, emblem, italic
 * attestation wording, award title, seal + signature lines and a
 * verification footer.
 */
export async function downloadCertificatePdf(cert: CertificateDTO): Promise<void> {
  const doc = await renderCertificatePdf(cert);
  doc.save(`certificate-${cert.code}.pdf`);
}

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export async function renderCertificatePdf(cert: CertificateDTO) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const cx = w / 2;
  const center = (text: string, y: number) => doc.text(text, cx, y, { align: 'center' });
  const accent = /^#[0-9a-fA-F]{6}$/.test(cert.template_accent) ? cert.template_accent : '#1e40af';
  const A = [
    parseInt(accent.slice(1, 3), 16),
    parseInt(accent.slice(3, 5), 16),
    parseInt(accent.slice(5, 7), 16),
  ] as const;
  const INK = [30, 30, 40] as const;
  const MUTED = [90, 90, 100] as const;

  // Parchment background + thin accent frame
  doc.setFillColor(248, 243, 228);
  doc.rect(0, 0, w, h, 'F');
  doc.setDrawColor(...A);
  doc.setLineWidth(1.2);
  doc.rect(22, 22, w - 44, h - 44);
  doc.setLineWidth(0.4);
  doc.rect(28, 28, w - 56, h - 56);

  // Institution header
  doc.setFont('times', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...INK);
  center('SMART LMS ACADEMY', 85);
  doc.setFontSize(13);
  center('OFFICIAL CERTIFICATE', 104);

  // Emblem (accent ring with monogram)
  const ey = 175;
  doc.setDrawColor(...A);
  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(3);
  doc.circle(cx, ey, 40, 'FD');
  doc.setLineWidth(1);
  doc.circle(cx, ey, 32);
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...A);
  center('SL', ey + 8);

  // Attestation
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(24);
  doc.setTextColor(...INK);
  center('This is to Certify that', 275);

  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  center((cert.recipient_name || 'Student').toUpperCase(), 310);

  // Body wording (template) + date line
  const issuedDate = cert.issued_at ? new Date(cert.issued_at) : new Date();
  const dateLine = `on the ${ordinal(issuedDate.getDate())} day of ${issuedDate.toLocaleString('en-GB', { month: 'long' })}, ${issuedDate.getFullYear()}`;
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(14);
  doc.setTextColor(...MUTED);
  const bodyLines = doc.splitTextToSize(cert.template_body || 'has successfully completed', w - 200) as string[];
  const lines = [...bodyLines, dateLine, 'been awarded the'];
  doc.text(lines, cx, 350, { align: 'center', lineHeightFactor: 1.45 });
  let y = 350 + lines.length * 14 * 1.45 + 22;

  // Award
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...A);
  center(cert.title || 'Certificate of Completion', y);
  y += 24;
  doc.setFont('times', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  center('in', y);
  y += 22;
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(16);
  const courseLines = doc.splitTextToSize(cert.course_title || 'Course', w - 160) as string[];
  doc.text(courseLines, cx, y, { align: 'center', lineHeightFactor: 1.3 });
  y += courseLines.length * 16 * 1.3;
  if (cert.final_grade !== null && cert.final_grade !== undefined) {
    doc.setFont('times', 'italic');
    doc.setFontSize(13);
    center('with', y + 4);
    doc.setFont('times', 'bolditalic');
    doc.setFontSize(14);
    center(`FINAL GRADE: ${cert.final_grade}%`, y + 24);
  }

  // Seal + signatures
  const sy = h - 150;
  doc.setDrawColor(...A);
  doc.setLineWidth(1.5);
  doc.circle(95, sy - 10, 32);
  doc.setFont('times', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(...INK);
  doc.text('Seal', 140, sy + 6);
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.6);
  doc.line(200, sy - 8, 330, sy - 8);
  doc.line(360, sy - 8, 490, sy - 8);
  doc.text('Director of Studies', 265, sy + 8, { align: 'center' });
  doc.text('Registrar', 425, sy + 8, { align: 'center' });

  // Verification footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`No. ${cert.code}`, w - 50, h - 70, { align: 'right' });
  if (typeof window !== 'undefined') {
    center(`Verify authenticity at ${window.location.origin}/verify?code=${cert.code}`, h - 52);
  }

  return doc;
}
