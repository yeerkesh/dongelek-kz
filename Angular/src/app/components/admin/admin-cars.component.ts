import { Component, OnDestroy, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminService, adminError } from '../../services/admin.service';
import { CarService } from '../../services/car.service';
import { I18nService } from '../../services/i18n.service';
import { TPipe } from '../../pipes/t.pipe';
import { PricePipe } from '../../pipes/price.pipe';
import { DigitsDirective } from '../../directives/digits.directive';
import { PagerComponent } from './pager.component';
import { Car, CarBrand } from '../../interfaces/car.interface';
import { LIMITS, carErrors } from '../../validation';

@Component({
  selector: 'app-admin-cars',
  standalone: true,
  imports: [TPipe, PricePipe, FormsModule, RouterLink, DigitsDirective, PagerComponent],
  template: `
    <div class="adm-toolbar">
      <input class="grow" type="search" [placeholder]="'home.search' | t"
             (input)="onSearch($any($event.target).value)" />
      <select [(ngModel)]="status" (ngModelChange)="page = 1; load()">
        <option value="">{{ 'admin.filter.all' | t }}</option>
        <option value="active">{{ 'admin.filter.active' | t }}</option>
        <option value="inactive">{{ 'admin.filter.inactive' | t }}</option>
      </select>
      <a routerLink="/post-car" class="adm-btn">{{ 'nav.post' | t }}</a>
    </div>
    <p class="adm-hint">{{ 'admin.carsNote' | t }}</p>

    @if (error) { <div class="adm-error">⚠️ {{ error }}</div> }

    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>ID</th><th>{{ 'admin.col.photo' | t }}</th><th>{{ 'admin.col.title' | t }}</th>
            <th>{{ 'admin.col.brand' | t }}</th><th>{{ 'admin.col.owner' | t }}</th>
            <th>{{ 'admin.col.price' | t }}</th><th>{{ 'admin.col.year' | t }}</th>
            <th>{{ 'admin.col.status' | t }}</th><th>{{ 'admin.col.actions' | t }}</th>
          </tr>
        </thead>
        <tbody>
          @for (c of items; track c.id) {
            <tr>
              <td class="muted">{{ c.id }}</td>
              <td><div class="adm-thumb">@if (c.image_url) { <img [src]="c.image_url" alt="" /> } @else { 🚗 }</div></td>
              <td><a [routerLink]="['/cars', c.id]">{{ c.title }}</a></td>
              <td>{{ c.brand_name }}</td>
              <td>{{ c.owner_username }}</td>
              <td>{{ c.price | price }} ₸</td>
              <td>{{ c.year }}</td>
              <td><span class="chip" [class.ok]="c.is_active" [class.off]="!c.is_active">
                {{ (c.is_active ? 'common.active' : 'common.inactive') | t }}</span></td>
              <td>
                <div class="row-actions">
                  <button class="icon-btn" (click)="openEdit(c)">✏️ {{ 'common.edit' | t }}</button>
                  <button class="icon-btn" (click)="toggleActive(c)">
                    {{ (c.is_active ? 'admin.btn.hide' : 'admin.btn.show') | t }}</button>
                  <button class="icon-btn danger" (click)="remove(c)">🗑️</button>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
      @if (loading) { <p class="loading">{{ 'common.loading' | t }}</p> }
      @else if (items.length === 0) { <p class="empty">{{ 'search.none' | t }}</p> }
    </div>
    <app-pager [page]="page" [count]="count" (pageChange)="goTo($event)" />

    @if (editing) {
      <div class="modal-back" (click)="closeEdit()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>✏️ {{ 'admin.editCar' | t }} #{{ editing.id }}</h2>

          <label>{{ 'post.titleLabel' | t }}
            <input type="text" [(ngModel)]="eTitle" [maxlength]="limits.titleMax" [class.invalid]="errors['title']" />
            @if (errors['title']) { <small class="field-error">{{ errors['title'] }}</small> }
          </label>

          <div class="row2">
            <label>{{ 'post.brand' | t }}
              <select [(ngModel)]="eBrand">
                @for (b of brands; track b.id) { <option [value]="b.id">{{ b.name }}</option> }
              </select>
            </label>
            <label>{{ 'post.year' | t }}
              <input type="text" inputmode="numeric" appDigits maxlength="4" [(ngModel)]="eYear" [class.invalid]="errors['year']" />
              @if (errors['year']) { <small class="field-error">{{ errors['year'] }}</small> }
            </label>
          </div>

          <div class="row2">
            <label>{{ 'post.price' | t }}
              <input type="text" inputmode="numeric" appDigits maxlength="10" [(ngModel)]="ePrice" [class.invalid]="errors['price']" />
              @if (errors['price']) { <small class="field-error">{{ errors['price'] }}</small> }
            </label>
            <label>{{ 'post.mileage' | t }}
              <input type="text" inputmode="numeric" appDigits maxlength="7" [(ngModel)]="eMileage" [class.invalid]="errors['mileage']" />
              @if (errors['mileage']) { <small class="field-error">{{ errors['mileage'] }}</small> }
            </label>
          </div>

          <label>{{ 'post.city' | t }}
            <input type="text" [(ngModel)]="eCity" [maxlength]="limits.cityMax" [class.invalid]="errors['city']" />
            @if (errors['city']) { <small class="field-error">{{ errors['city'] }}</small> }
          </label>

          <label>{{ 'post.description' | t }}
            <textarea rows="4" [(ngModel)]="eDescription" [maxlength]="limits.descMax" [class.invalid]="errors['description']"></textarea>
            @if (errors['description']) { <small class="field-error">{{ errors['description'] }}</small> }
          </label>

          <label class="check"><input type="checkbox" [(ngModel)]="eActive" /> {{ 'post.isActive' | t }}</label>

          @if (modalError) { <div class="adm-error">{{ modalError }}</div> }

          <div class="modal-actions">
            <button class="adm-btn ghost" (click)="closeEdit()">{{ 'common.cancel' | t }}</button>
            <button class="adm-btn" (click)="saveEdit()" [disabled]="saving || !canSave">
              {{ (saving ? 'common.saving' : 'common.save') | t }}</button>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminCarsComponent implements OnInit, OnDestroy {
  private i18n = inject(I18nService);
  readonly limits = LIMITS;

  items: Car[] = [];
  brands: CarBrand[] = [];
  count = 0;
  page = 1;
  q = '';
  status = '';
  loading = true;
  error = '';

  editing: Car | null = null;
  eTitle = ''; eBrand: number | string = ''; ePrice: number | string = '';
  eYear: number | string = ''; eMileage: number | string = '';
  eCity = ''; eDescription = ''; eActive = true;
  saving = false;
  modalError = '';

  private search$ = new Subject<string>();
  private sub?: Subscription;

  constructor(
    private admin: AdminService,
    private carService: CarService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sub = this.search$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(q => {
      this.q = q;
      this.page = 1;
      this.load();
    });
    this.carService.getBrands().subscribe(b => { this.brands = b; this.cdr.detectChanges(); });
    this.load();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onSearch(value: string): void {
    this.search$.next(value.trim());
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.admin.list<Car>('cars', { page: this.page, q: this.q, status: this.status }).subscribe({
      next: res => {
        this.items = res.results;
        this.count = res.count;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        // the page may not exist any more (the last item was deleted)
        if (err.status === 404 && this.page > 1) { this.page--; this.load(); return; }
        this.error = this.i18n.t('error.adminLoad');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goTo(page: number): void {
    this.page = page;
    this.load();
  }

  toggleActive(car: Car): void {
    this.admin.update<Car>('cars', car.id, { is_active: !car.is_active }).subscribe({
      next: updated => this.replace(updated),
      error: (err: HttpErrorResponse) => { this.error = adminError(err, this.i18n); this.cdr.detectChanges(); }
    });
  }

  remove(car: Car): void {
    if (!confirm(this.i18n.t('confirm.deleteAd'))) return;
    this.admin.remove('cars', car.id).subscribe({
      next: () => this.load(),
      error: () => { this.error = this.i18n.t('error.delete'); this.cdr.detectChanges(); }
    });
  }

  private replace(updated: Car): void {
    this.items = this.items.map(i => (i.id === updated.id ? updated : i));
    this.cdr.detectChanges();
  }

  // ----- edit window -----
  openEdit(car: Car): void {
    this.editing = car;
    this.eTitle = car.title;
    this.eBrand = car.brand;
    this.ePrice = car.price;
    this.eYear = car.year;
    this.eMileage = car.mileage;
    this.eCity = car.city ?? '';
    this.eDescription = car.description;
    this.eActive = car.is_active;
    this.modalError = '';
  }

  closeEdit(): void {
    this.editing = null;
  }

  get errors(): Record<string, string> {
    return carErrors({
      title: this.eTitle, year: this.eYear, price: this.ePrice, mileage: this.eMileage,
      description: this.eDescription, city: this.eCity,
    }, (key, params) => this.i18n.t(key, params));
  }

  get canSave(): boolean {
    return !!(this.eTitle.trim() && this.eBrand !== '' && this.ePrice !== '' && this.eYear !== ''
      && this.eMileage !== '' && this.eDescription.trim()) && Object.keys(this.errors).length === 0;
  }

  saveEdit(): void {
    if (!this.editing || !this.canSave) return;
    this.saving = true;
    this.modalError = '';
    this.admin.update<Car>('cars', this.editing.id, {
      title: this.eTitle.trim(), brand: +this.eBrand, price: +this.ePrice, year: +this.eYear,
      mileage: +this.eMileage, city: this.eCity.trim(), description: this.eDescription.trim(),
      is_active: this.eActive,
    }).subscribe({
      next: updated => { this.replace(updated); this.saving = false; this.editing = null; this.cdr.detectChanges(); },
      error: (err: HttpErrorResponse) => {
        this.modalError = adminError(err, this.i18n);
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }
}
