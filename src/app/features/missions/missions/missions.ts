import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MissionService } from '../../../core/services/mission.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { MissionDto, CreateMissionCommand, UpdateMissionCommand, EmployeeDto, VehicleDto } from '../../../core/models/api.models';
import { ToastService } from '../../../core/services/toast.service';
import { ExportService } from '../../../core/services/export.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { PdfService } from '../../../core/services/pdf.service';

@Component({
  selector: 'app-missions',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './missions.html',
  styleUrls: ['./missions.css']
})
export class Missions implements OnInit {

  missions: MissionDto[] = [];
  employees: EmployeeDto[] = [];
  vehicles: VehicleDto[] = [];

  // Filters
  searchTerm = '';
  statusFilter: number | '' = '';  // '' = all, 0/1/2/3 = specific status

  isLoading = false;
  showModal = false;
  isEditing = false;
  isSubmitting = false;
  submitError = '';
  deleteConfirmId: string | null = null;
  deleteConfirmName = '';
  editingId: string | null = null;
  
  currentPage = 1;
  pageSize = 10;

  form: CreateMissionCommand = this.emptyForm();

  readonly statusLabels = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
  readonly statusClasses = ['pending', 'inprogress', 'completed', 'cancelled'];
  readonly statusOptions = [
    { value: 0, label: 'Pending' },
    { value: 1, label: 'In Progress' },
    { value: 2, label: 'Completed' },
    { value: 3, label: 'Cancelled' }
  ];

