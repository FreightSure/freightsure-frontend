import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehicleService } from '../../../core/services/vehicle.service';
import { VehicleDto, CreateVehicleCommand, UpdateVehicleCommand } from '../../../core/models/api.models';
import { ToastService } from '../../../core/services/toast.service';
import { ExportService } from '../../../core/services/export.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { PdfService } from '../../../core/services/pdf.service';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './vehicles.html',
  styleUrls: ['./vehicles.css']
})
export class Vehicles implements OnInit {

  vehicles: VehicleDto[] = [];
  searchTerm = '';
  isLoading = false;
  submitError = '';
  showModal = false;
  isEditing = false;
  isSubmitting = false;
  deleteConfirmId: string | null = null;
  editingId: string | null = null;
  
  currentPage = 1;
  pageSize = 10;
  
  form: CreateVehicleCommand = this.emptyForm();

  constructor(
    private vehicleService: VehicleService,
    private toast: ToastService,
    private exportService: ExportService,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.vehicleService.getAll().subscribe({
      next: (data) => { this.vehicles = data; this.isLoading = false; },
      error: (err) => { this.toast.error(`Failed to load vehicles (HTTP ${err.status})`); this.isLoading = false; }
    });
  }

  get filteredVehicles(): VehicleDto[] {
    const s = this.searchTerm.toLowerCase().trim();
    if (!s) return this.vehicles;
    return this.vehicles.filter(v =>
      v.immatriculation.toLowerCase().includes(s) ||
      v.marque.toLowerCase().includes(s) ||
      v.modele.toLowerCase().includes(s) ||
      this.statusLabel(v.status).toLowerCase().includes(s)
    );
  }

  get pagedVehicles(): VehicleDto[] { 
    const s = (this.currentPage-1)*this.pageSize; 
    return this.filteredVehicles.slice(s, s+this.pageSize); 
  }
  
  onPageChange(page: number) { this.currentPage = page; }
  onPageSizeChange(size: number) { this.pageSize = size; this.currentPage = 1; }

  get totalVehicles(): number        { return this.vehicles.length; }
  get availableVehicles(): number    { return this.vehicles.filter(v => v.status === 'Available').length; }
  get vehiclesOnMission(): number    { return this.vehicles.filter(v => v.status === 'OnMission').length; }
  get vehiclesInMaintenance(): number { return this.vehicles.filter(v => v.status === 'Maintenance' || v.status === 'OutOfService').length; }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      'Available': 'Available', 'OnMission': 'On Mission',
      'Maintenance': 'Maintenance', 'OutOfService': 'Out of Service'
    };
    return map[s] ?? s;
  }

  statusClass(s: string): string {
    const map: Record<string, string> = {
      'Available': 'available', 'OnMission': 'onmission',
      'Maintenance': 'maintenance', 'OutOfService': 'outofservice'
    };
    return map[s] ?? '';
  }

  exportCSV(): void {
    this.exportService.exportToCSV(this.filteredVehicles, 'vehicles', [
      { key: 'immatriculation', label: 'Registration' },
      { key: 'marque',          label: 'Brand' },
      { key: 'modele',          label: 'Model' },
      { key: 'capacite',        label: 'Capacity (T)' },
      { key: 'status',          label: 'Status' }
    ]);
    this.toast.success('Vehicles exported to CSV!');
  }

  async exportPdf(): Promise<void> {
    await this.pdfService.exportToPdf(
      this.filteredVehicles.map(v => ({ ...v, status: this.statusLabel(v.status) })),
      [{ header:'Registration', dataKey:'immatriculation' }, { header:'Brand', dataKey:'marque' }, { header:'Model', dataKey:'modele' }, { header:'Capacity (T)', dataKey:'capacite' }, { header:'Status', dataKey:'status' }],
      'Vehicle Report', 'vehicles'
    );
    this.toast.success('PDF generated!');
  }

  openAddModal(): void {
    this.editingId = null; this.form = this.emptyForm();
    this.submitError = ''; this.isEditing = false; this.showModal = true;
  }

  openEditModal(v: VehicleDto): void {
    this.editingId = v.id;
    this.form = {
      immatriculation: v.immatriculation, marque: v.marque, modele: v.modele,
      capacite: Number(v.capacite), status: this.statusToInt(v.status),
      dateMiseEnService: v.dateMiseEnService.substring(0, 10)
    };
    this.submitError = ''; this.isEditing = true; this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  submitForm(): void {
    this.submitError = '';
    this.isSubmitting = true;

    if (this.isEditing && this.editingId) {
      const cmd: UpdateVehicleCommand = {
        id: this.editingId, immatriculation: this.form.immatriculation,
        marque: this.form.marque, modele: this.form.modele,
        capacite: Number(this.form.capacite), status: Number(this.form.status),
        dateMiseEnService: this.form.dateMiseEnService
      };
      this.vehicleService.update(cmd).subscribe({
        next: () => { this.isSubmitting = false; this.closeModal(); this.load(); this.toast.success('Vehicle updated!'); },
        error: (err) => { this.isSubmitting = false; this.submitError = err.error?.message || `HTTP ${err.status}`; }
      });
    } else {
      const cmd: CreateVehicleCommand = {
        immatriculation: this.form.immatriculation, marque: this.form.marque,
        modele: this.form.modele, capacite: Number(this.form.capacite),
        status: Number(this.form.status), dateMiseEnService: this.form.dateMiseEnService
      };
      this.vehicleService.create(cmd).subscribe({
        next: () => { this.isSubmitting = false; this.closeModal(); this.load(); this.toast.success('Vehicle added!'); },
        error: (err) => { this.isSubmitting = false; this.submitError = err.error?.message || `HTTP ${err.status}`; }
      });
    }
  }

  confirmDelete(id: string): void { this.deleteConfirmId = id; }
  cancelDelete(): void { this.deleteConfirmId = null; }

  deleteVehicle(): void {
    if (!this.deleteConfirmId) return;
    const id = this.deleteConfirmId;
    this.deleteConfirmId = null;
    this.vehicleService.delete(id).subscribe({
      next: () => { this.vehicles = this.vehicles.filter(v => v.id !== id); this.toast.success('Vehicle deleted!'); },
      error: (err) => { this.toast.error(err.error?.message || `Delete failed (HTTP ${err.status})`); }
    });
  }

  private emptyForm(): CreateVehicleCommand {
    return { immatriculation: '', marque: '', modele: '', capacite: 0, status: 0, dateMiseEnService: new Date().toISOString().substring(0, 10) };
  }

  private statusToInt(s: string): number {
    const map: Record<string, number> = { 'Available': 0, 'OnMission': 1, 'Maintenance': 2, 'OutOfService': 3 };
    return map[s] ?? 0;
  }
}
