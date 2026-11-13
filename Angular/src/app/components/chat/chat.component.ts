import { inject } from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { TPipe } from '../../pipes/t.pipe';
import { Component, OnDestroy, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MessageService, Thread } from '../../services/message.service';
import { UnreadService } from '../../services/unread.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [TPipe, FormsModule, RouterLink, DatePipe],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {
  private i18n = inject(I18nService);
  @ViewChild('list') list?: ElementRef<HTMLDivElement>;

  thread: Thread | null = null;
  text = '';
  isLoading = true;
  isSending = false;
  errorMessage = '';
  myId = 0;

  private carId = 0;
  private userId = 0;
  private timer: any;

  constructor(
    private route: ActivatedRoute,
    private messageService: MessageService,
    private unread: UnreadService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.myId = this.auth.getUserId();
    this.carId = Number(this.route.snapshot.paramMap.get('carId'));
    this.userId = Number(this.route.snapshot.paramMap.get('userId'));
    this.load(true);
    // look for new messages every 8 seconds
    this.timer = setInterval(() => this.load(false), 8000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  private load(first: boolean): void {
    this.messageService.getThread(this.carId, this.userId).subscribe({
      next: t => {
        const hadCount = this.thread?.messages.length ?? 0;
        this.thread = t;
        this.isLoading = false;
        this.cdr.detectChanges();
        if (first || t.messages.length !== hadCount) this.scrollDown();
        this.unread.refresh();
      },
      error: () => {
        if (first) this.errorMessage = this.i18n.t('error.openChat');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  send(): void {
    const value = this.text.trim();
    if (!value || this.isSending) return;
    this.isSending = true;
    this.errorMessage = '';
    this.messageService.send(this.carId, this.userId, value).subscribe({
      next: () => {
        this.text = '';
        this.isSending = false;
        this.load(false);
      },
      error: () => {
        this.errorMessage = this.i18n.t('error.sendMessage');
        this.isSending = false;
        this.cdr.detectChanges();
      }
    });
  }

  onEnter(event: Event): void {
    const e = event as KeyboardEvent;
    if (!e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }

  private scrollDown(): void {
    setTimeout(() => {
      const el = this.list?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  }
}
