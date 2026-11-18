import { inject } from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { TPipe } from '../../pipes/t.pipe';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CarService } from '../../services/car.service';
import { AuthService } from '../../services/auth.service';
import { Car, CarBrand } from '../../interfaces/car.interface';
import { DigitsDirective } from '../../directives/digits.directive';
import { LIMITS, carErrors } from '../../validation';

@Component({
  selector: 'app-post-car',
  standalone: true,
  imports: [TPipe, FormsModule, RouterLink, DigitsDirective],
  templateUrl: './post-car.component.html',
  styleUrl: './post-car.component.css'
})
export class PostCarComponent implements OnInit {
  private i18n = inject(I18nService);
  readonly limits = LIMITS;
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

  // details of the car
  city = '';
  bodyType = '';
  engineVolume: number | '' = '';
  fuelType = '';
  transmission = '';
  drive = '';
  steering = 'left';
  customsCleared = true;
  phone = '';
  extraImages = '';   // one link per line

  readonly bodyTypes = ['sedan', 'suv', 'hatchback', 'wagon', 'coupe', 'minivan', 'pickup', 'other'];
  readonly fuelTypes = ['petrol', 'diesel', 'gas', 'hybrid', 'electric'];
  readonly transmissions = ['automatic', 'manual', 'robot', 'cvt'];
  readonly drives = ['front', 'rear', 'full'];
  readonly steerings = ['left', 'right'];

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
          this.city = car.city ?? '';
          this.bodyType = car.body_type ?? '';
          this.engineVolume = car.engine_volume ?? '';
          this.fuelType = car.fuel_type ?? '';
          this.transmission = car.transmission ?? '';
          this.drive = car.drive ?? '';
          this.steering = car.steering || 'left';
          this.customsCleared = car.customs_cleared !== false;
          this.phone = car.phone ?? '';
          this.extraImages = (car.images ?? []).join('\n');
        },
        error: () => this.errorMessage = this.i18n.t('error.adNotFound')
      });
    }
  }

  /** error messages of the fields that are filled in wrong (see validation.ts) */
  get errors(): Record<string, string> {
    return carErrors({
      title: this.title, year: this.year, price: this.price, mileage: this.mileage,
      engineVolume: this.engineVolume, description: this.description, city: this.city,
      phone: this.phone, imageUrl: this.imageUrl, extraImages: this.extraImages,
    }, (key, params) => this.i18n.t(key, params));
  }

  isFormValid(): boolean {
    const filled = !!(
      this.title.trim() && this.brand !== '' &&
      this.price !== '' && this.year !== '' && this.mileage !== '' &&
      this.description.trim()
    );
    return filled && Object.keys(this.errors).length === 0;
  }

  submit(): void {
    if (!this.isFormValid()) { this.errorMessage = this.i18n.t('error.fillRequired'); return; }
    this.isSubmitting = true;
    this.errorMessage = '';
    const payload = {
      title: this.title.trim(), brand: +this.brand, price: +this.price,
      year: +this.year, mileage: +this.mileage, description: this.description.trim(),
      image_url: this.imageUrl.trim(), is_active: this.isActive,
      city: this.city.trim(),
      body_type: this.bodyType,
      engine_volume: this.engineVolume === '' ? null : +this.engineVolume,
      fuel_type: this.fuelType,
      transmission: this.transmission,
      drive: this.drive,
      steering: this.steering,
      customs_cleared: this.customsCleared,
      phone: this.phone.trim(),
      extra_images: this.extraImages.split('\n').map(u => u.trim()).filter(u => u)
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
        const e = err?.error;
        this.errorMessage = (e?.extra_images || e?.image_url)
          ? this.i18n.t('error.badPhotoUrls')
          : (e && typeof e === 'object' && !e.detail
              ? this.i18n.t('error.invalidData')
              : (e?.detail || this.i18n.t('error.save')));
        this.isSubmitting = false;
      }
    });
  }
}
