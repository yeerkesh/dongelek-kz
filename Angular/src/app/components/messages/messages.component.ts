import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CarService } from '../../services/car.service';
import { DecimalPipe } from '@angular/common';

interface Message {
  id: number;
  text: string;
  sender: number;
  receiver: number;
  car: number;
  created_at?: string;
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.css'
})
export class MessagesComponent implements OnInit {
  messages: Message[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(private carService: CarService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.carService.getMyMessages().subscribe({
      next: msgs => { this.messages = msgs; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.errorMessage = 'Не удалось загрузить сообщения.'; this.isLoading = false; this.cdr.detectChanges(); }
    });
  }
}
