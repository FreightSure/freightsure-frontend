import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { UserDto } from '../../../core/models/api.models';
import { ToastService } from '../../../core/services/toast.service';
import { ExportService } from '../../../core/services/export.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { PdfService } from '../../../core/services/pdf.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users implements OnInit {

  users: UserDto[] = [];
  searchTerm: string = '';
  isLoading = false;
  errorMessage = '';
  deleteConfirmId: string | null = null;
  deleteConfirmName = '';
  isDeleting = false;

  currentPage = 1;
  pageSize = 10;

  constructor(
    private userService: UserService,
    private toast: ToastService,
    private exportService: ExportService,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.userService.getAll().subscribe({
      next: (data) => { this.users = data; this.isLoading = false; },
      error: (err) => {
        const msg = `Failed to load users (HTTP ${err.status}). Please log in again.`;
        this.errorMessage = msg;
        this.toast.error(msg);
        this.isLoading = false;
      }
    });
  }

  get totalUsers(): number { return this.users.length; }
  get activeUsers(): number { return this.users.filter(u => u.isActive).length; }
  get inactiveUsers(): number { return this.users.filter(u => !u.isActive).length; }

  get filteredUsers(): UserDto[] {
    const s = this.searchTerm.toLowerCase().trim();
    if (!s) return this.users;
    return this.users.filter(u =>
      u.fullName.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      (u.phoneNumber || '').toLowerCase().includes(s)
    );
  }

  get pagedUsers(): UserDto[] {
    const s = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(s, s + this.pageSize);
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  confirmDelete(user: UserDto): void {
    this.deleteConfirmId = user.id;
    this.deleteConfirmName = user.fullName;
    this.errorMessage = '';
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
    this.deleteConfirmName = '';
  }

  deleteUser(): void {
    if (!this.deleteConfirmId) return;
    const deletedId   = this.deleteConfirmId;
    const deletedName = this.deleteConfirmName;

    this.isDeleting = true;
    this.deleteConfirmId   = null;
    this.deleteConfirmName = '';

    this.userService.delete(deletedId).subscribe({
      next: (_result) => {
        this.isDeleting = false;
        this.users = this.users.filter(u => u.id !== deletedId);
        this.toast.success(`âœ“ User "${deletedName}" deleted successfully.`);
      },
      error: (err) => {
        this.isDeleting = false;
        const msg = err.error?.message || `Delete failed (HTTP ${err.status})`;
        this.toast.error(msg);
      }
    });
  }

  exportCSV(): void {
    this.exportService.exportToCSV(this.filteredUsers, 'users', [
      { key: 'fullName',    label: 'Full Name' },
      { key: 'email',       label: 'Email' },
      { key: 'phoneNumber', label: 'Phone' },
      { key: 'isActive',    label: 'Active' }
    ]);
    this.toast.success('Users exported to CSV!');
  }

  async exportPdf(): Promise<void> {
    await this.pdfService.exportToPdf(
      this.filteredUsers.map(u => ({ ...u, status: u.isActive ? 'Active' : 'Inactive' })),
      [{ header:'Name', dataKey:'fullName' }, { header:'Email', dataKey:'email' }, { header:'Phone', dataKey:'phoneNumber' }, { header:'Status', dataKey:'status' }],
      'User Report', 'users'
    );
    this.toast.success('PDF generated!');
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }
}
