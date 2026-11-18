import { Component, OnDestroy, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminService, AdminUser, adminError } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';
import { TPipe } from '../../pipes/t.pipe';
import { PagerComponent } from './pager.component';
import { EMAIL_RE, LIMITS, USERNAME_RE } from '../../validation';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [TPipe, FormsModule, DatePipe, PagerComponent],
  template: `
    <div class="adm-toolbar">
      <input class="grow" type="search" [placeholder]="'home.search' | t"
             (input)="onSearch($any($event.target).value)" />
      <button class="adm-btn" (click)="showForm = !showForm">+ {{ 'admin.newUser' | t }}</button>
    </div>

    @if (showForm) {
      <div class="adm-form">
        <h2>👤 {{ 'admin.newUser' | t }}</h2>
        <div class="row">
          <label>{{ 'auth.username' | t }}
            <input type="text" [(ngModel)]="nUsername" [maxlength]="limits.usernameMax" [class.invalid]="errors['username']" />
            @if (errors['username']) { <small class="field-error">{{ errors['username'] }}</small> }
          </label>
          <label>{{ 'auth.email' | t }}
            <input type="email" [(ngModel)]="nEmail" [maxlength]="limits.emailMax" [class.invalid]="errors['email']" />
            @if (errors['email']) { <small class="field-error">{{ errors['email'] }}</small> }
          </label>
          <label>{{ 'auth.password' | t }}
            <input type="password" [(ngModel)]="nPassword" [maxlength]="limits.passwordMax" [class.invalid]="errors['password']" />
            @if (errors['password']) { <small class="field-error">{{ errors['password'] }}</small> }
          </label>
          <label class="check"><input type="checkbox" [(ngModel)]="nStaff" /> {{ 'admin.role.admin' | t }}</label>
          <button class="adm-btn" (click)="create()" [disabled]="!canCreate || saving">{{ 'admin.btn.add' | t }}</button>
        </div>
      </div>
    }

    @if (error) { <div class="adm-error">⚠️ {{ error }}</div> }

    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>ID</th><th>{{ 'auth.username' | t }}</th><th>{{ 'auth.email' | t }}</th>
            <th>{{ 'admin.col.role' | t }}</th><th>{{ 'admin.col.status' | t }}</th>
            <th>{{ 'admin.col.cars' | t }}</th><th>{{ 'admin.col.joined' | t }}</th>
            <th>{{ 'admin.col.actions' | t }}</th>
          </tr>
        </thead>
        <tbody>
          @for (u of items; track u.id) {
            <tr>
              <td class="muted">{{ u.id }}</td>
              <td><strong>{{ u.username }}</strong>@if (isMe(u)) { <span class="muted"> ({{ 'msg.you' | t }})</span> }</td>
              <td>{{ u.email }}</td>
              <td><span class="chip" [class.admin]="u.is_staff" [class.user]="!u.is_staff">
                {{ (u.is_staff ? 'admin.role.admin' : 'admin.role.user') | t }}</span></td>
              <td><span class="chip" [class.ok]="u.is_active" [class.off]="!u.is_active">
                {{ (u.is_active ? 'admin.userActive' : 'admin.blocked') | t }}</span></td>
              <td>{{ u.cars_count }}</td>
              <td class="muted">{{ u.date_joined | date: 'dd.MM.yyyy' }}</td>
              <td>
                <div class="row-actions">
                  <button class="icon-btn" (click)="toggle(u, 'is_staff')" [disabled]="isMe(u)">
                    {{ (u.is_staff ? 'admin.btn.removeAdmin' : 'admin.btn.makeAdmin') | t }}</button>
                  <button class="icon-btn" (click)="toggle(u, 'is_active')" [disabled]="isMe(u)">
                    {{ (u.is_active ? 'admin.btn.block' : 'admin.btn.unblock') | t }}</button>
                  <button class="icon-btn danger" (click)="remove(u)" [disabled]="isMe(u)">🗑️</button>
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
  `
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  private i18n = inject(I18nService);
  readonly limits = LIMITS;

  items: AdminUser[] = [];
  count = 0;
  page = 1;
  q = '';
  loading = true;
  error = '';

  showForm = false;
  nUsername = ''; nEmail = ''; nPassword = ''; nStaff = false;
  saving = false;

  private search$ = new Subject<string>();
  private sub?: Subscription;

  constructor(private admin: AdminService, private auth: AuthService, private cdr: ChangeDetectorRef) {}

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

  isMe(user: AdminUser): boolean {
    return user.id === this.auth.getUserId();
  }

  load(): void {
    this.loading = true;
    this.admin.list<AdminUser>('users', { page: this.page, q: this.q }).subscribe({
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

  // ----- new user -----
  get errors(): Record<string, string> {
    const e: Record<string, string> = {};
    const username = this.nUsername.trim();
    if (username && (username.length < LIMITS.usernameMin || username.length > LIMITS.usernameMax
        || !USERNAME_RE.test(username))) e['username'] = this.i18n.t('limit.username');
    const email = this.nEmail.trim();
    if (email && !EMAIL_RE.test(email)) e['email'] = this.i18n.t('limit.email');
    if (this.nPassword && (this.nPassword.length < LIMITS.passwordMin || this.nPassword.length > LIMITS.passwordMax)) {
      e['password'] = this.i18n.t('auth.passwordMin');
    }
    return e;
  }

  get canCreate(): boolean {
    return !!(this.nUsername.trim() && this.nEmail.trim() && this.nPassword) && Object.keys(this.errors).length === 0;
  }

  create(): void {
    if (!this.canCreate || this.saving) return;
    this.saving = true;
    this.error = '';
    this.admin.create<AdminUser>('users', {
      username: this.nUsername.trim(), email: this.nEmail.trim(),
      password: this.nPassword, is_staff: this.nStaff,
    }).subscribe({
      next: () => {
        this.nUsername = ''; this.nEmail = ''; this.nPassword = ''; this.nStaff = false;
        this.saving = false; this.showForm = false; this.page = 1; this.q = '';
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.error = adminError(err, this.i18n);
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ----- role / blocking / delete -----
  toggle(user: AdminUser, field: 'is_staff' | 'is_active'): void {
    this.error = '';
    this.admin.update<AdminUser>('users', user.id, { [field]: !user[field] }).subscribe({
      next: updated => {
        this.items = this.items.map(i => (i.id === updated.id ? updated : i));
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => { this.error = adminError(err, this.i18n); this.cdr.detectChanges(); }
    });
  }

  remove(user: AdminUser): void {
    if (!confirm(this.i18n.t('admin.confirmDeleteUser', { name: user.username }))) return;
    this.error = '';
    this.admin.remove('users', user.id).subscribe({
      next: () => this.load(),
      error: (err: HttpErrorResponse) => { this.error = adminError(err, this.i18n); this.cdr.detectChanges(); }
    });
  }
}
