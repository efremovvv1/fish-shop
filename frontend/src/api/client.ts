import axios from "axios";
import { getTelegramInitData } from "../lib/telegram";
import type { CartResponse, ShopStatusResponse } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const detail =
        (error.response?.data as { detail?: string } | undefined)?.detail ||
        error.message ||
        "Request failed";

      return Promise.reject(new Error(detail));
    }

    return Promise.reject(error);
  }
);

export async function getShopStatus() {
  const res = await api.get<ShopStatusResponse>("/shop/status");
  return res.data;
}

export async function getServerCart(): Promise<CartResponse | null> {
  const initData = getTelegramInitData();

  if (!initData) {
    console.warn("Telegram initData not found. Cart is unavailable outside Telegram.");
    return null;
  }

  const res = await api.post<CartResponse>("/cart/get", {
    init_data: initData,
  });

  return res.data;
}

export async function saveServerCart(payload: {
  customer_name: string;
  phone: string;
  city: string;
  delivery_point: string;
  delivery_date?: string;
  approx_time?: string | null;
  comment: string;
  items: { sku: string; qty: number }[];
}): Promise<CartResponse | null> {
  const initData = getTelegramInitData();

  if (!initData) {
    console.warn("Telegram initData not found. Order submit is unavailable outside Telegram.");
    return null;
  }

  const res = await api.post<CartResponse>("/cart/save", {
    init_data: initData,
    ...payload,
  });

  return res.data;
}

export async function submitServerOrder(): Promise<{ order_id: string; status: string } | null> {
  const initData = getTelegramInitData();

  if (!initData) {
    console.warn("Telegram initData not found. Order submit is unavailable outside Telegram.");
    return null;
  }

  const res = await api.post<{ order_id: string; status: string }>("/orders/submit", {
    init_data: initData,
  });

  return res.data;
}

export async function getStoreSettings() {
  const res = await api.get<{
    shop_name: string;
    shop_cover_image: string;
  }>("/shop/store-settings");

  return res.data;
}