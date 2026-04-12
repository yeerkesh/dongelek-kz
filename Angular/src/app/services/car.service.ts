import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Car, CarBrand } from '../interfaces/car.interface';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CarService {
  private api = 'http://localhost:8000/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  getCars(): Observable<Car[]> {
    return this.http.get<Car[]>(`${this.api}/cars-cbv/`);
  }

  getCar(id: number): Observable<Car> {
    return this.http.get<Car>(`${this.api}/cars-cbv/${id}/`);
  }

  createCar(data: any): Observable<Car> {
    return this.http.post<Car>(`${this.api}/cars-cbv/`, data, { headers: this.authHeaders() });
  }

  updateCar(id: number, data: any): Observable<Car> {
    return this.http.put<Car>(`${this.api}/cars-cbv/${id}/`, data, { headers: this.authHeaders() });
  }

  deleteCar(id: number): Observable<any> {
    return this.http.delete(`${this.api}/cars-cbv/${id}/`, { headers: this.authHeaders() });
  }

  getMyCars(): Observable<Car[]> {
    return this.http.get<Car[]>(`${this.api}/my-cars/`, { headers: this.authHeaders() });
  }

  getBrands(): Observable<CarBrand[]> {
    return this.http.get<CarBrand[]>(`${this.api}/brands/`);
  }

  sendMessage(data: any): Observable<any> {
    return this.http.post(`${this.api}/messages/`, data, { headers: this.authHeaders() });
  }
}
