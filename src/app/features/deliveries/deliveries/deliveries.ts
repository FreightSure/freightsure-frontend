import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeliveryService } from '../../../core/services/delivery.service';
import { MissionService } from '../../../core/services/mission.service';
import { DeliveryDto, CreateDeliveryCommand, UpdateDeliveryCommand, MissionDto } from '../../../core/models/api.models';
import { ToastService } from '../../../core/services/toast.service';
import { ExportService } from '../../../core/services/export.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { PdfService } from '../../../core/services/pdf.service';

@Component({
  selector: 'app-deliveries',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './deliveries.html',
  styleUrls: ['./deliveries.css']
})
export class Deliveries implements OnInit {

  deliveries: DeliveryDto[] = [];
  missions: MissionDto[] = [];
  searchTerm = '';
  isLoading = false;
  submitError = '';
  showModal = false;
  isEditing = false;
  isSubmitting = false;
  deleteConfirmId: string | null = null;
  deleteConfirmName = '';
  editingId: string | null = null;

  currentPage = 1;
  pageSize = 10;

  form: CreateDeliveryCommand = this.emptyForm();

  readonly statusLabels  = ['Pending', 'Picked Up', 'Delivered', 'Cancelled'];
  readonly statusClasses = ['pending', 'pickedup', 'delivered', 'cancelled'];

  constructor(
    private deliveryService: DeliveryService,
    private missionService: MissionService,
    private toast: ToastService,
    private exportService: ExportService,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void { this.load(); this.loadMissions(); }

  load(): void {
    this.isLoading = true;
    this.deliveryService.getAll().subscribe({
      next: (data) => { this.deliveries = data; this.isLoading = false; },
      error: (err) => { this.toast.error(`Failed to load deliveries (HTTP ${err.status})`); this.isLoading = false; }
    });
  }

  loadMissions(): void {
    this.missionService.getAll().subscribe({ next: (d) => { this.missions = d; } });
  }

  getMissionLabel(id: string): string {
    const m = this.missions.find(m => m.id === id);
    return m ? `${m.origine} â†’ ${m.destination}` : id.substring(0, 8) + '...';
  }

  get totalDeliveries(): number    { return this.deliveries.length; }
  get pendingDeliveries(): number  { return this.deliveries.filter(d => d.status === 0).length; }
  get deliveredDeliveries(): number { return this.deliveries.filter(d => d.status === 2).length; }
  get cancelledDeliveries(): number { return this.deliveries.filter(d => d.status === 3).length; }

  get filteredDeliveries(): DeliveryDto[] {
    const s = this.searchTerm.toLowerCase().trim();
    if (!s) return this.deliveries;
    return this.deliveries.filter(d =>
      d.adresseLivraison.toLowerCase().includes(s) ||
      this.getMissionLabel(d.missionId).toLowerCase().includes(s) ||
      this.statusLabels[d.status]?.toLowerCase().includes(s)
    );
  }

  get pagedDeliveries(): DeliveryDto[] {
    const s = (this.currentPage - 1) * this.pageSize;
    return this.filteredDeliveries.slice(s, s + this.pageSize);
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  exportCSV(): void {
    this.exportService.exportToCSV(this.filteredDeliveries, 'deliveries', [
      { key: 'adresseLivraison', label: 'Address' },
      { key: 'dateLivraison',    label: 'Delivery Date' },
      { key: 'status',           label: 'Status Code' }
    ]);
    this.toast.success('Deliveries exported to CSV!');
  }

  async exportPdf(): Promise<void> {
    await this.pdfService.exportToPdf(
      this.filteredDeliveries.map(d => ({ ...d, status: this.statusLabels[d.status] ?? d.status })),
      [{ header:'Address', dataKey:'adresseLivraison' }, { header:'Delivery Date', dataKey:'dateLivraison' }, { header:'Status', dataKey:'status' }],
      'Delivery Report', 'deliveries'
    );
    this.toast.success('PDF generated!');
  }

  openAddModal(): void {
    this.editingId = null; this.form = this.emptyForm();
    this.submitError = ''; this.isEditing = false; this.showModal = true;
  }

  openEditModal(d: DeliveryDto): void {
    this.editingId = d.id;
    this.form = {
      missionId: d.missionId, adresseLivraison: d.adresseLivraison,
      dateLivraison: d.dateLivraison.substring(0, 10), status: Number(d.status)
    };
    this.submitError = ''; this.isEditing = true; this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  submitForm(): void {
    this.submitError = '';
    if (!this.form.missionId)        { this.submitError = 'Please select a mission.'; return; }
    if (!this.form.adresseLivraison) { this.submitError = 'Please enter the delivery address.'; return; }
    this.isSubmitting = true;

    if (this.isEditing && this.editingId) {
      const cmd: UpdateDeliveryCommand = {
        id: this.editingId, missionId: this.form.missionId,
        adresseLivraison: this.form.adresseLivraison,
        dateLivraison: this.form.dateLivraison, status: Number(this.form.status)
      };
      this.deliveryService.update(cmd).subscribe({
        next: () => { this.isSubmitting = false; this.closeModal(); this.load(); this.toast.success('Delivery updated!'); },
        error: (err) => { this.isSubmitting = false; this.submitError = err.error?.message || `HTTP ${err.status}`; }
      });
    } else {
      const cmd: CreateDeliveryCommand = {
        missionId: this.form.missionId, adresseLivraison: this.form.adresseLivraison,
        dateLivraison: this.form.dateLivraison, status: Number(this.form.status)
      };
      this.deliveryService.create(cmd).subscribe({
        next: () => { this.isSubmitting = false; this.closeModal(); this.load(); this.toast.success('Delivery created!'); },
        error: (err) => { this.isSubmitting = false; this.submitError = err.error?.message || `HTTP ${err.status}`; }
      });
    }
  }

  confirmDelete(d: DeliveryDto): void {
    this.deleteConfirmId = d.id;
    this.deleteConfirmName = d.adresseLivraison;
  }
  cancelDelete(): void { this.deleteConfirmId = null; this.deleteConfirmName = ''; }

  deleteDelivery(): void {
    if (!this.deleteConfirmId) return;
    const id = this.deleteConfirmId;
    const name = this.deleteConfirmName;
    this.deleteConfirmId = null; this.deleteConfirmName = '';
    this.deliveryService.delete(id).subscribe({
      next: () => { this.deliveries = this.deliveries.filter(d => d.id !== id); this.toast.success(`Delivery "${name}" deleted.`); },
      error: (err) => { this.toast.error(err.error?.message || `Delete failed (HTTP ${err.status})`); }
    });
  }

  private emptyForm(): CreateDeliveryCommand {
    return { missionId: '', adresseLivraison: '', dateLivraison: new Date().toISOString().substring(0, 10), status: 0 };
  }
}

