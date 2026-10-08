import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { VehicleDto, CreateVehicleCommand, UpdateVehicleCommand } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/Vehicle`;

  getAll(): Observable<VehicleDto[]> {
    return this.http.get<VehicleDto[]>(this.base);
  }

  getById(id: string): Observable<VehicleDto> {
    return this.http.get<VehicleDto>(`${this.base}/${id}`);
  }

  create(command: CreateVehicleCommand): Observable<string> {
    return this.http.post<string>(this.base, command);
  }

  // Backend returns bool — we use <any> to avoid type mismatch
  update(command: UpdateVehicleCommand): Observable<any> {
    return this.http.put<any>(this.base, command);
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.base}/${id}`);
  }
}