  constructor(
    private missionService: MissionService,
    private employeeService: EmployeeService,
    private vehicleService: VehicleService,
    private toast: ToastService,
    private exportService: ExportService,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void { this.load(); this.loadEmployees(); this.loadVehicles(); }

  load(): void {
    this.isLoading = true;
    this.missionService.getAll().subscribe({
      next: (data) => { this.missions = data; this.isLoading = false; },
      error: (err) => {
        this.toast.error(`Failed to load missions (HTTP ${err.status})`);
        this.isLoading = false;
      }
    });
  }

  loadEmployees(): void { this.employeeService.getAll().subscribe({ next: (d) => { this.employees = d; } }); }
  loadVehicles(): void  { this.vehicleService.getAll().subscribe({ next: (d) => { this.vehicles = d; } }); }

  getEmployeeLabel(id: string): string {
    const e = this.employees.find(e => e.id === id);
    return e ? `${e.matricule} â€” ${e.position}` : id.substring(0, 8) + '...';
  }

  getVehicleLabel(id: string): string {
    const v = this.vehicles.find(v => v.id === id);
    return v ? `${v.immatriculation} (${v.marque})` : id.substring(0, 8) + '...';
  }

  // Stats (from full list, not filtered)
  get totalMissions(): number   { return this.missions.length; }
  get pendingMissions(): number { return this.missions.filter(m => m.status === 0).length; }
  get inProgressMissions(): number { return this.missions.filter(m => m.status === 1).length; }
  get completedMissions(): number  { return this.missions.filter(m => m.status === 2).length; }

  // Filtered list with both search + status filter
  get filteredMissions(): MissionDto[] {
    let result = this.missions;

    // Status filter
    if (this.statusFilter !== '') {
      result = result.filter(m => m.status === Number(this.statusFilter));
    }

    // Search filter
    const s = this.searchTerm.toLowerCase().trim();
    if (s) {
      result = result.filter(m =>
        m.origine.toLowerCase().includes(s) ||
        m.destination.toLowerCase().includes(s) ||
        this.getEmployeeLabel(m.employeeId).toLowerCase().includes(s) ||
        this.getVehicleLabel(m.vehicleId).toLowerCase().includes(s) ||
        this.statusLabels[m.status]?.toLowerCase().includes(s)
      );
    }

    return result;
  }

  get pagedMissions(): MissionDto[] { 
    const s = (this.currentPage-1)*this.pageSize; 
    return this.filteredMissions.slice(s, s+this.pageSize); 
  }

  onPageChange(page: number) { this.currentPage = page; }
  onPageSizeChange(size: number) { this.pageSize = size; this.currentPage = 1; }

  clearFilters(): void { this.searchTerm = ''; this.statusFilter = ''; }

  get hasActiveFilters(): boolean { return this.searchTerm !== '' || this.statusFilter !== ''; }

  exportCSV(): void {
    this.exportService.exportToCSV(this.filteredMissions, 'missions', [
      { key: 'origine',     label: 'From' },
      { key: 'destination', label: 'To' },
      { key: 'dateDebut',   label: 'Start Date' },
      { key: 'dateFin',     label: 'End Date' },
      { key: 'status',      label: 'Status Code' }
    ]);
    this.toast.success('Missions exported to CSV!');
  }

  async exportPdf(): Promise<void> {
    const statusMap: Record<number, string> = { 0:'Pending', 1:'In Progress', 2:'Completed', 3:'Cancelled' };
    await this.pdfService.exportToPdf(
      this.filteredMissions.map(m => ({ ...m, status: statusMap[m.status] ?? m.status })),
      [{ header:'Origin', dataKey:'origine' }, { header:'Destination', dataKey:'destination' }, { header:'Start Date', dataKey:'dateDebut' }, { header:'End Date', dataKey:'dateFin' }, { header:'Status', dataKey:'status' }],
      'Mission Report', 'missions'
    );
    this.toast.success('PDF generated!');
  }

  openAddModal(): void {
    this.editingId = null; this.form = this.emptyForm();
    this.submitError = ''; this.isEditing = false; this.showModal = true;
  }

  openEditModal(m: MissionDto): void {
    this.editingId = m.id;
    this.form = {
      employeeId: m.employeeId, vehicleId: m.vehicleId,
      dateDebut: m.dateDebut.substring(0, 10), dateFin: m.dateFin.substring(0, 10),
      status: Number(m.status), origine: m.origine, destination: m.destination
    };
    this.submitError = ''; this.isEditing = true; this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  submitForm(): void {
    this.submitError = '';
    if (!this.form.employeeId || !this.form.vehicleId || !this.form.origine || !this.form.destination) {
      this.submitError = 'Please fill all required fields.'; return;
    }
    this.isSubmitting = true;

    if (this.isEditing && this.editingId) {
      const cmd: UpdateMissionCommand = {
        id: this.editingId, ...this.form, status: Number(this.form.status)
      };
      this.missionService.update(cmd).subscribe({
        next: () => { this.isSubmitting = false; this.closeModal(); this.load(); this.toast.success('Mission updated!'); },
        error: (err) => { this.isSubmitting = false; this.submitError = err.error?.message || `HTTP ${err.status}`; }
      });
    } else {
      const cmd: CreateMissionCommand = { ...this.form, status: Number(this.form.status) };
      this.missionService.create(cmd).subscribe({
        next: () => { this.isSubmitting = false; this.closeModal(); this.load(); this.toast.success('Mission created!'); },
        error: (err) => { this.isSubmitting = false; this.submitError = err.error?.message || `HTTP ${err.status}`; }
      });
    }
  }

  confirmDelete(m: MissionDto): void {
    this.deleteConfirmId = m.id;
    this.deleteConfirmName = `${m.origine} â†’ ${m.destination}`;
  }
  cancelDelete(): void { this.deleteConfirmId = null; this.deleteConfirmName = ''; }

  deleteMission(): void {
    if (!this.deleteConfirmId) return;
    const id = this.deleteConfirmId;
    const name = this.deleteConfirmName;
    this.deleteConfirmId = null; this.deleteConfirmName = '';
    this.missionService.delete(id).subscribe({
      next: () => { this.missions = this.missions.filter(m => m.id !== id); this.toast.success(`Mission "${name}" deleted.`); },
      error: (err) => { this.toast.error(err.error?.message || `Delete failed (HTTP ${err.status})`); }
    });
  }

  private emptyForm(): CreateMissionCommand {
    const today = new Date().toISOString().substring(0, 10);
    return { employeeId: '', vehicleId: '', dateDebut: today, dateFin: today, status: 0, origine: '', destination: '' };
  }
}

