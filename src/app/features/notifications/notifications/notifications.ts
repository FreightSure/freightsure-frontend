import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationDto, UpdateNotificationCommand } from '../../../core/models/api.models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css']
})
export class Notifications implements OnInit {
  notifications: NotificationDto[] = [];
  searchTerm = '';
  isLoading = false;
  errorMessage = '';
  deleteConfirmId: string | null = null;

  readonly typeLabels = ['Info', 'Warning', 'Error', 'Success'];
  readonly typeClasses = ['info', 'warning', 'error', 'success'];
  readonly typeIcons = ['ℹ️', '⚠️', '❌', '✅'];

  constructor(private notificationService: NotificationService) {}
  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.notificationService.getAll().subscribe({
      next: (data) => { this.notifications = data; this.isLoading = false; },
      error: () => { this.errorMessage = 'Impossible de charger les notifications.'; this.isLoading = false; }
    });
  }

  get totalNotifications(): number { return this.notifications.length; }
  get unreadNotifications(): number { return this.notifications.filter(n => !n.isRead).length; }
  get readNotifications(): number { return this.notifications.filter(n => n.isRead).length; }

  get filteredNotifications(): NotificationDto[] {
    const s = this.searchTerm.toLowerCase().trim();
    if (!s) return this.notifications;
    return this.notifications.filter(n => n.message.toLowerCase().includes(s) || this.typeLabels[n.type]?.toLowerCase().includes(s));
  }

  markAsRead(n: NotificationDto): void {
    const cmd: UpdateNotificationCommand = { id: n.id, userId: n.userId, message: n.message, type: n.type, isRead: true };
    this.notificationService.update(cmd).subscribe({ next: () => { n.isRead = true; } });
  }

  confirmDelete(id: string): void { this.deleteConfirmId = id; }
  cancelDelete(): void { this.deleteConfirmId = null; }
  deleteNotification(): void {
    if (!this.deleteConfirmId) return;
    this.notificationService.delete(this.deleteConfirmId).subscribe({ next: () => { this.deleteConfirmId = null; this.load(); }, error: () => { this.deleteConfirmId = null; } });
  }
}
