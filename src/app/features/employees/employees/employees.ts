import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../core/services/employee.service';
import { UserService } from '../../../core/services/user.service';
import { EmployeeDto, CreateEmployeeCommand, UpdateEmployeeCommand, UserDto } from '../../../core/models/api.models';
import { ToastService } from '../../../core/services/toast.service';
import { ExportService } from '../../../core/services/export.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { PdfService } from '../../../core/services/pdf.service';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './employees.html',
  styleUrls: ['./employees.css']
})
export class Employees implements OnInit {

  employees: EmployeeDto[] = [];
  users: UserDto[] = [];
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

  form: CreateEmployeeCommand = this.emptyForm();

  readonly statusLabels  = ['Active', 'On Mission', 'On Leave', 'Inactive'];
  readonly statusClasses = ['active', 'mission', 'leave', 'inactive'];

  readonly positions = [
    'Driver', 'Mechanic', 'Dispatcher', 'Manager',
    'Warehouse Agent', 'Logistics Coordinator', 'Security Guard', 'Administrative'
  ];

  constructor(
    private employeeService: EmployeeService,
    private userService: UserService,
    private toast: ToastService,
    private exportService: ExportService,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void { this.load(); this.loadUsers(); }

  load(): void {
    this.isLoading = true;
    this.employeeService.getAll().subscribe({
      next: (data) => { this.employees = data; this.isLoading = false; },
      error: (err) => { this.toast.error(`Failed to load employees (HTTP ${err.status})`); this.isLoading = false; }
    });
  }

  loadUsers(): void {
    this.userService.getAll().subscribe({ next: (d) => { this.users = d; } });
  }

  getUserName(id: string): string {
    const u = this.users.find(u => u.id === id);
    return u ? u.fullName : id.substring(0, 8) + '...';
  }

  get totalEmployees(): number   { return this.employees.length; }
  get activeEmployees(): number  { return this.employees.filter(e => e.status === 0).length; }
  get onMissionEmployees(): number { return this.employees.filter(e => e.status === 1).length; }
  get inactiveEmployees(): number { return this.employees.filter(e => e.status === 3).length; }

  get filteredEmployees(): EmployeeDto[] {
    const s = this.searchTerm.toLowerCase().trim();
    if (!s) return this.employees;
    return this.employees.filter(e =>
      e.matricule.toLowerCase().includes(s) ||
      e.position.toLowerCase().includes(s) ||
      this.getUserName(e.userId).toLowerCase().includes(s) ||
      this.statusLabels[e.status]?.toLowerCase().includes(s)
    );
  }

  get pagedEmployees(): EmployeeDto[] {
    const s = (this.currentPage - 1) * this.pageSize;
    return this.filteredEmployees.slice(s, s + this.pageSize);
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  exportCSV(): void {
    this.exportService.exportToCSV(this.filteredEmployees, 'employees', [
      { key: 'matricule', label: 'Matricule' },
      { key: 'position', label: 'Position' },
      { key: 'hireDate', label: 'Hire Date' },
      { key: 'status',   label: 'Status Code' }
    ]);
    this.toast.success('Employees exported to CSV!');
  }

  async exportPdf(): Promise<void> {
    await this.pdfService.exportToPdf(
      this.filteredEmployees.map(e => ({ ...e, status: this.statusLabels[e.status] ?? e.status })),
      [{ header:'Matricule', dataKey:'matricule' }, { header:'Position', dataKey:'position' }, { header:'Hire Date', dataKey:'hireDate' }, { header:'Status', dataKey:'status' }],
      'Employee Report', 'employees'
    );
    this.toast.success('PDF generated!');
  }

  openAddModal(): void {
    this.editingId = null; this.form = this.emptyForm();
    this.submitError = ''; this.isEditing = false; this.showModal = true;
  }

  openEditModal(e: EmployeeDto): void {
    this.editingId = e.id;
    this.form = {
      userId: e.userId, matricule: e.matricule,
      position: e.position,
      hireDate: e.hireDate.substring(0, 10), status: Number(e.status)
    };
    this.submitError = ''; this.isEditing = true; this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  submitForm(): void {
    this.submitError = '';
    if (!this.form.userId)     { this.submitError = 'Please select a user.'; return; }
    if (!this.form.matricule)  { this.submitError = 'Please enter a matricule.'; return; }
    if (!this.form.position)   { this.submitError = 'Please select a position.'; return; }
    this.isSubmitting = true;

    if (this.isEditing && this.editingId) {
      const cmd: UpdateEmployeeCommand = {
        id: this.editingId, userId: this.form.userId,
        matricule: this.form.matricule, position: this.form.position,
        hireDate: this.form.hireDate, status: Number(this.form.status)
      };
      this.employeeService.update(cmd).subscribe({
        next: () => { this.isSubmitting = false; this.closeModal(); this.load(); this.toast.success('Employee updated!'); },
        error: (err) => { this.isSubmitting = false; this.submitError = err.error?.message || `HTTP ${err.status}`; }
      });
    } else {
      const cmd: CreateEmployeeCommand = {
        userId: this.form.userId, matricule: this.form.matricule,
        position: this.form.position, hireDate: this.form.hireDate,
        status: Number(this.form.status)
      };
      this.employeeService.create(cmd).subscribe({
        next: () => { this.isSubmitting = false; this.closeModal(); this.load(); this.toast.success('Employee added!'); },
        error: (err) => { this.isSubmitting = false; this.submitError = err.error?.message || `HTTP ${err.status}`; }
      });
    }
  }

  confirmDelete(e: EmployeeDto): void {
    this.deleteConfirmId = e.id;
    this.deleteConfirmName = `${e.matricule} (${e.position})`;
  }
  cancelDelete(): void { this.deleteConfirmId = null; this.deleteConfirmName = ''; }

  deleteEmployee(): void {
    if (!this.deleteConfirmId) return;
    const id = this.deleteConfirmId;
    const name = this.deleteConfirmName;
    this.deleteConfirmId = null; this.deleteConfirmName = '';
    this.employeeService.delete(id).subscribe({
      next: () => { this.employees = this.employees.filter(e => e.id !== id); this.toast.success(`Employee "${name}" deleted.`); },
      error: (err) => { this.toast.error(err.error?.message || `Delete failed (HTTP ${err.status})`); }
    });
  }

  private emptyForm(): CreateEmployeeCommand {
    return { userId: '', matricule: '', position: '', hireDate: new Date().toISOString().substring(0, 10), status: 0 };
  }
}

