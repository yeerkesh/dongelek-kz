import { inject } from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { TPipe } from '../../pipes/t.pipe';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Conversation, MessageService } from '../../services/message.service';
import { UnreadService } from '../../services/unread.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [TPipe, RouterLink, DatePipe],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.css'
})
export class MessagesComponent implements OnInit {
  private i18n = inject(I18nService);
  conversations: Conversation[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private messageService: MessageService,
    private unread: UnreadService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.messageService.getConversations().subscribe({
      next: list => {
        this.conversations = list;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = this.i18n.t('error.loadMessages');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
    this.unread.refresh();
  }
}
