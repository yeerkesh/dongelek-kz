import { Component, ViewEncapsulation } from '@angular/core';
import { TPipe } from '../../pipes/t.pipe';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminCarsComponent } from './admin-cars.component';
import { AdminBrandsComponent } from './admin-brands.component';
import { AdminUsersComponent } from './admin-users.component';
import { AdminMessagesComponent } from './admin-messages.component';

type Tab = 'dashboard' | 'cars' | 'brands' | 'users' | 'messages';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    TPipe, AdminDashboardComponent, AdminCarsComponent,
    AdminBrandsComponent, AdminUsersComponent, AdminMessagesComponent,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
  encapsulation: ViewEncapsulation.None   // the styles are shared with the tabs
})
export class AdminComponent {
  readonly tabs: { id: Tab; icon: string; key: string }[] = [
    { id: 'dashboard', icon: '📊', key: 'admin.tab.dashboard' },
    { id: 'cars', icon: '🚗', key: 'admin.tab.cars' },
    { id: 'brands', icon: '🏷️', key: 'admin.tab.brands' },
    { id: 'users', icon: '👥', key: 'admin.tab.users' },
    { id: 'messages', icon: '💬', key: 'admin.tab.messages' },
  ];

  tab: Tab = 'dashboard';

  constructor() {
    try {
      const saved = sessionStorage.getItem('admin_tab') as Tab | null;
      if (saved && this.tabs.some(t => t.id === saved)) this.tab = saved;
    } catch { /* ignore */ }
  }

  setTab(tab: Tab): void {
    this.tab = tab;
    try { sessionStorage.setItem('admin_tab', tab); } catch { /* ignore */ }
  }
}
