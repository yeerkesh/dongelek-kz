import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { UnreadService } from '../../services/unread.service';
import { I18nService } from '../../services/i18n.service';
import { TPipe } from '../../pipes/t.pipe';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TPipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  constructor(
    public auth: AuthService,
    public unread: UnreadService,
    public i18n: I18nService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // update the badge on every page change
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.unread.refresh());
  }

  search(value: string): void {
    const q = value.trim();
    if (q) this.router.navigate(['/search'], { queryParams: { q } });
  }

  logout(): void {
    this.auth.logout();
    this.unread.refresh();
  }
}
