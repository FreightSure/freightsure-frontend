import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardStats, MonthlyStat } from '../../../core/services/dashboard.service';
import { ExportService } from '../../../core/services/export.service';
import { PdfService } from '../../../core/services/pdf.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class Dashboard implements OnInit {

  stats: DashboardStats | null = null;
  isLoading = true;

  // Chart config
  readonly chartHeight = 160;
  readonly chartWidth  = 560;
  readonly barGap      = 8;

  constructor(
    private dashboardService: DashboardService,
    private exportService: ExportService,
    private pdfService: PdfService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe({
      next:  (data) => { this.stats = data; this.isLoading = false; },
      error: (err)  => { this.isLoading = false; this.toast.error(`Dashboard error (HTTP ${err.status})`); }
    });
  }

  // ── Donut SVG helpers ──────────────────────────────────────────
  pct(value: number, total: number): number {
    return total === 0 ? 0 : Math.round((value / total) * 100);
  }
  donutDash(value: number, total: number): string {
    return `${this.pct(value, total) * 2.83} 283`;
  }
  donutOffset(segments: number[]): string {
    return `${-(segments.reduce((a, b) => a + b, 0) * 2.83)}`;
  }

  // ── Bar chart helpers ─────────────────────────────────────────
  barMax(data: MonthlyStat[]): number {
    return Math.max(...data.map(d => d.count), 1);
  }

  barH(count: number, data: MonthlyStat[]): number {
    return Math.round((count / this.barMax(data)) * this.chartHeight);
  }

  barY(count: number, data: MonthlyStat[]): number {
    return this.chartHeight - this.barH(count, data);
  }

  barWidth(data: MonthlyStat[]): number {
    const n = data.length || 1;
    return Math.floor((this.chartWidth - (n - 1) * this.barGap) / n);
  }

  barX(index: number, data: MonthlyStat[]): number {
    return index * (this.barWidth(data) + this.barGap);
  }

  // ── Status labels ─────────────────────────────────────────────
  missionStatusLabel(s: number): string {
    return ['Pending','In Progress','Completed','Cancelled'][s] ?? 'Unknown';
  }
  missionStatusClass(s: number): string {
    return ['pending','inprogress','completed','cancelled'][s] ?? '';
  }

  get currentDate(): string {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  // ── Exports ───────────────────────────────────────────────────
  exportMissions(): void {
    if (!this.stats?.recentMissions.length) return;
    this.exportService.exportToCSV(this.stats.recentMissions, 'recent_missions', [
      { key: 'origine',     label: 'From' },
      { key: 'destination', label: 'To' },
      { key: 'dateDebut',   label: 'Start Date' },
      { key: 'statusLabel', label: 'Status' }
    ]);
    this.toast.success('Missions exported!');
  }

  async exportPdf(): Promise<void> {
    if (!this.stats) return;
    const rows = [
      { kpi: 'Total Users',       value: this.stats.totalUsers },
      { kpi: 'Total Employees',   value: this.stats.totalEmployees },
      { kpi: 'Total Vehicles',    value: this.stats.totalVehicles },
      { kpi: 'Total Missions',    value: this.stats.totalMissions },
      { kpi: 'Total Deliveries',  value: this.stats.totalDeliveries },
      { kpi: 'Active Employees',  value: this.stats.activeEmployees },
      { kpi: 'Available Vehicles',value: this.stats.availableVehicles },
      { kpi: 'Pending Missions',  value: this.stats.pendingMissions },
      { kpi: 'Completed Missions',value: this.stats.completedMissions },
      { kpi: 'Delivered Deliveries', value: this.stats.deliveredDeliveries }
    ];
    await this.pdfService.exportToPdf(
      rows,
      [{ header: 'KPI', dataKey: 'kpi' }, { header: 'Value', dataKey: 'value' }],
      `Dashboard Report — ${this.currentDate}`,
      'dashboard_report'
    );
    this.toast.success('Dashboard PDF exported!');
  }
}