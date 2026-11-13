import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
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
      this.errorMessage = 'Введите логин и пароль.';
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
        console.log('LOGIN ERROR FULL:', err);
        console.log('LOGIN ERROR BODY:', err.error);

        this.errorMessage = 'Неверный логин или пароль';
        this.isLoading = false;

        this.cdr.detectChanges();
      }
    });
  }
}

