import { inject } from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { TPipe } from '../../pipes/t.pipe';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [TPipe, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private i18n = inject(I18nService);
  username = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor(
  private auth: AuthService,
  private router: Router,
  private cdr: ChangeDetectorRef
) {}

  login(): void {
    if (!this.username || !this.password) {
      this.errorMessage = this.i18n.t('error.enterCreds');
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: (res) => {
        this.auth.saveTokens(res.access, res.refresh);
        this.router.navigate(['/home']);
      },
      error: (err: HttpErrorResponse) => {
        // 401 = wrong login or password; anything else is NOT a wrong password
        // (429 = too many attempts, 0 / 5xx = the server is down or broken)
        this.errorMessage = this.i18n.t(
          err.status === 401 ? 'error.badCreds'
          : err.status === 429 ? 'error.tooMany'
          : 'error.serverError');
        this.isLoading = false;

        this.cdr.detectChanges();
      }
    });
  }
}

