import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarService } from '../../services/car.service';
import { Car } from '../../interfaces/car.interface';

@Component({
  selector: 'app-my-cars',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './my-cars.component.html',
  styleUrl: './my-cars.component.css'
})
export class MyCarsComponent implements OnInit {
  cars: Car[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  constructor(private carService: CarService) {}

  ngOnInit(): void {
    this.loadMyCars();
  }

  loadMyCars(): void {
    this.isLoading = true;
    this.carService.getMyCars().subscribe({
      next: cars => { this.cars = cars; this.isLoading = false; },
      error: () => { this.errorMessage = 'Не удалось загрузить ваши объявления.'; this.isLoading = false; }
    });
  }

  deleteCar(id: number): void {
    if (!confirm('Удалить объявление?')) return;
    this.carService.deleteCar(id).subscribe({
      next: () => {
        this.cars = this.cars.filter(c => c.id !== id);
        this.successMessage = 'Объявление удалено.';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => this.errorMessage = 'Ошибка при удалении.'
    });
  }
}
