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
  active: boolean;
};

export type DeliveryPoint = {
  city: string;
  place: string;
  active: boolean;
  notes?: string;
};