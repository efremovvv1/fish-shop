import axios from "axios";
import type {
  AdminCart,
  AdminCartsListResponse,
  AdminLoginResponse,
  AdminProductTotal,
  ShopStatus,
  ShopStatusResponse,
  ShopStatusUpdateResponse,
  AdminProduct,
  AdminDeliveryPoint,
  AdminDeliveryDate,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export function getAdminToken() {
  return localStorage.getItem("admin_token") || "";
}

export function setAdminToken(token: string) {
  localStorage.setItem("admin_token", token);
}

export function clearAdminToken() {
  localStorage.removeItem("admin_token");
}

function authHeaders() {
  const token = getAdminToken();
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function adminLogin(username: string, password: string) {
  const res = await api.post<AdminLoginResponse>("/admin/login", {
    username,
    password,
  });

  return res.data;
}

export async function getAdminShopStatus() {
  const res = await api.get<ShopStatusResponse>("/admin/shop-status", {
    headers: authHeaders(),
  });

  return res.data;
}

export async function updateAdminShopStatus(status: ShopStatus) {
  const res = await api.post<ShopStatusUpdateResponse>(
    "/admin/shop-status",
    { status },
    { headers: authHeaders() }
  );

  return res.data;
}

export async function getAdminCarts() {
  const res = await api.get<AdminCartsListResponse>("/admin/carts", {
    headers: authHeaders(),
  });

  return res.data.carts;
}

export async function getAdminCartById(cartId: number) {
  const res = await api.get<AdminCart>(`/admin/carts/${cartId}`, {
    headers: authHeaders(),
  });

  return res.data;
}

export async function getAdminProductTotals() {
  const res = await api.get<{ totals: AdminProductTotal[] }>("/admin/product-totals", {
    headers: authHeaders(),
  });

  return res.data.totals;
}

export async function downloadOrdersExcel() {
  const res = await api.get("/admin/export/orders.xlsx", {
    headers: authHeaders(),
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "fishshop_orders.xlsx");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function getAdminProducts() {
  const res = await api.get<{ products: AdminProduct[] }>("/admin/products", {
    headers: authHeaders(),
  });

  return res.data.products;
}

export async function createAdminProduct(payload: {
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
}) {
  const res = await api.post<AdminProduct>("/admin/products", payload, {
    headers: authHeaders(),
  });

  return res.data;
}

export async function toggleAdminProduct(productId: number) {
  const res = await api.post<AdminProduct>(
    `/admin/products/${productId}/toggle`,
    {},
    { headers: authHeaders() }
  );

  return res.data;
}

export async function getAdminDeliveryPoints() {
  const res = await api.get<{ delivery_points: AdminDeliveryPoint[] }>(
    "/admin/delivery-points",
    {
      headers: authHeaders(),
    }
  );

  return res.data.delivery_points;
}

export async function createAdminDeliveryPoint(payload: {
  city: string;
  place: string;
  active: boolean;
  notes?: string;
}) {
  const res = await api.post<AdminDeliveryPoint>(
    "/admin/delivery-points",
    payload,
    {
      headers: authHeaders(),
    }
  );

  return res.data;
}

export async function toggleAdminDeliveryPoint(pointId: number) {
  const res = await api.post<AdminDeliveryPoint>(
    `/admin/delivery-points/${pointId}/toggle`,
    {},
    { headers: authHeaders() }
  );

  return res.data;
}

export async function updateAdminProduct(
  productId: number,
  payload: {
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
  }
) {
  const res = await api.put<AdminProduct>(
    `/admin/products/${productId}`,
    payload,
    {
      headers: authHeaders(),
    }
  );

  return res.data;
}

export async function deleteAdminProduct(productId: number) {
  const res = await api.delete<{ deleted: boolean }>(`/admin/products/${productId}`, {
    headers: authHeaders(),
  });

  return res.data;
}

export async function updateAdminDeliveryPoint(
  pointId: number,
  payload: {
    city: string;
    place: string;
    active: boolean;
    notes?: string;
  }
) {
  const res = await api.put<AdminDeliveryPoint>(
    `/admin/delivery-points/${pointId}`,
    payload,
    {
      headers: authHeaders(),
    }
  );

  return res.data;
}

export async function deleteAdminDeliveryPoint(pointId: number) {
  const res = await api.delete<{ deleted: boolean }>(`/admin/delivery-points/${pointId}`, {
    headers: authHeaders(),
  });

  return res.data;
}

export async function uploadAdminProductImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post<{ image_url: string }>(
    "/admin/upload/product-image",
    formData,
    {
      headers: {
        ...authHeaders(),
      },
    }
  );

  return res.data;
}

export async function clearAdminCarts() {
  const res = await api.post<{
    deleted: boolean;
    cleared_carts: number;
    shop_status: "closed" | "open" | "locked";
  }>(
    "/admin/clear-carts",
    {},
    {
      headers: authHeaders(),
    }
  );

  return res.data;
}

export async function downloadClientFormatExcel() {
  const res = await api.get("/admin/export/client-format.xlsx", {
    headers: authHeaders(),
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "fishshop_client_format.xlsx");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function getAdminDeliveryDates() {
  const res = await api.get<AdminDeliveryDate[]>("/admin/delivery-dates");
  return res.data;
}

export async function createAdminDeliveryDate(payload: {
  city: string;
  delivery_date: string;
  active: boolean;
}) {
  const res = await api.post<AdminDeliveryDate>("/admin/delivery-dates", payload);
  return res.data;
}

export async function deleteAdminDeliveryDate(id: number) {
  const res = await api.delete(`/admin/delivery-dates/${id}`);
  return res.data;
}