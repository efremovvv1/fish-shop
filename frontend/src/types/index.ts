export type Product = {
  sku: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  unit: string;
  pack_size?: number | null;
  min_qty: number;
  step: number;
  available_qty: number;
  notes?: string;
  image_url?: string;
  short_description?: string;
  description?: string;
  active: boolean;
};

export type DeliveryPoint = {
  id: number;
  city: string;
  place: string;
  active: boolean;
  notes?: string | null;
  delivery_date?: string | null;
  approx_time?: string | null;
};

export type CartItemDraft = {
  sku: string;
  qty: number;
};

export type CartResponse = {
  delivery_date: string;
  telegram_user_id: string;
  telegram_username?: string;
  customer_name?: string;
  phone?: string;
  city?: string;
  delivery_point?: string;
  comment?: string;
  items: CartItemDraft[];
  status: string;
  updated_at?: string | null;
  submitted_at?: string | null;
};

export type ShopStatusResponse = {
  status: "closed" | "open" | "locked";
};

export type DeliveryDate = {
  id: number;
  city: string;
  delivery_date: string;
  active: boolean;
};