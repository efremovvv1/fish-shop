import type { Product } from "../types";
import { useCartStore } from "../store/cart";

type Props = {
  product: Product;
};

export default function ProductCard({ product }: Props) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <div
      style={{
        border: "1px solid #26262b",
        borderRadius: 18,
        padding: 18,
        background: "#151518",
        color: "#fff",
        minHeight: 360,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 10 }}>🐟</div>

      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, lineHeight: 1.15, minHeight: 84, }}>
        {product.name}
      </div>

      <div style={{ fontSize: 14, color: "#ff8b6a", marginBottom: 8 }}>
        {product.category}
      </div>

      {product.notes && (
        <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 10 }}>
          {product.notes}
        </div>
      )}

      <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: "#fff" }}>
        {product.price} {product.currency} / {product.unit}
      </div>

      <button
        onClick={() => addItem(product)}
        style={{
          width: "100%",
          marginTop: "auto",
          padding: "12px 14px",
          borderRadius: 14,
          border: "none",
          background: "#ff6b35",
          color: "#fff",
          fontWeight: 700,
          fontSize: 16,
        }}
      >
        Добавить
      </button>
    </div>
  );
}