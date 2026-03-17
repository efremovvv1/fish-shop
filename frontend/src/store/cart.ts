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

type CheckoutFields = {
  customerName: string;
  telegramUsername: string;
  phone: string;
  city: string;
  deliveryPoint: string;
  deliveryDate: string;
  comment: string;
};

type CartState = {
  items: CartItem[];
  checkout: CheckoutFields;
  cartStatus: "draft" | "submitted";
  shopStatus: "closed" | "open" | "locked";
  initialized: boolean;

  setInitialized: (value: boolean) => void;
  setShopStatus: (status: "closed" | "open" | "locked") => void;
  setCartStatus: (status: "draft" | "submitted") => void;

  setCheckoutField: (field: keyof CheckoutFields, value: string) => void;
  setCheckoutFields: (payload: Partial<CheckoutFields>) => void;

  addItem: (product: Product) => void;
  increaseItem: (sku: string) => void;
  decreaseItem: (sku: string) => void;
  removeItem: (sku: string) => void;

  replaceItemsFromServer: (
    items: { sku: string; qty: number }[],
    products: Product[]
  ) => void;

  clearCart: () => void;
  getTotal: () => number;
  getCount: () => number;
  canEdit: () => boolean;
};

function buildCartItem(product: Product, qty: number) {
  return {
    sku: product.sku,
    name: product.name,
    price: product.price,
    currency: product.currency,
    qty,
    unit: product.unit,
    min_qty: product.min_qty,
    step: product.step,
  };
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  checkout: {
    customerName: "",
    telegramUsername: "",
    phone: "",
    city: "",
    deliveryPoint: "",
    deliveryDate: "",
    comment: "",
  },
  cartStatus: "draft",
  shopStatus: "closed",
  initialized: false,

  setInitialized: (value) => set({ initialized: value }),
  setShopStatus: (status) => set({ shopStatus: status }),
  setCartStatus: (status) => set({ cartStatus: status }),

  setCheckoutField: (field, value) =>
    set({
      checkout: {
        ...get().checkout,
        [field]: value,
      },
    }),

  setCheckoutFields: (payload) =>
    set({
      checkout: {
        ...get().checkout,
        ...payload,
      },
    }),

  canEdit: () => {
    const { shopStatus } = get();
    return shopStatus === "open";
  },

  addItem: (product) => {
    if (!get().canEdit()) return;

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
      items: [...get().items, buildCartItem(product, product.min_qty)],
    });
  },

  increaseItem: (sku) => {
    if (!get().canEdit()) return;

    set({
      items: get().items.map((item) =>
        item.sku === sku
          ? { ...item, qty: Number((item.qty + item.step).toFixed(2)) }
          : item
      ),
    });
  },

  decreaseItem: (sku) => {
    if (!get().canEdit()) return;

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
    if (!get().canEdit()) return;

    set({
      items: get().items.filter((item) => item.sku !== sku),
    });
  },

  replaceItemsFromServer: (serverItems, products) => {
    const mapped = serverItems
      .map((serverItem) => {
        const product = products.find((p) => p.sku === serverItem.sku);
        if (!product) return null;
        return buildCartItem(product, serverItem.qty);
      })
      .filter(Boolean) as CartItem[];

    set({ items: mapped });
  },

  clearCart: () =>
    set({
      items: [],
      cartStatus: "draft",
      checkout: {
        customerName: "",
        telegramUsername: "",
        phone: "",
        city: "",
        deliveryPoint: "",
        deliveryDate: "",
        comment: "",
      },
    }),

  getTotal: () =>
    get().items.reduce((sum, item) => sum + item.price * item.qty, 0),

  getCount: () => get().items.reduce((sum, item) => sum + item.qty, 0),
}));