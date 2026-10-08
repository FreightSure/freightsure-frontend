import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MissionService } from '../../../core/services/mission.service';
import { DeliveryService } from '../../../core/services/delivery.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { MissionDto, DeliveryDto, EmployeeDto, VehicleDto } from '../../../core/models/api.models';
import { ExportService } from '../../../core/services/export.service';
import { PdfService } from '../../../core/services/pdf.service';
import { ToastService } from '../../../core/services/toast.service';

export interface MonthlyRow {
  year:        number;
  month:       number;
  monthLabel:  string;
  missions:    number;
  completed:   number;
  cancelled:   number;
  deliveries:  number;
  delivered:   number;
  completionRate: number;  // % missions completed
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class Reports implements OnInit {

  isLoading = false;

  missions:   MissionDto[]  = [];
  deliveries: DeliveryDto[] = [];
  employees:  EmployeeDto[] = [];
  vehicles:   VehicleDto[]  = [];

  selectedMonths = 6;
  monthOptions = [3, 6, 12];

  readonly monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  constructor(
    private missionService:  MissionService,
    private deliveryService: DeliveryService,
    private employeeService: EmployeeService,
    private vehicleService:  VehicleService,
    private exportService:   ExportService,
    private pdfService:      PdfService,
    private toast:           ToastService
  ) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.isLoading = true;
    let loaded = 0;
    const done = () => { if (++loaded === 4) this.isLoading = false; };

    this.missionService.getAll().subscribe({  next: d => { this.missions   = d; done(); }, error: () => done() });
    this.deliveryService.getAll().subscribe({ next: d => { this.deliveries = d; done(); }, error: () => done() });
    this.employeeService.getAll().subscribe({ next: d => { this.employees  = d; done(); }, error: () => done() });
    this.vehicleService.getAll().subscribe({  next: d => { this.vehicles   = d; done(); }, error: () => done() });
  }

  get months(): { year: number; month: number }[] {
    const now = new Date();
    return Array.from({ length: this.selectedMonths }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (this.selectedMonths - 1 - i), 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  }

  get monthlyRows(): MonthlyRow[] {
    return this.months.map(({ year, month }) => {
      const ms = this.missions.filter(m =>
        m.dateDebut && new Date(m.dateDebut).getFullYear() === year && new Date(m.dateDebut).getMonth() + 1 === month
      );
      const ds = this.deliveries.filter(d =>
        d.dateLivraison && new Date(d.dateLivraison).getFullYear() === year && new Date(d.dateLivraison).getMonth() + 1 === month
      );
      const total     = ms.length;
      const completed = ms.filter(m => m.status === 2).length;
      const cancelled = ms.filter(m => m.status === 3).length;
      const delivered = ds.filter(d => d.status === 2).length;
      return {
        year, month,
        monthLabel:  `${this.monthNames[month - 1]} ${year}`,
        missions:    total,
        completed,
        cancelled,
        deliveries:  ds.length,
        delivered,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    });
  }

  // KPI totals across the selected period
  get totalMissions():   number { return this.monthlyRows.reduce((s, r) => s + r.missions, 0); }
  get totalCompleted():  number { return this.monthlyRows.reduce((s, r) => s + r.completed, 0); }
  get totalCancelled():  number { return this.monthlyRows.reduce((s, r) => s + r.cancelled, 0); }
  get totalDeliveries(): number { return this.monthlyRows.reduce((s, r) => s + r.deliveries, 0); }
  get totalDelivered():  number { return this.monthlyRows.reduce((s, r) => s + r.delivered, 0); }
  get avgCompletion():   number {
    const rows = this.monthlyRows.filter(r => r.missions > 0);
    return rows.length ? Math.round(rows.reduce((s, r) => s + r.completionRate, 0) / rows.length) : 0;
  }

  get activeVehicles():  number { return this.vehicles.filter(v => v.status === 'Available').length; }
  get activeEmployees(): number { return this.employees.filter(e => e.status === 0).length; }

  exportCSV(): void {
    this.exportService.exportToCSV(this.monthlyRows, `report_${this.selectedMonths}months`, [
      { key: 'monthLabel',      label: 'Month' },
      { key: 'missions',        label: 'Missions' },
      { key: 'completed',       label: 'Completed' },
      { key: 'cancelled',       label: 'Cancelled' },
      { key: 'completionRate',  label: 'Completion %' },
      { key: 'deliveries',      label: 'Deliveries' },
      { key: 'delivered',       label: 'Delivered' }
    ]);
    this.toast.success('Report exported to CSV!');
  }

  async exportPdf(): Promise<void> {
    await this.pdfService.exportToPdf(
      this.monthlyRows,
      [
        { header: 'Month',          dataKey: 'monthLabel' },
        { header: 'Missions',       dataKey: 'missions' },
        { header: 'Completed',      dataKey: 'completed' },
        { header: 'Cancelled',      dataKey: 'cancelled' },
        { header: 'Completion %',   dataKey: 'completionRate' },
        { header: 'Deliveries',     dataKey: 'deliveries' },
        { header: 'Delivered',      dataKey: 'delivered' }
      ],
      `Monthly Report — Last ${this.selectedMonths} Months`,
      `monthly_report_${this.selectedMonths}m`
    );
    this.toast.success('PDF report generated!');
  }

  barWidth(val: number, max: number): number {
    return max > 0 ? Math.round((val / max) * 100) : 0;
  }

  maxMissions(): number { return Math.max(...this.monthlyRows.map(r => r.missions), 1); }
}
