import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarService } from '../../services/car.service';
import { Car } from '../../interfaces/car.interface';
import { DecimalPipe } from '@angular/common';
@Component({
  selector: 'app-my-cars',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './my-cars.component.html',
  styleUrl: './my-cars.component.css'
})
export class MyCarsComponent implements OnInit {
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
      error: () => { this.errorMessage = 'Не удалось загрузить ваши объявления.'; this.isLoading = false; this.cdr.detectChanges(); }
    });
  }
  deleteCar(id: number): void {
    if (!confirm('Удалить объявление?')) return;
    this.carService.deleteCar(id).subscribe({
      next: () => {
        this.cars = this.cars.filter(c => c.id !== id);
        this.successMessage = 'Объявление удалено.';
        this.cdr.detectChanges();
        setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: () => { this.errorMessage = 'Ошибка при удалении.'; this.cdr.detectChanges(); }
    });
  }
}
