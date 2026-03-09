import { create } from "zustand";
import type { Product } from "../types";

export type CartItem = {
  sku: string;
  name: string;
  price: number;
  currency: string;
  qty: number;
  unit: string;
  min_qty: number;
  step: number;
};

type CartState = {
  items: CartItem[];
  draftId: string | null;
  expiresAt: number | null;
  addItem: (product: Product) => void;
  increaseItem: (sku: string) => void;
  decreaseItem: (sku: string) => void;
  removeItem: (sku: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getCount: () => number;
  startDraftIfNeeded: () => void;
  getRemainingSeconds: () => number;
};

function generateDraftId() {
  return `DRAFT-${Date.now()}`;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  draftId: null,
  expiresAt: null,

  startDraftIfNeeded: () => {
  const { draftId, expiresAt } = get();

  if (draftId && expiresAt && expiresAt > Date.now()) {
    return;
  }

  set({
    draftId: generateDraftId(),
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
  },

  addItem: (product) => {
    get().startDraftIfNeeded();

    const existing = get().items.find((item) => item.sku === product.sku);

    if (existing) {
      set({
        items: get().items.map((item) =>
          item.sku === product.sku
            ? { ...item, qty: Number((item.qty + item.step).toFixed(2)) }
            : item
        ),
      });
      return;
    }

    set({
      items: [
        ...get().items,
        {
          sku: product.sku,
          name: product.name,
          price: product.price,
          currency: product.currency,
          qty: product.min_qty,
          unit: product.unit,
          min_qty: product.min_qty,
          step: product.step,
        },
      ],
    });
  },

  increaseItem: (sku) => {
    set({
      items: get().items.map((item) =>
        item.sku === sku
          ? { ...item, qty: Number((item.qty + item.step).toFixed(2)) }
          : item
      ),
    });
  },

  decreaseItem: (sku) => {
    const item = get().items.find((i) => i.sku === sku);
    if (!item) return;

    const newQty = Number((item.qty - item.step).toFixed(2));

    if (newQty < item.min_qty) {
      set({
        items: get().items.filter((i) => i.sku !== sku),
      });
      return;
    }

    set({
      items: get().items.map((i) =>
        i.sku === sku ? { ...i, qty: newQty } : i
      ),
    });
  },

  removeItem: (sku) => {
    set({
      items: get().items.filter((item) => item.sku !== sku),
    });
  },

  clearCart: () =>
    set({
      items: [],
      draftId: null,
      expiresAt: null,
    }),

  getTotal: () =>
    get().items.reduce((sum, item) => sum + item.price * item.qty, 0),

  getCount: () => get().items.reduce((sum, item) => sum + item.qty, 0),

  getRemainingSeconds: () => {
    const expiresAt = get().expiresAt;
    if (!expiresAt) return 0;
    return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  },
}));