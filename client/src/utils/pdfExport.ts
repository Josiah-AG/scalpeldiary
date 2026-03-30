import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export function createPdfHeader(doc: jsPDF, title: string, subtitle: string) {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pw, 28, 'F');
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 28, pw, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('ScalpelDiary', 14, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprehensive Surgical Training Management System', 14, 21);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pw - 14, 12, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, pw - 14, 19, { align: 'right' });
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy')}`, pw - 14, 25, { align: 'right' });
}

export function addPdfFooter(doc: jsPDF, label: string) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const tp = (doc as any).getNumberOfPages();
  for (let i = 1; i <= tp; i++) {
    doc.setPage(i);
    doc.setDrawColor(200, 200, 200);
    doc.line(10, ph - 10, pw - 10, ph - 10);
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text(`ScalpelDiary  |  ${label}  |  Page ${i} of ${tp}`, pw / 2, ph - 6, { align: 'center' });
  }
}

export { jsPDF, autoTable };
