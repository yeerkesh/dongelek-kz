import { inject } from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { TPipe } from '../../pipes/t.pipe';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CarService } from '../../services/car.service';
import { AuthService } from '../../services/auth.service';
import { Car, CarBrand } from '../../interfaces/car.interface';

@Component({
  selector: 'app-post-car',
  standalone: true,
  imports: [TPipe, FormsModule, RouterLink],
  templateUrl: './post-car.component.html',
  styleUrl: './post-car.component.css'
})
export class PostCarComponent implements OnInit {
  private i18n = inject(I18nService);
  isEditMode = false;
  carId: number | null = null;
  brands: CarBrand[] = [];

  title = '';
  brand: number | '' = '';
  price: number | '' = '';
  year: number | '' = '';
  mileage: number | '' = '';
  description = '';
  imageUrl = '';
  isActive = true;

  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private carService: CarService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.carService.getBrands().subscribe({ next: b => this.brands = b });
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.carId = +id;
      this.carService.getCar(+id).subscribe({
        next: car => {
          if (car.owner !== this.auth.getUserId()) {
            this.router.navigate(['/home']);
            return;
          }
          this.title = car.title;
          this.brand = car.brand;
          this.price = car.price;
          this.year = car.year;
          this.mileage = car.mileage;
          this.description = car.description;
          this.imageUrl = car.image_url;
          this.isActive = car.is_active;
        },
        error: () => this.errorMessage = this.i18n.t('error.adNotFound')
      });
    }
  }

  isFormValid(): boolean {
    return !!(this.title && this.brand && this.price && this.year && this.mileage && this.description);
  }

  submit(): void {
    if (!this.isFormValid()) { this.errorMessage = this.i18n.t('error.fillRequired'); return; }
    this.isSubmitting = true;
    this.errorMessage = '';
    const payload = {
      title: this.title, brand: +this.brand, price: +this.price,
      year: +this.year, mileage: +this.mileage, description: this.description,
      image_url: this.imageUrl, is_active: this.isActive
    };
    const req$ = this.isEditMode && this.carId
      ? this.carService.updateCar(this.carId, payload)
      : this.carService.createCar(payload);

    req$.subscribe({
      next: (car) => {
        this.successMessage = this.isEditMode ? this.i18n.t('msg.updated') : this.i18n.t('msg.published');
        this.isSubmitting = false;
        setTimeout(() => this.router.navigate(['/cars', car.id]), 1200);
      },
      error: (err) => {
        this.errorMessage = err?.error?.detail || this.i18n.t('error.save');
        this.isSubmitting = false;
      }
    });
  }
}
