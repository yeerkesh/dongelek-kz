import { Component, OnDestroy, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminBrand, AdminService, adminError } from '../../services/admin.service';
import { I18nService } from '../../services/i18n.service';
import { TPipe } from '../../pipes/t.pipe';
import { PagerComponent } from './pager.component';

@Component({
  selector: 'app-admin-brands',
  standalone: true,
  imports: [TPipe, FormsModule, PagerComponent],
  template: `
    <div class="adm-form">
      <h2>🏷️ {{ 'admin.newBrand' | t }}</h2>
      <div class="row">
        <label>{{ 'admin.brandName' | t }}
          <input type="text" maxlength="100" [(ngModel)]="newName" (keyup.enter)="add()" />
        </label>
        <button class="adm-btn" (click)="add()" [disabled]="!newName.trim() || saving">{{ 'admin.btn.add' | t }}</button>
      </div>
    </div>

    <div class="adm-toolbar">
      <input class="grow" type="search" [placeholder]="'home.search' | t"
             (input)="onSearch($any($event.target).value)" />
    </div>

    @if (error) { <div class="adm-error">⚠️ {{ error }}</div> }

    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr><th>ID</th><th>{{ 'admin.col.title' | t }}</th><th>{{ 'admin.col.cars' | t }}</th><th>{{ 'admin.col.actions' | t }}</th></tr>
        </thead>
        <tbody>
          @for (b of items; track b.id) {
            <tr>
              <td class="muted">{{ b.id }}</td>
              <td>
                @if (editId === b.id) {
                  <input type="text" maxlength="100" [(ngModel)]="editName" (keyup.enter)="saveEdit(b)" (keyup.escape)="editId = null" />
                } @else { <strong>{{ b.name }}</strong> }
              </td>
              <td>{{ b.cars_count }}</td>
              <td>
                <div class="row-actions">
                  @if (editId === b.id) {
                    <button class="icon-btn" (click)="saveEdit(b)" [disabled]="!editName.trim()">💾 {{ 'common.save' | t }}</button>
                    <button class="icon-btn" (click)="editId = null">{{ 'common.cancel' | t }}</button>
                  } @else {
                    <button class="icon-btn" (click)="startEdit(b)">✏️ {{ 'common.edit' | t }}</button>
                    <button class="icon-btn danger" (click)="remove(b)">🗑️</button>
                  }
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
      @if (loading) { <p class="loading">{{ 'common.loading' | t }}</p> }
      @else if (items.length === 0) { <p class="empty">{{ 'search.none' | t }}</p> }
    </div>
    <app-pager [page]="page" [count]="count" [pageSize]="pageSize" (pageChange)="goTo($event)" />
  `
})
export class AdminBrandsComponent implements OnInit, OnDestroy {
  private i18n = inject(I18nService);

  items: AdminBrand[] = [];
  count = 0;
  page = 1;
  readonly pageSize = 15;
  q = '';
  loading = true;
  error = '';

  newName = '';
  saving = false;
  editId: number | null = null;
  editName = '';

  private search$ = new Subject<string>();
  private sub?: Subscription;

  constructor(private admin: AdminService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.sub = this.search$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(q => {
      this.q = q;
      this.page = 1;
      this.load();
    });
    this.load();
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  onSearch(value: string): void { this.search$.next(value.trim()); }

  load(): void {
    this.loading = true;
    this.admin.list<AdminBrand>('brands', { page: this.page, q: this.q, page_size: this.pageSize }).subscribe({
      next: res => { this.items = res.results; this.count = res.count; this.loading = false; this.cdr.detectChanges(); },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404 && this.page > 1) { this.page--; this.load(); return; }
        this.error = this.i18n.t('error.adminLoad');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goTo(page: number): void { this.page = page; this.load(); }

  add(): void {
    const name = this.newName.trim();
    if (!name || this.saving) return;
    this.saving = true;
    this.error = '';
    this.admin.create<AdminBrand>('brands', { name }).subscribe({
      next: () => { this.newName = ''; this.saving = false; this.page = 1; this.q = ''; this.load(); },
      error: (err: HttpErrorResponse) => {
        this.error = adminError(err, this.i18n);
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  startEdit(brand: AdminBrand): void {
    this.editId = brand.id;
    this.editName = brand.name;
  }

  saveEdit(brand: AdminBrand): void {
    const name = this.editName.trim();
    if (!name) return;
    this.error = '';
    this.admin.update<AdminBrand>('brands', brand.id, { name }).subscribe({
      next: () => { this.editId = null; this.load(); },
      error: (err: HttpErrorResponse) => { this.error = adminError(err, this.i18n); this.cdr.detectChanges(); }
    });
  }

  remove(brand: AdminBrand): void {
    if (!confirm(this.i18n.t('admin.confirmDeleteBrand', { name: brand.name }))) return;
    this.error = '';
    this.admin.remove('brands', brand.id).subscribe({
      next: () => this.load(),
      error: (err: HttpErrorResponse) => { this.error = adminError(err, this.i18n); this.cdr.detectChanges(); }
    });
  }
}
