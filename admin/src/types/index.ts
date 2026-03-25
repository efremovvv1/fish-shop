export type ShopStatus = "closed" | "open" | "locked";

export type AdminLoginResponse = {
  access_token: string;
  token_type: string;
};

export type ShopStatusResponse = {
  status: ShopStatus;
};

export type ShopStatusUpdateResponse = {
  status: ShopStatus;
  updated: boolean;
};

export type AdminCartItem = {
  sku: string;
  product_name: string;
  unit: string;
  qty: number;
};

export type AdminCart = {
  cart_id: number;
  telegram_user_id: string;
  telegram_username?: string;
  customer_name?: string;
  phone?: string;
  city?: string;
  delivery_point?: string;
  delivery_date?: string | null;
  approx_time?: string | null;
  comment?: string;
  status: string;
  updated_at?: string | null;
  submitted_at?: string | null;
  items: AdminCartItem[];
};

export type AdminCartsListResponse = {
  carts: AdminCart[];
};

export type AdminProductTotal = {
  sku: string;
  product_name: string;
  unit: string;
  total_qty: number;
};

export type AdminProduct = {
  id: number;
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

export type AdminDeliveryPoint = {
  id: number;
  city: string;
  place: string;
  active: boolean;
  notes?: string;
  delivery_date?: string | null;
  approx_time?: string | null;
};

export type AdminDeliveryDate = {
  id: number;
  delivery_point_id: number;
  city: string;
  delivery_date: string;
  approx_time?: string | null;
  active: boolean;
};