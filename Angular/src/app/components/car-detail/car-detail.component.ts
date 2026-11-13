import { inject } from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { TPipe } from '../../pipes/t.pipe';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CarService } from '../../services/car.service';
import { AuthService } from '../../services/auth.service';
import { Car } from '../../interfaces/car.interface';
import { DecimalPipe } from '@angular/common';
@Component({
  selector: 'app-car-detail',
  standalone: true,
  imports: [TPipe, FormsModule, RouterLink, DecimalPipe],
  templateUrl: './car-detail.component.html',
  styleUrl: './car-detail.component.css'
})
export class CarDetailComponent implements OnInit {
  private i18n = inject(I18nService);
  car: Car | null = null;
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  messageText = '';
  sendingMessage = false;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private carService: CarService,
    public auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.carService.getCar(id).subscribe({
      next: car => { this.car = car; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.errorMessage = this.i18n.t('error.adNotFound'); this.isLoading = false; this.cdr.detectChanges(); }
    });
  }
  deleteCar(): void {
    if (!this.car || !confirm(this.i18n.t('confirm.deleteAd'))) return;
    this.carService.deleteCar(this.car.id).subscribe({
      next: () => this.router.navigate(['/my-cars']),
      error: () => this.errorMessage = this.i18n.t('error.delete')
    });
  }
  sendMessage(): void {
    if (!this.car || !this.messageText.trim()) return;
    this.sendingMessage = true;
    this.carService.sendMessage({
      receiver: this.car.owner,
      car: this.car.id,
      text: this.messageText
    }).subscribe({
      next: () => {
        this.successMessage = this.i18n.t('msg.messageSent');
        this.messageText = '';
        this.sendingMessage = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = this.i18n.t('error.sendFail');
        this.sendingMessage = false;
        this.cdr.detectChanges();
      }
    });
  }
}
