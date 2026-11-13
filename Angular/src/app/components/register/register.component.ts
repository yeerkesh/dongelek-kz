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
  selector: 'app-register',
  standalone: true,
  imports: [TPipe, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private i18n = inject(I18nService);
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

  isValid(): boolean {
    return !!(this.username && this.email && this.password && this.password === this.confirmPassword);
  }

  register(): void {
    if (!this.isValid()) {
      this.errorMessage = this.password !== this.confirmPassword
        ? this.i18n.t('auth.mismatch') : this.i18n.t('error.fillAll');
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.auth.register({ username: this.username, email: this.email, password: this.password }).subscribe({
      next: () => {
        this.successMessage = this.i18n.t('msg.accountCreated');
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err: HttpErrorResponse) => {
        console.log('REGISTER ERROR FULL:', err);
        console.log('REGISTER ERROR BODY:', err.error);

        const code = err.error?.code;
        this.errorMessage = code
          ? this.i18n.t('error.' + code)
          : (err.error?.detail || this.i18n.t('error.register'));

        this.isLoading = false;
        this.cdr.detectChanges();
}
    });
  }
}
