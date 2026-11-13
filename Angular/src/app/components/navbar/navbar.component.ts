import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { UnreadService } from '../../services/unread.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  constructor(
    public auth: AuthService,
    public unread: UnreadService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // update the badge on every page change
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.unread.refresh());
  }

  logout(): void {
    this.auth.logout();
    this.unread.refresh();
  }
}
