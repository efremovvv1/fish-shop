import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { api } from "../api/client";
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
  const clearCart = useCartStore((state) => state.clearCart);

  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [deliveryPoint, setDeliveryPoint] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const tg = useMemo(() => getTelegramUser(), []);

  useEffect(() => {
    if (!open) return;

    if (tg.telegramUsername) {
      setTelegramUsername((prev) => prev || tg.telegramUsername);
    }

    if (tg.firstName) {
      const fullName = [tg.firstName, tg.lastName].filter(Boolean).join(" ");
      setCustomerName((prev) => prev || fullName);
    }

    api.get<DeliveryPoint[]>("/delivery-points").then((res) => {
      setDeliveryPoints(res.data);
    });
  }, [open, tg]);

  const filteredPoints = city
    ? deliveryPoints.filter((p) => p.city === city)
    : deliveryPoints;

  const cities = [...new Set(deliveryPoints.map((p) => p.city))];

  const submitOrder = async () => {
    if (!customerName || !city || !deliveryPoint || items.length === 0) {
      onError?.();
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        customer_name: customerName,
        telegram_username: telegramUsername,
        telegram_id: tg.telegramId,
        phone,
        city,
        delivery_point: deliveryPoint,
        comment,
        items: items.map((item) => ({
          sku: item.sku,
          qty: item.qty,
        })),
      };

      const res = await api.post("/orders", payload);

      clearCart();
      onClose();
      onSuccess?.(res.data.order_id);
    } catch (error) {
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
        padding: 16,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          background: "#151518",
          border: "1px solid #26262b",
          borderRadius: 20,
          padding: 20,
          color: "#fff",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Подтверждение заказа</h2>

        <div style={{ display: "grid", gap: 12 }}>
          <input
            placeholder="Ваше имя"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Telegram username"
            value={telegramUsername}
            onChange={(e) => setTelegramUsername(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Телефон"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
          />

          <select
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setDeliveryPoint("");
            }}
            style={inputStyle}
          >
            <option value="">Выберите город</option>
            {cities.map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>

          <select
            value={deliveryPoint}
            onChange={(e) => setDeliveryPoint(e.target.value)}
            style={inputStyle}
          >
            <option value="">Выберите точку выдачи</option>
            {filteredPoints.map((point) => (
              <option key={`${point.city}-${point.place}`} value={point.place}>
                {point.city} — {point.place} ({point.notes || "без времени"})
              </option>
            ))}
          </select>

          <textarea
            placeholder="Комментарий к заказу"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
          />
        </div>

        <div style={{ marginTop: 16, color: "#9ca3af" }}>
          Итого: <strong style={{ color: "#fff" }}>{total.toFixed(2)} EUR</strong>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button onClick={onClose} style={secondaryButtonStyle}>
            Отмена
          </button>
          <button onClick={submitOrder} style={primaryButtonStyle} disabled={submitting}>
            {submitting ? "Оформляем..." : "Подтвердить заказ"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  background: "#1d1d22",
  color: "#fff",
  border: "1px solid #2a2a30",
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 15,
};

const primaryButtonStyle: CSSProperties = {
  flex: 1,
  background: "#ff6b35",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 700,
};

const secondaryButtonStyle: CSSProperties = {
  flex: 1,
  background: "#2a2a30",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 700,
};