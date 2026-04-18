import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CarService } from '../../services/car.service';
import { Car, CarBrand } from '../../interfaces/car.interface';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, RouterLink, DecimalPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  cars: Car[] = [];
  brands: CarBrand[] = [];
  filteredCars: Car[] = [];

  selectedBrand: number | '' = '';
  minPrice: number | '' = '';
  maxPrice: number | '' = '';
  searchQuery = '';

  isLoading = false;
  errorMessage = '';

  constructor(private carService: CarService) {}

  ngOnInit(): void {
    this.carService.getBrands().subscribe({
      next: b => this.brands = b,
      error: () => this.errorMessage = 'Не удалось загрузить марки.'
    });
    this.loadCars();
  }

  loadCars(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.carService.getCars().subscribe({
      next: cars => {
        this.cars = cars;
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Ошибка загрузки. Проверьте подключение к серверу.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredCars = this.cars.filter(car => {
      const matchBrand = this.selectedBrand === '' || car.brand === +this.selectedBrand;
      const matchMin = this.minPrice === '' || car.price >= +this.minPrice;
      const matchMax = this.maxPrice === '' || car.price <= +this.maxPrice;
      const matchSearch = !this.searchQuery ||
        car.title.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchBrand && matchMin && matchMax && matchSearch;
    });
  }

  resetFilters(): void {
    this.selectedBrand = '';
    this.minPrice = '';
    this.maxPrice = '';
    this.searchQuery = '';
    this.applyFilters();
  }

  getBrandName(brandId: number): string {
    return this.brands.find(b => b.id === brandId)?.name || '';
  }
}
