import { inject } from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { TPipe } from '../../pipes/t.pipe';
import { EMAIL_RE, LIMITS, USERNAME_RE } from '../../validation';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';



@Component({
  selector: 'app-register',
  standalone: true,
  imports: [TPipe, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private i18n = inject(I18nService);
  readonly limits = LIMITS;
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
  private auth: AuthService,
  private router: Router,
  private cdr: ChangeDetectorRef
) {}

  /** messages for the fields that are filled in wrong (same limits as on the server) */
  get errors(): Record<string, string> {
    const e: Record<string, string> = {};
    const username = this.username.trim();
    if (username && (username.length < LIMITS.usernameMin || username.length > LIMITS.usernameMax
        || !USERNAME_RE.test(username))) {
      e['username'] = this.i18n.t('limit.username');
    }
    const email = this.email.trim();
    if (email && (!EMAIL_RE.test(email) || email.length > LIMITS.emailMax)) {
      e['email'] = this.i18n.t('limit.email');
    }
    if (this.password && (this.password.length < LIMITS.passwordMin || this.password.length > LIMITS.passwordMax)) {
      e['password'] = this.i18n.t('auth.passwordMin');
    }
    return e;
  }

  isValid(): boolean {
    return !!(this.username.trim() && this.email.trim() && this.password && this.password === this.confirmPassword)
      && Object.keys(this.errors).length === 0;
  }

  register(): void {
    if (!this.isValid()) {
      this.errorMessage = this.password !== this.confirmPassword
        ? this.i18n.t('auth.mismatch') : this.i18n.t('error.fillAll');
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.auth.register({ username: this.username.trim(), email: this.email.trim(), password: this.password }).subscribe({
      next: () => {
        this.successMessage = this.i18n.t('msg.accountCreated');
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err: HttpErrorResponse) => {
        const code = err.error?.code;
        this.errorMessage = err.status === 429
          ? this.i18n.t('error.tooMany')
          : code
          ? this.i18n.t('error.' + code)
          : (err.error?.detail || this.i18n.t('error.register'));

        this.isLoading = false;
        this.cdr.detectChanges();
}
    });
  }
}
