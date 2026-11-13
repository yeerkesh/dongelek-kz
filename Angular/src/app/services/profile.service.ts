import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Profile {
  username: string;
  email: string;
  phone: string;
  city: string;
  date_joined: string;
  is_staff: boolean;
  cars_count: number;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private api = '/api';

  constructor(private http: HttpClient) {}

  getProfile(): Observable<Profile> {
    return this.http.get<Profile>(`${this.api}/profile/`);
  }

  updateProfile(data: { email: string; phone: string; city: string }): Observable<Profile> {
    return this.http.put<Profile>(`${this.api}/profile/`, data);
  }
}
