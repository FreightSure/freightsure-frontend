import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  DeliveryDto,
  CreateDeliveryCommand,
  UpdateDeliveryCommand
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class DeliveryService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/Delivery`;

  getAll(): Observable<DeliveryDto[]> {
    return this.http.get<DeliveryDto[]>(this.base);
  }

  getById(id: string): Observable<DeliveryDto> {
    return this.http.get<DeliveryDto>(`${this.base}/${id}`);
  }

  create(command: CreateDeliveryCommand): Observable<string> {
    return this.http.post<string>(this.base, command);
  }

  update(command: UpdateDeliveryCommand): Observable<any> {
    return this.http.put<any>(this.base, command);
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.base}/${id}`);
  }
}
