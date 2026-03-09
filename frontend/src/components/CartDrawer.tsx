import { useEffect, useState } from "react";
import { useCartStore } from "../store/cart";

type Props = {
  onCheckout: () => void;
  onExpired?: () => void;
};

function formatTime(totalSeconds: number) {
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function CartDrawer({ onCheckout, onExpired }: Props) {
  const items = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.getTotal());
  const clearCart = useCartStore((state) => state.clearCart);
  const increaseItem = useCartStore((state) => state.increaseItem);
  const decreaseItem = useCartStore((state) => state.decreaseItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const draftId = useCartStore((state) => state.draftId);
  const getRemainingSeconds = useCartStore((state) => state.getRemainingSeconds);

  const [seconds, setSeconds] = useState(getRemainingSeconds());

  useEffect(() => {
    const timer = setInterval(() => {
      const next = getRemainingSeconds();
      setSeconds(next);

      if (next <= 0 && items.length > 0) {
        clearCart();
        onExpired?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [getRemainingSeconds, clearCart, items.length, onExpired]);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 24,
        right: 24,
        bottom: 16,
        background: "#151518",
        color: "#fff",
        border: "1px solid #26262b",
        borderRadius: 20,
        padding: 18,
        boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
        zIndex: 50,
        maxHeight: "42vh",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Корзина</div>
          <div style={{ color: "#9ca3af", fontSize: 14 }}>
            {draftId ? `Номер корзины: ${draftId}` : ""} · Осталось: {formatTime(seconds)}
          </div>
        </div>

        <button
          onClick={clearCart}
          style={{
            background: "#2a2a30",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "10px 14px",
            fontWeight: 600,
          }}
        >
          Очистить
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
          marginBottom: 16,
          maxHeight: "22vh",
          overflowY: "auto",
          paddingRight: 4,
        }}
      >
        {items.map((item) => (
          <div
            key={item.sku}
            style={{
              background: "#1d1d22",
              border: "1px solid #2a2a30",
              borderRadius: 16,
              padding: 14,
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{item.name}</div>
              <div style={{ color: "#9ca3af", fontSize: 14 }}>
                {item.price} {item.currency} / {item.unit}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => decreaseItem(item.sku)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: "none",
                  background: "#2a2a30",
                  color: "#fff",
                  fontSize: 18,
                }}
              >
                -
              </button>

              <div style={{ minWidth: 70, textAlign: "center", fontWeight: 700 }}>
                {item.qty} {item.unit}
              </div>

              <button
                onClick={() => increaseItem(item.sku)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: "none",
                  background: "#ff6b35",
                  color: "#fff",
                  fontSize: 18,
                }}
              >
                +
              </button>
            </div>

            <div style={{ minWidth: 120, textAlign: "right", fontWeight: 700 }}>
              {(item.qty * item.price).toFixed(2)} {item.currency}
            </div>

            <button
              onClick={() => removeItem(item.sku)}
              style={{
                background: "transparent",
                color: "#ff8b6a",
                border: "none",
                fontWeight: 600,
              }}
            >
              Удалить
            </button>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ color: "#9ca3af", fontSize: 14 }}>Итого</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>
            {total.toFixed(2)} EUR
          </div>
        </div>

        <button
          onClick={onCheckout}
          style={{
            background: "#ff6b35",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            padding: "14px 18px",
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          Подтвердить заказ
        </button>
      </div>
    </div>
  );
}