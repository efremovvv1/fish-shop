import type { Product } from "../types";
import { useCartStore } from "../store/cart";

type Props = {
  product: Product;
};

export default function ProductCard({ product }: Props) {
  const addItem = useCartStore((state) => state.addItem);
  const canEdit = useCartStore((state) => state.canEdit());

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: 16,
        background: "rgba(7, 16, 24, 0.76)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        overflow: "hidden",
        backdropFilter: "blur(10px)",
        boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "16 / 10",
          borderRadius: 16,
          overflow: "hidden",
          background: "rgba(255,255,255,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div style={{ fontSize: 32 }}>🐟</div>
        )}
      </div>

      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          lineHeight: 1.18,
          letterSpacing: "-0.02em",
        }}
      >
        {product.name}
      </div>

      <div
        style={{
          alignSelf: "flex-start",
          fontSize: 13,
          color: "#dff7f4",
          background: "rgba(35, 190, 178, 0.14)",
          border: "1px solid rgba(35, 190, 178, 0.18)",
          borderRadius: 999,
          padding: "6px 10px",
        }}
      >
        {product.category}
      </div>

      {product.short_description && (
        <div style={{ fontSize: 14, color: "#d7e0e6", lineHeight: 1.45 }}>
          {product.short_description}
        </div>
      )}

      {product.description && (
        <div
          style={{
            fontSize: 13,
            color: "#97a6b2",
            lineHeight: 1.45,
            whiteSpace: "pre-wrap",
          }}
        >
          {product.description}
        </div>
      )}

      {product.notes && (
        <div
          style={{
            fontSize: 13,
            color: "#ffd166",
            lineHeight: 1.4,
            background: "rgba(255, 209, 102, 0.10)",
            border: "1px solid rgba(255, 209, 102, 0.14)",
            borderRadius: 12,
            padding: "8px 10px",
          }}
        >
          {product.notes}
        </div>
      )}

      <div
        style={{
          marginTop: 2,
          fontSize: 26,
          fontWeight: 800,
          color: "#fff",
        }}
      >
        {product.price} {product.currency} / {product.unit}
      </div>

      <button
        disabled={!canEdit}
        onClick={() => addItem(product)}
        style={{
          width: "100%",
          marginTop: "auto",
          padding: "13px 14px",
          borderRadius: 14,
          border: "none",
          background: canEdit
            ? "linear-gradient(180deg, #ff7a3d 0%, #ff6b35 100%)"
            : "#4b5563",
          color: "#fff",
          fontWeight: 700,
          fontSize: 16,
          opacity: canEdit ? 1 : 0.7,
          boxShadow: canEdit ? "0 10px 22px rgba(255,107,53,0.22)" : "none",
        }}
      >
        {canEdit ? "Добавить" : "Недоступно"}
      </button>
    </div>
  );
}