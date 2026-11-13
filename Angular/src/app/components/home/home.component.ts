import { inject } from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { TPipe } from '../../pipes/t.pipe';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CarService } from '../../services/car.service';
import { Car, CarBrand } from '../../interfaces/car.interface';
import { DecimalPipe } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TPipe, FormsModule, RouterLink, DecimalPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private i18n = inject(I18nService);
  cars: Car[] = [];
  brands: CarBrand[] = [];
  filteredCars: Car[] = [];

  selectedBrand: number | '' = '';
  minPrice: number | '' = '';
  maxPrice: number | '' = '';
  searchQuery = '';

  isLoading = false;
  errorMessage = '';

  constructor(private carService: CarService, private cdr: ChangeDetectorRef) {
}

  ngOnInit(): void {
    this.carService.getBrands().subscribe({
      next: b => this.brands = b,
      error: () => this.errorMessage = this.i18n.t('error.loadBrands')
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
	this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = this.i18n.t('error.loadCars');
        this.isLoading = false;
	this.cdr.detectChanges();
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
