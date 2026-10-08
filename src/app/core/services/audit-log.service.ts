import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AuditLogDto } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/AuditLog`;

  getAll(): Observable<AuditLogDto[]> {
    return this.http.get<AuditLogDto[]>(this.base);
  }

  getById(id: string): Observable<AuditLogDto> {
    return this.http.get<AuditLogDto>(`${this.base}/${id}`);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
