import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  MissionDto,
  CreateMissionCommand,
  UpdateMissionCommand
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class MissionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/Mission`;

  getAll(): Observable<MissionDto[]> {
    return this.http.get<MissionDto[]>(this.base);
  }

  getById(id: string): Observable<MissionDto> {
    return this.http.get<MissionDto>(`${this.base}/${id}`);
  }

  create(command: CreateMissionCommand): Observable<string> {
    return this.http.post<string>(this.base, command);
  }

  update(command: UpdateMissionCommand): Observable<any> {
    return this.http.put<any>(this.base, command);
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.base}/${id}`);
  }
}
