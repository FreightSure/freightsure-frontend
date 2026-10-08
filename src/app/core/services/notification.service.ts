import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  NotificationDto,
  CreateNotificationCommand,
  UpdateNotificationCommand
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/Notification`;

  getAll(): Observable<NotificationDto[]> {
    return this.http.get<NotificationDto[]>(this.base);
  }

  getById(id: string): Observable<NotificationDto> {
    return this.http.get<NotificationDto>(`${this.base}/${id}`);
  }

  create(command: CreateNotificationCommand): Observable<string> {
    return this.http.post<string>(this.base, command);
  }

  update(command: UpdateNotificationCommand): Observable<void> {
    return this.http.put<void>(this.base, command);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
