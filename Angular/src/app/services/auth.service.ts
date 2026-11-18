import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse } from '../interfaces/user.interface';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = '/api';

  constructor(private http: HttpClient) {}

  register(data: any): Observable<any> {
    return this.http.post(`${this.api}/register/`, data);
  }

  login(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/login/`, data);
  }

  saveTokens(access: string, refresh?: string) {
    localStorage.setItem('access_token', access);
    if (refresh) localStorage.setItem('refresh_token', refresh);
  }

  saveToken(token: string) {
    localStorage.setItem('access_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /** Asks the server for a new access token using the refresh token. */
  refreshAccessToken(): Observable<{ access: string }> {
    return this.http
      .post<{ access: string }>(`${this.api}/refresh/`, { refresh: this.getRefreshToken() })
      .pipe(tap(res => this.saveToken(res.access)));
  }

  logout() {
    const refresh = this.getRefreshToken();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // the server cancels the refresh token, so a stolen copy stops working
    if (refresh) {
      this.http.post(`${this.api}/logout/`, { refresh }).subscribe({ error: () => {} });
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private payload(): any {
    const token = this.getToken();
    if (!token) return {};
    try {
      const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(part))));
    } catch { return {}; }
  }

  getUsername(): string {
    return this.payload().username || '';
  }

  getUserId(): number {
    // SimpleJWT stores the id as a string ("2"), so convert it to a number
    return Number(this.payload().user_id) || 0;
  }

  isStaff(): boolean {
    return !!this.payload().is_staff;
  }
}
