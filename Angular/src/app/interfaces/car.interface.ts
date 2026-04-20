export interface Car {
  id: number;
  title: string;
  brand: number;
  owner: number;
  price: number;
  year: number;
  mileage: number;
  description: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

export interface CarBrand {
  id: number;
  name: string;
}
