import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  EmployeeDto,
  CreateEmployeeCommand,
  UpdateEmployeeCommand
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/Employee`;

  getAll(): Observable<EmployeeDto[]> {
    return this.http.get<EmployeeDto[]>(this.base);
  }

  getById(id: string): Observable<EmployeeDto> {
    return this.http.get<EmployeeDto>(`${this.base}/${id}`);
  }

  create(command: CreateEmployeeCommand): Observable<string> {
    return this.http.post<string>(this.base, command);
  }

  update(command: UpdateEmployeeCommand): Observable<any> {
    return this.http.put<any>(this.base, command);
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.base}/${id}`);
  }
}
