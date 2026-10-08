import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface MonthlyStat {
  year:  number;
  month: number;
  label: string;  // "Jan", "Feb", ...
  count: number;
}

export interface DashboardStats {
  totalUsers:      number;
  totalEmployees:  number;
  totalVehicles:   number;
  totalMissions:   number;
  totalDeliveries: number;

  availableVehicles:    number;
  onMissionVehicles:    number;
  maintenanceVehicles:  number;
  outOfServiceVehicles: number;

  pendingMissions:    number;
  inProgressMissions: number;
  completedMissions:  number;
  cancelledMissions:  number;

  pendingDeliveries:   number;
  inTransitDeliveries: number;
  deliveredDeliveries: number;
  failedDeliveries:    number;

  activeEmployees:    number;
  onMissionEmployees: number;
  inactiveEmployees:  number;

  recentMissions:    RecentMission[];
  missionsByMonth:   MonthlyStat[];
  deliveriesByMonth: MonthlyStat[];
}

export interface RecentMission {
  id:          string;
  origine:     string;
  destination: string;
  dateDebut:   string;
  dateFin:     string;
  status:      number;
  statusLabel: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private url = `${API_BASE_URL}/Dashboard`;
  constructor(private http: HttpClient) {}
  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.url}/stats`);
  }
}
