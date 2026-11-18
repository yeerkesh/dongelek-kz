import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { I18nService } from './i18n.service';

export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AdminStats {
  users: number;
  admins: number;
  blocked_users: number;
  cars: number;
  active_cars: number;
  brands: number;
  messages: number;
  total_views: number;
  cars_by_brand: { name: string; count: number }[];
  latest_users: { id: number; username: string; date_joined: string }[];
  latest_cars: { id: number; title: string; price: number; owner_username: string }[];
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
  cars_count: number;
}

export interface AdminBrand {
  id: number;
  name: string;
  cars_count: number;
}

export interface AdminMessage {
  id: number;
  sender: number;
  receiver: number;
  sender_username: string;
  receiver_username: string;
  car: number;
  car_title: string;
  text: string;
  created_at: string;
  is_read: boolean;
}

export interface ListQuery {
  page?: number;
  q?: string;
  status?: string;
  page_size?: number;
}

/** Requests of the admin panel (the server allows them only for admins). */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private api = '/api/manage';

  constructor(private http: HttpClient) {}

  stats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.api}/stats/`);
  }

  list<T>(resource: string, query: ListQuery = {}): Observable<Page<T>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    }
    return this.http.get<Page<T>>(`${this.api}/${resource}/`, { params });
  }

  create<T>(resource: string, data: unknown): Observable<T> {
    return this.http.post<T>(`${this.api}/${resource}/`, data);
  }

  update<T>(resource: string, id: number, data: unknown): Observable<T> {
    return this.http.patch<T>(`${this.api}/${resource}/${id}/`, data);
  }

  remove(resource: string, id: number): Observable<unknown> {
    return this.http.delete(`${this.api}/${resource}/${id}/`);
  }
}

/** Turns an error of the server into a message in the current language. */
export function adminError(err: HttpErrorResponse, i18n: I18nService): string {
  const body = err.error;
  if (err.status === 429) return i18n.t('error.tooMany');
  if (body?.code) return i18n.t('error.' + body.code);
  if (err.status === 400 && body && typeof body === 'object') {
    if (body.name) return i18n.t('error.brandExists');
    if (body.username) {
      const text = JSON.stringify(body.username).toLowerCase();
      return i18n.t(text.includes('exist') ? 'error.username_taken' : 'limit.username');
    }
    if (body.password) return i18n.t('error.password_weak');
    if (body.email) return i18n.t('limit.email');
    return i18n.t('error.invalidData');
  }
  return i18n.t('error.saveProfile');
}
