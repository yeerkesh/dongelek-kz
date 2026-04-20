export interface Message {
  id?: number;
  sender?: number;
  receiver: number;
  car: number;
  text: string;
  created_at?: string;
}
