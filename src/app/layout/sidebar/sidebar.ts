import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {

  isCollapsed = false;
  fullName = 'Admin';
  role = 'Administrator';
  initials = 'A';

  constructor(
    private authService: AuthService,
    private router: Router,
    private layoutService: LayoutService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.fullName = user.fullName || 'Admin';
      this.role = user.roles?.[0] || 'User';
      this.initials = this.fullName
        .split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
    this.layoutService.collapsed$.subscribe(val => { this.isCollapsed = val; });
  }

  toggleCollapse(): void { this.layoutService.toggle(); }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}