import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { CarService } from '../../services/car.service';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';
import { TPipe } from '../../pipes/t.pipe';
import { PricePipe } from '../../pipes/price.pipe';
import { Car } from '../../interfaces/car.interface';

interface Spec { label: string; value: string; }

@Component({
  selector: 'app-car-detail',
  standalone: true,
  imports: [TPipe, PricePipe, FormsModule, RouterLink, DatePipe],
  templateUrl: './car-detail.component.html',
  styleUrl: './car-detail.component.css'
})
export class CarDetailComponent implements OnInit {
  private i18n = inject(I18nService);

  car: Car | null = null;
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  selectedPhoto = 0;

  phone = '';
  phoneLoading = false;
  phoneError = '';

  showMessageBox = false;
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
      error: () => {
        this.errorMessage = this.i18n.t('error.adNotFound');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get isOwner(): boolean {
    return !!this.car && this.auth.isLoggedIn() && this.auth.getUserId() === this.car.owner;
  }

  /** main photo first, then the additional ones */
  get photos(): string[] {
    if (!this.car) return [];
    const list: string[] = [];
    if (this.car.image_url) list.push(this.car.image_url);
    for (const url of this.car.images ?? []) list.push(url);
    return list;
  }

  /** the table of characteristics (only the rows that are filled in) */
  get specs(): Spec[] {
    const c = this.car;
    if (!c) return [];
    const t = (key: string) => this.i18n.t(key);
    const rows: Spec[] = [];

    if (c.city) rows.push({ label: t('detail.city'), value: c.city });
    if (c.body_type) rows.push({ label: t('detail.body'), value: t('body.' + c.body_type) });
    if (c.engine_volume) {
      const fuel = c.fuel_type ? ` (${t('fuel.' + c.fuel_type)})` : '';
      rows.push({ label: t('detail.engine'), value: c.engine_volume.toFixed(1) + fuel });
    }
    rows.push({
      label: t('detail.mileage'),
      value: `${c.mileage.toLocaleString('ru-RU')} ${t('common.km')}`
    });
    if (c.transmission) rows.push({ label: t('detail.transmission'), value: t('tr.' + c.transmission) });
    if (c.drive) rows.push({ label: t('detail.drive'), value: t('drive.' + c.drive) });
    if (c.steering) rows.push({ label: t('detail.steering'), value: t('steer.' + c.steering) });
    rows.push({
      label: t('detail.customs'),
      value: t(c.customs_cleared === false ? 'common.no' : 'common.yes')
    });
    return rows;
  }

  selectPhoto(index: number): void {
    this.selectedPhoto = index;
  }

  step(delta: number): void {
    const n = this.photos.length;
    if (n > 1) this.selectedPhoto = (this.selectedPhoto + delta + n) % n;
  }

  showPhone(): void {
    if (!this.car || this.phoneLoading) return;
    this.phoneLoading = true;
    this.phoneError = '';
    this.carService.getCarPhone(this.car.id).subscribe({
      next: res => { this.phone = res.phone; this.phoneLoading = false; this.cdr.detectChanges(); },
      error: (err: HttpErrorResponse) => {
        this.phoneError = this.i18n.t(err.status === 429 ? 'error.tooMany' : 'error.phoneFail');
        this.phoneLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteCar(): void {
    if (!this.car || !confirm(this.i18n.t('confirm.deleteAd'))) return;
    this.carService.deleteCar(this.car.id).subscribe({
      next: () => this.router.navigate(['/my-cars']),
      error: () => { this.errorMessage = this.i18n.t('error.delete'); this.cdr.detectChanges(); }
    });
  }

  sendMessage(): void {
    if (!this.car || !this.messageText.trim()) return;
    this.sendingMessage = true;
    this.errorMessage = '';
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
      error: (err: HttpErrorResponse) => {
        this.errorMessage = this.i18n.t(err.status === 429 ? 'error.tooMany' : 'error.sendFail');
        this.sendingMessage = false;
        this.cdr.detectChanges();
      }
    });
  }
}
