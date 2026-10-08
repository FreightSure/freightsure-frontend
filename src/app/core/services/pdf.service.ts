import { Injectable } from '@angular/core';

export interface PdfColumn {
  header: string;
  dataKey: string;
}

@Injectable({ providedIn: 'root' })
export class PdfService {

  async exportToPdf(
    data: any[],
    columns: PdfColumn[],
    title: string,
    filename: string
  ): Promise<void> {
    // Dynamic import to avoid SSR issues and keep bundle size small
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // ── Header bar ─────────────────────────────────────────────
    doc.setFillColor(37, 99, 235);          // Blue #2563eb
    doc.rect(0, 0, 297, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FreightSure — Fleet Management', 14, 10);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(title, 14, 18);

    // ── Date stamp ─────────────────────────────────────────────
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(8);
    const now = new Date().toLocaleString('fr-FR');
    doc.text(`Generated: ${now}`, 240, 18);

    // ── Table ──────────────────────────────────────────────────
    const head = [columns.map(c => c.header)];
    const body = data.map(row =>
      columns.map(c => {
        const val = row[c.dataKey];
        if (val === null || val === undefined) return '—';
        // Format dates
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
          return new Date(val).toLocaleDateString('fr-FR');
        }
        return String(val);
      })
    );

    autoTable(doc, {
      head,
      body,
      startY: 26,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
      tableLineColor: [226, 232, 240],
      tableLineWidth: 0.1
    });

    // ── Footer ─────────────────────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} / ${pageCount}`, 280, 205, { align: 'right' });
      doc.text('FreightSure © 2026', 14, 205);
    }

    doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}
