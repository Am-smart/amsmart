import type { CertificateDTO } from '@/lib/types';

/**
 * Client-side PDF rendering. `jspdf` is imported dynamically so it never
 * enters the SSR/route bundle.
 */
export async function downloadCertificatePdf(cert: CertificateDTO): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const center = (text: string, y: number) => doc.text(text, w / 2, y, { align: 'center' });

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(3);
  doc.rect(28, 28, w - 56, h - 56);
  doc.setLineWidth(0.8);
  doc.rect(40, 40, w - 80, h - 80);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(15, 23, 42);
  center(cert.title || 'Certificate of Completion', 130);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(100, 116, 139);
  center('This certifies that', 185);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(30, 64, 175);
  center(cert.recipient_name || 'Student', 235);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(100, 116, 139);
  center('has successfully completed', 275);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(15, 23, 42);
  center(cert.course_title || 'Course', 315);

  if (cert.final_grade !== null && cert.final_grade !== undefined) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    center(`Final grade: ${cert.final_grade}%`, 345);
  }

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  const issued = cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : '';
  doc.text(`Issued: ${issued}`, 70, h - 70);
  doc.text(`Verification code: ${cert.code}`, w - 70, h - 70, { align: 'right' });

  doc.save(`certificate-${cert.code}.pdf`);
}
