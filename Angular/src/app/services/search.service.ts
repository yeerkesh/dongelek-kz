import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CarCard {
  id: number;
  title: string;
  brand: number;
  brand_name: string;
  price: number;
  year: number;
  mileage: number;
  image_url: string;
  owner: number;
}

export interface BrandResult { id: number; name: string; cars_count: number; }
export interface SellerResult { id: number; username: string; city: string; cars_count: number; }

export interface SearchResult {
  query: string;
  cars: CarCard[];
  brands: BrandResult[];
  sellers: SellerResult[];
}

export interface SellerPage {
  id: number;
  username: string;
  city: string;
  date_joined: string;
  cars: CarCard[];
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private api = '/api';

  constructor(private http: HttpClient) {}

  search(q: string): Observable<SearchResult> {
    return this.http.get<SearchResult>(`${this.api}/search/`, { params: new HttpParams().set('q', q) });
  }

  getSeller(id: number): Observable<SellerPage> {
    return this.http.get<SellerPage>(`${this.api}/sellers/${id}/`);
  }
}
