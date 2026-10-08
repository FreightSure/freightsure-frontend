import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuditLogDto } from '../../../core/models/api.models';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-logs.html',
  styleUrls: ['./audit-logs.css']
})
export class AuditLogs implements OnInit {

  logs: AuditLogDto[] = [];
  searchTerm = '';
  isLoading = false;
  errorMessage = '';
  deleteConfirmId: string | null = null;

  constructor(private auditLogService: AuditLogService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.auditLogService.getAll().subscribe({
      next: (data) => { this.logs = data; this.isLoading = false; },
      error: () => { this.errorMessage = 'Impossible de charger les logs.'; this.isLoading = false; }
    });
  }

  get totalLogs(): number { return this.logs.length; }

  get uniqueEntities(): number {
    return new Set(this.logs.map(l => l.entityName)).size;
  }

  get uniqueUsers(): number {
    return new Set(this.logs.map(l => l.userId)).size;
  }

  get filteredLogs(): AuditLogDto[] {
    const s = this.searchTerm.toLowerCase().trim();
    if (!s) return this.logs;
    return this.logs.filter(l =>
      l.action.toLowerCase().includes(s) ||
      l.entityName.toLowerCase().includes(s) ||
      l.details.toLowerCase().includes(s)
    );
  }

  actionClass(action: string): string {
    const a = action.toLowerCase();
    if (a.includes('create') || a.includes('add')) return 'create';
    if (a.includes('update') || a.includes('edit')) return 'update';
    if (a.includes('delete') || a.includes('remove')) return 'delete';
    return 'default';
  }

  confirmDelete(id: string): void { this.deleteConfirmId = id; }
  cancelDelete(): void { this.deleteConfirmId = null; }

  deleteLog(): void {
    if (!this.deleteConfirmId) return;
    this.auditLogService.delete(this.deleteConfirmId).subscribe({
      next: () => { this.deleteConfirmId = null; this.load(); },
      error: () => { this.deleteConfirmId = null; }
    });
  }
}
