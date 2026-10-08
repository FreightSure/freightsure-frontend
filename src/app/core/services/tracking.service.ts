import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  VehicleTrackingDto,
  CreateVehicleTrackingCommand,
  UpdateVehicleTrackingCommand
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class TrackingService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/VehicleTracking`;

  getAll(): Observable<VehicleTrackingDto[]> {
    return this.http.get<VehicleTrackingDto[]>(this.base);
  }

  getById(id: string): Observable<VehicleTrackingDto> {
    return this.http.get<VehicleTrackingDto>(`${this.base}/${id}`);
  }

  create(command: CreateVehicleTrackingCommand): Observable<string> {
    return this.http.post<string>(this.base, command);
  }

  update(command: UpdateVehicleTrackingCommand): Observable<any> {
    return this.http.put<any>(this.base, command);
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.base}/${id}`);
  }
}
