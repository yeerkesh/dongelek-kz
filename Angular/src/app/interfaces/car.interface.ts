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
  // details (see the car page)
  brand_name?: string;
  owner_username?: string;
  city?: string;
  body_type?: string;
  engine_volume?: number | null;
  fuel_type?: string;
  transmission?: string;
  drive?: string;
  steering?: string;
  customs_cleared?: boolean;
  phone?: string;
  has_phone?: boolean;
  views_count?: number;
  images?: string[];
}

export interface CarBrand {
  id: number;
  name: string;
}
