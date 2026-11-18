import { Component, OnDestroy, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminMessage, AdminService } from '../../services/admin.service';
import { I18nService } from '../../services/i18n.service';
import { TPipe } from '../../pipes/t.pipe';
import { PagerComponent } from './pager.component';

@Component({
  selector: 'app-admin-messages',
  standalone: true,
  imports: [TPipe, DatePipe, RouterLink, PagerComponent],
  template: `
    <div class="adm-toolbar">
      <input class="grow" type="search" [placeholder]="'home.search' | t"
             (input)="onSearch($any($event.target).value)" />
    </div>

    @if (error) { <div class="adm-error">⚠️ {{ error }}</div> }

    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>ID</th><th>{{ 'admin.col.date' | t }}</th><th>{{ 'admin.col.from' | t }}</th>
            <th>{{ 'admin.col.to' | t }}</th><th>{{ 'admin.col.ad' | t }}</th>
            <th>{{ 'admin.col.text' | t }}</th><th>{{ 'admin.col.actions' | t }}</th>
          </tr>
        </thead>
        <tbody>
          @for (m of items; track m.id) {
            <tr>
              <td class="muted">{{ m.id }}</td>
              <td class="muted">{{ m.created_at | date: 'dd.MM.yyyy HH:mm' }}</td>
              <td>{{ m.sender_username }}</td>
              <td>{{ m.receiver_username }}</td>
              <td><a [routerLink]="['/cars', m.car]">{{ m.car_title }}</a></td>
              <td class="cell-text" [title]="m.text">{{ m.text }}</td>
              <td><button class="icon-btn danger" (click)="remove(m)">🗑️</button></td>
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
export class AdminMessagesComponent implements OnInit, OnDestroy {
  private i18n = inject(I18nService);

  items: AdminMessage[] = [];
  count = 0;
  page = 1;
  q = '';
  loading = true;
  error = '';

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
    this.admin.list<AdminMessage>('messages', { page: this.page, q: this.q }).subscribe({
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

  remove(message: AdminMessage): void {
    if (!confirm(this.i18n.t('admin.confirmDeleteMessage'))) return;
    this.admin.remove('messages', message.id).subscribe({
      next: () => this.load(),
      error: () => { this.error = this.i18n.t('error.delete'); this.cdr.detectChanges(); }
    });
  }
}
