import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  ReviewDto,
  CreateReviewCommand,
  UpdateReviewCommand
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/Review`;

  getAll(): Observable<ReviewDto[]> {
    return this.http.get<ReviewDto[]>(this.base);
  }

  getById(id: string): Observable<ReviewDto> {
    return this.http.get<ReviewDto>(`${this.base}/${id}`);
  }

  create(command: CreateReviewCommand): Observable<string> {
    return this.http.post<string>(this.base, command);
  }

  update(command: UpdateReviewCommand): Observable<void> {
    return this.http.put<void>(this.base, command);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
