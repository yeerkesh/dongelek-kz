import { Injectable, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { MessageService } from './message.service';

/** Keeps the number of unread messages (red badge in the navbar). */
@Injectable({ providedIn: 'root' })
export class UnreadService {
  count = signal(0);

  constructor(private auth: AuthService, private messages: MessageService) {
    // check for new messages every 15 seconds
    setInterval(() => this.refresh(), 15000);
  }

  refresh(): void {
    if (!this.auth.isLoggedIn()) {
      this.count.set(0);
      return;
    }
    this.messages.getUnreadCount().subscribe({
      next: res => this.count.set(res.count),
      error: () => {}
    });
  }
}
