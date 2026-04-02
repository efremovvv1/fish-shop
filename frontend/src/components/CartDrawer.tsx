import { useState } from "react";
import { useCartStore } from "../store/cart";

type Props = {
  onCheckout: () => void;
};

export default function CartDrawer({ onCheckout }: Props) {
  const items = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.getTotal());
  const clearCart = useCartStore((state) => state.clearCart);
  const increaseItem = useCartStore((state) => state.increaseItem);
  const decreaseItem = useCartStore((state) => state.decreaseItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const canEdit = useCartStore((state) => state.canEdit());
  const cartStatus = useCartStore((state) => state.cartStatus);

  const [collapsed, setCollapsed] = useState(true);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: 12,
        background: "rgba(10, 19, 27, 0.92)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
        backdropFilter: "blur(10px)",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          padding: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Корзина</div>
          <div style={{ color: "#9ca3af", fontSize: 14 }}>
            {items.length} поз. · {total.toFixed(2)} EUR
          </div>
          {cartStatus === "submitted" && (
            <div style={{ color: "#86efac", fontSize: 13, marginTop: 6 }}>
              Заказ уже сохранён
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {collapsed && (
            <button onClick={onCheckout} style={checkoutBtn(canEdit)} disabled={!canEdit}>
              {canEdit ? "Открыть корзину" : "Приём закрыт"}
            </button>
          )}

          <button
            onClick={() => setCollapsed((prev) => !prev)}
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              border: "none",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              fontSize: 32,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {collapsed ? "▴" : "▾"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div
          style={{
            padding: "0 16px 16px 16px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            maxHeight: "55vh",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              margin: "14px 0",
              flexWrap: "wrap",
            }}
          >
            <div style={{ color: "#9ca3af", fontSize: 14 }}>
              {canEdit ? "Корзину можно редактировать" : "Редактирование недоступно"}
            </div>

            <button
              disabled={!canEdit}
              onClick={clearCart}
              style={{
                background: canEdit ? "#24313a" : "#374151",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "10px 14px",
                fontWeight: 600,
                opacity: canEdit ? 1 : 0.7,
              }}
            >
              Очистить
            </button>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {items.map((item) => (
              <div
                key={item.sku}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 16,
                  padding: 14,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{item.name}</div>

                <div style={{ color: "#9ca3af", fontSize: 14, marginBottom: 10 }}>
                  {item.price} {item.currency} / {item.unit}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      disabled={!canEdit}
                      onClick={() => decreaseItem(item.sku)}
                      style={qtyBtn(canEdit)}
                    >
                      −
                    </button>

                    <div style={{ minWidth: 70, textAlign: "center" }}>
                      {item.qty} {item.unit}
                    </div>

                    <button
                      disabled={!canEdit}
                      onClick={() => increaseItem(item.sku)}
                      style={qtyBtn(canEdit)}
                    >
                      +
                    </button>
                  </div>

                  <button
                    disabled={!canEdit}
                    onClick={() => removeItem(item.sku)}
                    style={removeBtn(canEdit)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            disabled={!canEdit}
            onClick={onCheckout}
            style={{
              width: "100%",
              marginTop: 16,
              background: canEdit ? "#ff6b35" : "#4b5563",
              color: "#fff",
              border: "none",
              borderRadius: 14,
              padding: "14px 16px",
              fontWeight: 700,
              fontSize: 16,
              opacity: canEdit ? 1 : 0.7,
            }}
          >
            {canEdit ? "Сохранить заказ" : "Редактирование недоступно"}
          </button>
        </div>
      )}
    </div>
  );
}

function qtyBtn(enabled: boolean) {
  return {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: "none",
    background: enabled ? "#24313a" : "#374151",
    color: "#fff",
    fontSize: 20,
    opacity: enabled ? 1 : 0.7,
  } as const;
}

function removeBtn(enabled: boolean) {
  return {
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    background: enabled ? "#3b1f24" : "#374151",
    color: "#fff",
    opacity: enabled ? 1 : 0.7,
  } as const;
}

function checkoutBtn(enabled: boolean) {
  return {
    minWidth: 168,
    height: 52,
    borderRadius: 14,
    border: "none",
    background: enabled
      ? "linear-gradient(180deg, #ff7a3d 0%, #ff6b35 100%)"
      : "#4b5563",
    color: "#fff",
    padding: "0 18px",
    fontWeight: 800,
    fontSize: 16,
    boxShadow: enabled ? "0 10px 24px rgba(255,107,53,0.28)" : "none",
    opacity: enabled ? 1 : 0.75,
    cursor: enabled ? "pointer" : "not-allowed",
  } as const;
}