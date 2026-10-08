import { Injectable, inject } from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private readonly http = inject(HttpClient);


  /**
   * GET
   */
  get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): Observable<T> {

    let httpParams = new HttpParams();


    if (params) {

      Object.entries(params).forEach(
        ([key, value]) => {

          httpParams = httpParams.set(
            key,
            String(value)
          );

        }
      );

    }


    return this.http.get<T>(
      `${API_BASE_URL}/${endpoint}`,
      {
        params: httpParams
      }
    );

  }


  /**
   * POST
   */
  post<T>(
    endpoint: string,
    body: unknown
  ): Observable<T> {

    return this.http.post<T>(
      `${API_BASE_URL}/${endpoint}`,
      body
    );

  }


  /**
   * PUT
   */
  put<T>(
    endpoint: string,
    body: unknown
  ): Observable<T> {

    return this.http.put<T>(
      `${API_BASE_URL}/${endpoint}`,
      body
    );

  }


  /**
   * DELETE
   */
  delete<T>(
    endpoint: string
  ): Observable<T> {

    return this.http.delete<T>(
      `${API_BASE_URL}/${endpoint}`
    );

  }

}