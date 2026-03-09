import { useCartStore } from "../store/cart";

export default function CartBar() {
  const items = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.getTotal());
  const clearCart = useCartStore((state) => state.clearCart);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        position: "sticky",
        bottom: 16,
        marginTop: 24,
        background: "#ff6b35",
        color: "#fff",
        borderRadius: 18,
        padding: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div>
        <div style={{ fontWeight: 700 }}>Корзина</div>
        <div style={{ fontSize: 14 }}>
          Позиций: {items.length} · Сумма: {total.toFixed(2)} EUR
        </div>
      </div>

      <button
        onClick={clearCart}
        style={{
          padding: "10px 14px",
          borderRadius: 12,
          border: "none",
          background: "#000",
          color: "#fff",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Очистить
      </button>
    </div>
  );
}