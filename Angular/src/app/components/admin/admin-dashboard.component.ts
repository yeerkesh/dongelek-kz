import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService, AdminStats } from '../../services/admin.service';
import { I18nService } from '../../services/i18n.service';
import { TPipe } from '../../pipes/t.pipe';
import { PricePipe } from '../../pipes/price.pipe';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [TPipe, DatePipe, PricePipe, RouterLink],
  template: `
    @if (loading) {
      <div class="loading">{{ 'common.loading' | t }}</div>
    } @else if (error) {
      <div class="adm-error">⚠️ {{ error }}</div>
    } @else if (stats) {
      <div class="stat-grid">
        <div class="stat-card">
          <div class="num">{{ stats.users | price }}</div>
          <div class="label">👥 {{ 'admin.stat.users' | t }}</div>
          <div class="sub">{{ 'admin.stat.admins' | t: { n: stats.admins } }}</div>
        </div>
        <div class="stat-card">
          <div class="num">{{ stats.cars | price }}</div>
          <div class="label">🚗 {{ 'admin.stat.cars' | t }}</div>
          <div class="sub">{{ 'admin.stat.activeCars' | t: { n: stats.active_cars } }}</div>
        </div>
        <div class="stat-card">
          <div class="num">{{ stats.brands | price }}</div>
          <div class="label">🏷️ {{ 'admin.stat.brands' | t }}</div>
        </div>
        <div class="stat-card">
          <div class="num">{{ stats.messages | price }}</div>
          <div class="label">💬 {{ 'admin.stat.messages' | t }}</div>
        </div>
        <div class="stat-card">
          <div class="num">{{ stats.total_views | price }}</div>
          <div class="label">👁 {{ 'admin.stat.views' | t }}</div>
        </div>
      </div>

      <div class="dash-grid">
        <div class="panel">
          <h2>{{ 'admin.byBrand' | t }}</h2>
          @if (stats.cars_by_brand.length === 0) {
            <p class="empty">{{ 'admin.noData' | t }}</p>
          }
          @for (b of stats.cars_by_brand; track b.name) {
            <div class="bar-row">
              <span>{{ b.name }}</span>
              <div class="bar-track"><div class="bar" [style.width.%]="(b.count / maxCount) * 100"></div></div>
              <strong>{{ b.count }}</strong>
            </div>
          }
        </div>

        <div>
          <div class="panel">
            <h2>{{ 'admin.latestUsers' | t }}</h2>
            @for (u of stats.latest_users; track u.id) {
              <div class="list-row">
                <span>{{ u.username }}</span>
                <span class="muted">{{ u.date_joined | date: 'dd.MM.yyyy' }}</span>
              </div>
            }
          </div>
          <div class="panel">
            <h2>{{ 'admin.latestCars' | t }}</h2>
            @for (c of stats.latest_cars; track c.id) {
              <div class="list-row">
                <a [routerLink]="['/cars', c.id]">{{ c.title }}</a>
                <span class="muted">{{ c.price | price }} ₸</span>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class AdminDashboardComponent implements OnInit {
  private i18n = inject(I18nService);

  stats: AdminStats | null = null;
  loading = true;
  error = '';

  constructor(private admin: AdminService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.admin.stats().subscribe({
      next: s => { this.stats = s; this.loading = false; this.cdr.detectChanges(); },
      error: () => {
        this.error = this.i18n.t('error.adminLoad');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get maxCount(): number {
    return Math.max(1, ...(this.stats?.cars_by_brand.map(b => b.count) ?? [1]));
  }
}
