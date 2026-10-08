import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Signup } from './features/auth/signup/signup';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { Dashboard } from './features/dashboard/dashboard/dashboard';
import { Users } from './features/users/users/users';
import { Employees } from './features/employees/employees/employees';
import { Vehicles } from './features/vehicles/vehicles/vehicles';
import { Missions } from './features/missions/missions/missions';
import { Deliveries } from './features/deliveries/deliveries/deliveries';
import { Tracking } from './features/tracking/tracking/tracking';
import { Notifications } from './features/notifications/notifications/notifications';
import { Reviews } from './features/reviews/reviews/reviews';
import { AuditLogs } from './features/audit-logs/audit-logs/audit-logs';
import { Insights } from './features/insights/insights/insights';
import { Reports } from './features/reports/reports/reports';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'signup',
    component: Signup
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: Dashboard
      },
      {
        path: 'users',
        component: Users
      },
      {
        path: 'employees',
        component: Employees
      },
      {
        path: 'vehicles',
        component: Vehicles
      },
      {
        path: 'missions',
        component: Missions
      },
      {
        path: 'deliveries',
        component: Deliveries
      },
      {
        path: 'tracking',
        component: Tracking
      },
      {
        path: 'notifications',
        component: Notifications
      },
      {
        path: 'reviews',
        component: Reviews
      },
      {
        path: 'audit-logs',
        component: AuditLogs
      },
      {
        path: 'reports',
        component: Reports
      },
      {
        path: 'insights',
        component: Insights
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];


