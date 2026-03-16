import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { api, saveServerCart, submitServerOrder } from "../api/client";
import { useCartStore } from "../store/cart";
import type { DeliveryPoint } from "../types";
import { getTelegramUser } from "../lib/telegram";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (orderId: string) => void;
  onError?: () => void;
};

export default function CheckoutModal({
  open,
  onClose,
  onSuccess,
  onError,
}: Props) {
  const items = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.getTotal());
  const checkout = useCartStore((state) => state.checkout);
  const setCheckoutField = useCartStore((state) => state.setCheckoutField);
  const setCheckoutFields = useCartStore((state) => state.setCheckoutFields);
  //const setCartStatus = useCartStore((state) => state.setCartStatus);
  const canEdit = useCartStore((state) => state.canEdit());

  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const tg = useMemo(() => getTelegramUser(), []);

  useEffect(() => {
    if (!open) return;

    if (tg.telegramUsername) {
      setCheckoutFields({ telegramUsername: tg.telegramUsername });
    }

    if (tg.firstName && !checkout.customerName) {
      const fullName = [tg.firstName, tg.lastName].filter(Boolean).join(" ");
      setCheckoutFields({ customerName: fullName });
      }
    }, [open, tg, setCheckoutFields, checkout.customerName]);

   useEffect(() => {
    if (!open) return;

    api.get<DeliveryPoint[]>("/delivery-points").then((res) => {
      setDeliveryPoints(res.data);
    });
   }, [open]);

  const filteredPoints = checkout.city
    ? deliveryPoints.filter((p) => p.city === checkout.city)
    : deliveryPoints;

  const cities = [...new Set(deliveryPoints.map((p) => p.city))];

  const submitOrder = async () => {
    alert(
    JSON.stringify({
      canEdit,
      customerName: checkout.customerName,
      city: checkout.city,
      deliveryPoint: checkout.deliveryPoint,
      itemsLength: items.length,
      telegramInitDataExists: !!window.Telegram?.WebApp?.initData,
      telegramUser: window.Telegram?.WebApp?.initDataUnsafe?.user || null,
    })
    );
    if (!canEdit) {
      alert("Blocked: canEdit=false");
      onError?.();
      return;
    }

    if (!checkout.customerName || !checkout.city || !checkout.deliveryPoint || items.length === 0) {
      alert("Blocked: validation failed");
      onError?.();
      return;
    }

    try {
      setSubmitting(true);

      const savedCart = await saveServerCart({
        customer_name: checkout.customerName,
        phone: checkout.phone,
        city: checkout.city,
        delivery_point: checkout.deliveryPoint,
        comment: checkout.comment,
        items: items.map((item) => ({
          sku: item.sku,
          qty: item.qty,
        })),
      });

      if (!savedCart) {
        alert("savedCart is null");
        onError?.();
        return;
      }

      const res = await submitServerOrder();

      if (!res) {
        alert("submitServerOrder result is null");
        onError?.();
        return;
      }
     
      onClose();
      onSuccess?.(res.order_id);
    } catch (error) {
      alert(`submitOrder failed: ${String(error)}`);
      console.error(error);
      onError?.();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 12,
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          maxHeight: "calc(100vh - 24px)",
          background: "#151518",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 20,
          padding: 20,
          color: "#fff",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Ваш заказ</h2>

        <div style={{ display: "grid", gap: 12 }}>
          <input
            placeholder="Ваше имя"
            value={checkout.customerName}
            onChange={(e) => setCheckoutField("customerName", e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Telegram username"
            value={checkout.telegramUsername}
            onChange={(e) => setCheckoutField("telegramUsername", e.target.value)}
            style={inputStyle}
            disabled
          />

          <input
            placeholder="Телефон (опционально)"
            value={checkout.phone}
            onChange={(e) => setCheckoutField("phone", e.target.value)}
            style={inputStyle}
          />

          <select
            value={checkout.city}
            onChange={(e) => {
              setCheckoutField("city", e.target.value);
              setCheckoutField("deliveryPoint", "");
            }}
            style={inputStyle}
          >
            <option value="">Выберите город</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          <select
            value={checkout.deliveryPoint}
            onChange={(e) => setCheckoutField("deliveryPoint", e.target.value)}
            style={inputStyle}
          >

            <option value="">Выберите точку выдачи</option>
            {filteredPoints.map((point) => (
              <option key={`${point.city}-${point.place}`} value={point.place}>
                {point.place}
              </option>
            ))}
          </select>
          {checkout.deliveryPoint && (
            <div
                style={{
                fontSize: 13,
                color: "#9ca3af",
                lineHeight: 1.4,
                marginTop: -2,
                }}
            >
                {filteredPoints.find((point) => point.place === checkout.deliveryPoint)?.notes || ""}
            </div>
            )}
          
          <textarea
            placeholder="Комментарий"
            value={checkout.comment}
            onChange={(e) => setCheckoutField("comment", e.target.value)}
            style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
          />

          <div
            style={{
              background: "#1d1d22",
              border: "1px solid #2a2a30",
              borderRadius: 14,
              padding: 14,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Ваш заказ</div>
            <div style={{ display: "grid", gap: 6 }}>
              {items.map((item) => (
                <div key={item.sku} style={{ color: "#d1d5db" }}>
                  {item.name} — {item.qty} {item.unit}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, fontWeight: 700 }}>
              Итого: {total.toFixed(2)} EUR
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 18, position: "sticky", bottom: -20, background: "#151518", paddingTop: 12, paddingBottom: "max(4px, env(safe-area-inset-bottom))" }}>
          <button onClick={onClose} style={secondaryBtn} disabled={submitting}>
            Отмена
          </button>
          <button onClick={submitOrder} style={primaryBtn} disabled={submitting}>
            {submitting ? "Сохранение..." : "Сохранить заказ"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  background: "#1d1d22",
  border: "1px solid #2a2a30",
  borderRadius: 14,
  padding: "14px 16px",
  color: "#fff",
  fontSize: 16,
  boxSizing: "border-box",
};

const primaryBtn: CSSProperties = {
  flex: 1,
  background: "#ff6b35",
  color: "#fff",
  border: "none",
  borderRadius: 14,
  padding: "14px 16px",
  fontWeight: 700,
  fontSize: 16,
};

const secondaryBtn: CSSProperties = {
  flex: 1,
  background: "#2a2a30",
  color: "#fff",
  border: "none",
  borderRadius: 14,
  padding: "14px 16px",
  fontWeight: 700,
  fontSize: 16,
};