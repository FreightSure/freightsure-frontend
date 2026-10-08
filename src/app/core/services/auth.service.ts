import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';

import {
  LoginRequest,
  LoginResponse
} from '../models/api.models';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http = inject(HttpClient);

  private readonly tokenKey = 'freightsure_token';

  private readonly userKey = 'freightsure_user';


  login(
    credentials: LoginRequest
  ): Observable<LoginResponse> {

    return this.http
      .post<LoginResponse>(
        `${API_BASE_URL}/Auth/login`,
        credentials
      )
      .pipe(

        tap(response => {

          localStorage.setItem(
            this.tokenKey,
            response.token
          );


          localStorage.setItem(
            this.userKey,
            JSON.stringify(response)
          );

        })

      );

  }


  logout(): void {

    localStorage.removeItem(
      this.tokenKey
    );

    localStorage.removeItem(
      this.userKey
    );

  }


  getToken(): string | null {

    return localStorage.getItem(
      this.tokenKey
    );

  }


  isAuthenticated(): boolean {

    return !!this.getToken();

  }


  getCurrentUser(): LoginResponse | null {

    const user =
      localStorage.getItem(
        this.userKey
      );


    if (!user) {

      return null;

    }


    try {

      return JSON.parse(
        user
      ) as LoginResponse;

    } catch {

      return null;

    }

  }


  getUserRoles(): string[] { return this.getCurrentUser()?.roles ?? []; }
  isAdmin(): boolean { return this.getUserRoles().some(r => r.toLowerCase() === 'admin'); }
  hasRole(role: string): boolean { return this.getUserRoles().some(r => r.toLowerCase() === role.toLowerCase()); }
  getFullName(): string { return this.getCurrentUser()?.fullName ?? ''; }
  getEmail(): string { return this.getCurrentUser()?.email ?? ''; }
}

