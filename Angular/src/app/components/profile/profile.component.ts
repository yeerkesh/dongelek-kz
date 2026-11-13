import { inject } from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { TPipe } from '../../pipes/t.pipe';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Profile, ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [TPipe, FormsModule, RouterLink, DatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private i18n = inject(I18nService);
  profile: Profile | null = null;
  email = '';
  phone = '';
  city = '';

  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private profileService: ProfileService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.profileService.getProfile().subscribe({
      next: p => {
        this.profile = p;
        this.email = p.email;
        this.phone = p.phone;
        this.city = p.city;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = this.i18n.t('error.loadProfile');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  save(): void {
    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.profileService.updateProfile({ email: this.email, phone: this.phone, city: this.city }).subscribe({
      next: p => {
        this.profile = p;
        this.successMessage = this.i18n.t('profile.saved');
        this.isSaving = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.error?.code
          ? this.i18n.t('error.' + err.error.code)
          : this.i18n.t('error.saveProfile');
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/home']);
  }
}
