import { inject } from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { TPipe } from '../../pipes/t.pipe';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarService } from '../../services/car.service';
import { Car } from '../../interfaces/car.interface';
import { PricePipe } from '../../pipes/price.pipe';
@Component({
  selector: 'app-my-cars',
  standalone: true,
  imports: [TPipe, RouterLink, PricePipe],
  templateUrl: './my-cars.component.html',
  styleUrl: './my-cars.component.css'
})
export class MyCarsComponent implements OnInit {
  private i18n = inject(I18nService);
  cars: Car[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  constructor(private carService: CarService, private cdr: ChangeDetectorRef) {}
  ngOnInit(): void {
    this.loadMyCars();
  }
  loadMyCars(): void {
    this.isLoading = true;
    this.carService.getMyCars().subscribe({
      next: cars => { this.cars = cars; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.errorMessage = this.i18n.t('error.loadMyCars'); this.isLoading = false; this.cdr.detectChanges(); }
    });
  }
  deleteCar(id: number): void {
    if (!confirm(this.i18n.t('confirm.deleteAd'))) return;
    this.carService.deleteCar(id).subscribe({
      next: () => {
        this.cars = this.cars.filter(c => c.id !== id);
        this.successMessage = this.i18n.t('msg.adDeleted');
        this.cdr.detectChanges();
        setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: () => { this.errorMessage = this.i18n.t('error.delete'); this.cdr.detectChanges(); }
    });
  }
}
