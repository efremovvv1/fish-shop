import axios from "axios";
import { getTelegramInitData } from "../lib/telegram";
import type { CartResponse, ShopStatusResponse } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

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
  comment: string;
  items: { sku: string; qty: number }[];
}): Promise<CartResponse | null> {
  const initData = getTelegramInitData();

  if (!initData) {
    console.warn("Telegram initData not found. Order submit is unavailable outside Telegram.");
    alert("saveServerCart: initData is empty");
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
    alert("saveServerCart: initData is empty");
    return null;
  }

  const res = await api.post<{ order_id: string; status: string }>("/orders/submit", {
    init_data: initData,
  });

  return res.data;
}