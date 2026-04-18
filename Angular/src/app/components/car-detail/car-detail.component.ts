import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CarService } from '../../services/car.service';
import { AuthService } from '../../services/auth.service';
import { Car } from '../../interfaces/car.interface';

@Component({
  selector: 'app-car-detail',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './car-detail.component.html',
  styleUrl: './car-detail.component.css'
})
export class CarDetailComponent implements OnInit {
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
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.carService.getCar(id).subscribe({
      next: car => { this.car = car; this.isLoading = false; },
      error: () => { this.errorMessage = 'Объявление не найдено.'; this.isLoading = false; }
    });
  }

  deleteCar(): void {
    if (!this.car || !confirm('Удалить объявление?')) return;
    this.carService.deleteCar(this.car.id).subscribe({
      next: () => this.router.navigate(['/my-cars']),
      error: () => this.errorMessage = 'Ошибка при удалении.'
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
        this.successMessage = 'Сообщение отправлено!';
        this.messageText = '';
        this.sendingMessage = false;
      },
      error: () => {
        this.errorMessage = 'Ошибка отправки. Войдите в аккаунт.';
        this.sendingMessage = false;
      }
    });
  }
}
