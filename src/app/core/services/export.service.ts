import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ExportService {

  /**
   * Export any array of objects to CSV file
   */
  exportToCSV(data: any[], filename: string, columns?: { key: string; label: string }[]): void {
    if (!data || data.length === 0) {
      alert('No data to export.');
      return;
    }

    let headers: string[];
    let rows: string[][];

    if (columns) {
      headers = columns.map(c => c.label);
      rows = data.map(item =>
        columns.map(c => this.formatCell(item[c.key]))
      );
    } else {
      headers = Object.keys(data[0]);
      rows = data.map(item =>
        headers.map(h => this.formatCell(item[h]))
      );
    }

    const csv = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    this.downloadFile(csv, filename + '_' + this.dateStamp() + '.csv', 'text/csv');
  }

  private formatCell(value: any): string {
    if (value == null) return '';
    const str = String(value).replace(/"/g, '""');
    return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
  }

  private dateStamp(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob(['\uFEFF' + content], { type: mimeType + ';charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
