import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Conversation {
  car_id: number;
  car_title: string;
  car_image_url: string;
  other_user_id: number;
  other_username: string;
  last_text: string;
  last_at: string;
  last_from_me: boolean;
  unread: number;
}

export interface ChatMessage {
  id: number;
  sender: number;
  receiver: number;
  sender_username: string;
  text: string;
  created_at: string;
  is_read: boolean;
}

export interface Thread {
  car: { id: number; title: string; image_url: string; owner: number };
  other_user: { id: number; username: string };
  messages: ChatMessage[];
}

@Injectable({ providedIn: 'root' })
export class MessageService {
  private api = '/api';

  constructor(private http: HttpClient) {}

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.api}/conversations/`);
  }

  getThread(carId: number, userId: number): Observable<Thread> {
    return this.http.get<Thread>(`${this.api}/conversations/${carId}/${userId}/`);
  }

  send(carId: number, receiverId: number, text: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.api}/messages/`, {
      car: carId,
      receiver: receiverId,
      text
    });
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.api}/unread-count/`);
  }
}
