import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private auth: AuthService, private router: Router) {}

  isValid(): boolean {
    return !!(this.username && this.email && this.password && this.password === this.confirmPassword);
  }

  register(): void {
    if (!this.isValid()) {
      this.errorMessage = this.password !== this.confirmPassword
        ? 'Пароли не совпадают.' : 'Заполните все поля.';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.auth.register({ username: this.username, email: this.email, password: this.password }).subscribe({
      next: () => {
        this.successMessage = 'Аккаунт создан! Перенаправление...';
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Ошибка регистрации.';
        this.isLoading = false;
      }
    });
  }
}
