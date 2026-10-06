import type { CertificateDTO } from '@/lib/types';

/**
 * Client-side PDF rendering. `jspdf` is imported dynamically so it never
 * enters the SSR/route bundle.
 */
export async function downloadCertificatePdf(cert: CertificateDTO): Promise<void> {
  const doc = await renderCertificatePdf(cert);
  doc.save(`certificate-${cert.code}.pdf`);
}

export async function renderCertificatePdf(cert: CertificateDTO) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const center = (text: string, y: number) => doc.text(text, w / 2, y, { align: 'center' });
  const accent = /^#[0-9a-fA-F]{6}$/.test(cert.template_accent) ? cert.template_accent : '#1e40af';
  const accentRgb = [
    parseInt(accent.slice(1, 3), 16),
    parseInt(accent.slice(3, 5), 16),
    parseInt(accent.slice(5, 7), 16),
  ] as const;

  doc.setDrawColor(...accentRgb);
  doc.setLineWidth(3);
  doc.rect(28, 28, w - 56, h - 56);
  doc.setLineWidth(0.8);
  doc.rect(40, 40, w - 80, h - 80);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(...accentRgb);
  center(cert.title || 'Certificate of Completion', 130);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(100, 116, 139);
  center('This certifies that', 185);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...accentRgb);
  center(cert.recipient_name || 'Student', 235);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(100, 116, 139);
  const bodyLines = doc.splitTextToSize(cert.template_body || 'has successfully completed', w - 180) as string[];
  doc.text(bodyLines, w / 2, 275, { align: 'center', lineHeightFactor: 1.2 });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(15, 23, 42);
  const bodyOffset = Math.max(0, bodyLines.length - 1) * 14;
  center(cert.course_title || 'Course', 315 + bodyOffset);

  if (cert.final_grade !== null && cert.final_grade !== undefined) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    center(`Final grade: ${cert.final_grade}%`, 345 + bodyOffset);
  }

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  const issued = cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : '';
  doc.text(`Issued: ${issued}`, 70, h - 70);
  doc.text(`Verification code: ${cert.code}`, w - 70, h - 70, { align: 'right' });
  if (typeof window !== 'undefined') {
    doc.text(`Verify at ${window.location.origin}/verify?code=${cert.code}`, w / 2, h - 52, { align: 'center' });
  }

  return doc;
}
