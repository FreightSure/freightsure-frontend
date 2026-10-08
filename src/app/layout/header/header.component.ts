import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationDto } from '../../core/models/api.models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  fullName = 'Admin';
  role = 'Administrator';
  initials = 'A';
  notifications: NotificationDto[] = [];
  showNotifDropdown = false;
  isDarkMode = false;

  readonly typeLabels = ['Info', 'Warning', 'Error', 'Success'];
  readonly typeIcons  = ['ℹ️', '⚠️', '❌', '✅'];

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.fullName = user.fullName || 'Admin';
      this.role     = user.roles?.[0] || 'User';
      this.initials = this.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
    this.loadNotifications();

    // Restore dark mode preference
    this.isDarkMode = localStorage.getItem('darkMode') === 'true';
    this.applyDarkMode(this.isDarkMode);
  }

  loadNotifications(): void {
    this.notificationService.getAll().subscribe({
      next: (data) => { this.notifications = data.slice(0, 10); },
      error: ()     => { this.notifications = []; }
    });
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  toggleNotifDropdown(): void { this.showNotifDropdown = !this.showNotifDropdown; }

  goToNotifications(): void {
    this.showNotifDropdown = false;
    this.router.navigate(['/notifications']);
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', String(this.isDarkMode));
    this.applyDarkMode(this.isDarkMode);
  }

  private applyDarkMode(enabled: boolean): void {
    document.documentElement.classList.toggle('dark', enabled);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notif-wrapper')) {
      this.showNotifDropdown = false;
    }
  }
}
