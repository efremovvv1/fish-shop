import { useEffect, useMemo, useState } from "react";
import { api, getServerCart, getShopStatus, saveServerCart } from "./api/client";
import CategoryTabs from "./components/CategoryTabs";
import ProductCard from "./components/ProductCard";
import Hero from "./components/Hero";
import CartDrawer from "./components/CartDrawer";
import CheckoutModal from "./components/CheckoutModal";
import Toast from "./components/Toast";
import { initTelegramApp, getTelegramUser } from "./lib/telegram";
import type { Product } from "./types";
import { useCartStore } from "./store/cart";

function FooterInfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        border: "1px solid #26262b",
        borderRadius: 16,
        background: "#111318",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: "100%",
          background: "transparent",
          color: "#fff",
          border: "none",
          padding: "14px 16px",
          textAlign: "left",
          fontWeight: 700,
          fontSize: 15,
          cursor: "pointer",
        }}
      >
        {title}
      </button>

      {open && (
        <div
          style={{
            padding: "0 16px 16px 16px",
            color: "#cbd5e1",
            fontSize: 13,
            lineHeight: 1.55,
            whiteSpace: "pre-wrap",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const replaceItemsFromServer = useCartStore((state) => state.replaceItemsFromServer);
  const setCheckoutFields = useCartStore((state) => state.setCheckoutFields);
  const setShopStatus = useCartStore((state) => state.setShopStatus);
  const setCartStatus = useCartStore((state) => state.setCartStatus);
  const setInitialized = useCartStore((state) => state.setInitialized);

  const items = useCartStore((state) => state.items);
  const checkout = useCartStore((state) => state.checkout);
  const initialized = useCartStore((state) => state.initialized);
  const canEdit = useCartStore((state) => state.canEdit());

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    initTelegramApp();
  }, []);

  useEffect(() => {
    const tgUser = getTelegramUser();
    if (tgUser.telegramUsername) {
      setCheckoutFields({ telegramUsername: tgUser.telegramUsername });
    }
    if (tgUser.firstName) {
      const fullName = [tgUser.firstName, tgUser.lastName].filter(Boolean).join(" ");
      setCheckoutFields({ customerName: fullName });
    }
  }, [setCheckoutFields]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

      const [productsRes, categoriesRes, shopStatusRes, cartRes] = await Promise.all([
        api.get<Product[]>("/products"),
        api.get<string[]>("/products/categories"),
        getShopStatus(),
        getServerCart(),
      ]);

      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setShopStatus(shopStatusRes.status);

      if (cartRes) {
        setCartStatus((cartRes.status as "draft" | "submitted") || "draft");

        replaceItemsFromServer(cartRes.items || [], productsRes.data);

        setCheckoutFields({
          customerName: cartRes.customer_name || "",
          phone: cartRes.phone || "",
          city: cartRes.city || "",
          deliveryPoint: cartRes.delivery_point || "",
          deliveryDate: cartRes.delivery_date || "",
          comment: cartRes.comment || "",
        });
      } else {
        setCartStatus("draft");
        replaceItemsFromServer([], productsRes.data);
      }

        setInitialized(true);
      } catch (err) {
        console.error(err);
        setError("Не удалось загрузить каталог");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    replaceItemsFromServer,
    setCheckoutFields,
    setShopStatus,
    setCartStatus,
    setInitialized,
  ]);

  useEffect(() => {
    if (!initialized) return;
    if (!canEdit) return;

    const timeout = setTimeout(async () => {
      try {
        await saveServerCart({
          customer_name: checkout.customerName,
          phone: checkout.phone,
          city: checkout.city,
          delivery_point: checkout.deliveryPoint,
          delivery_date: checkout.deliveryDate,
          comment: checkout.comment,
          items: items.map((item) => ({
            sku: item.sku,
            qty: item.qty,
          })),
        });
      } catch (err) {
        console.error(err);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [items, checkout, initialized, canEdit]);

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter((product) => product.category === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <div className="container" style={{ paddingBottom: 120, minHeight: "100vh", background: `
      radial-gradient(circle at top left, rgba(37, 190, 176, 0.22), transparent 28%),
      radial-gradient(circle at top right, rgba(23, 120, 140, 0.20), transparent 24%),
      linear-gradient(180deg, #081018 0%, #0b1720 35%, #0d1b24 65%, #081018 100%)
    `, }}>
      <Hero />

      <p style={{ color: "#9ca3af", marginBottom: 20, fontSize: 16 }}>
        Выберите товары и добавьте их в корзину
      </p>

      {loading && <div>Загрузка каталога...</div>}
      {error && <div style={{ color: "crimson" }}>{error}</div>}

      {!loading && !error && (
        <>
          <CategoryTabs
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            {filteredProducts.map((product) => (
              <ProductCard key={product.sku} product={product} />
            ))}
          </div>

          <div style={{ marginTop: 28, display: "grid", gap: 12 }}>
            <FooterInfoCard title="Impressum">
              Anbieter dieses Angebots ist der jeweilige Verkäufer/Shop-Betreiber.
              {"\n\n"}
              Bitte hier eintragen:
              {"\n"}- Name / Firmenname
              {"\n"}- Anschrift
              {"\n"}- Kontakt-E-Mail
              {"\n"}- Telefonnummer
              {"\n"}- ggf. USt-ID oder weitere Pflichtangaben
            </FooterInfoCard>

            <FooterInfoCard title="Datenschutz">
              Bei der Nutzung dieses Shops können personenbezogene Daten verarbeitet werden,
              insbesondere Name, Telefonnummer, Telegram-Benutzername, Stadt, Abholpunkt
              und Bestellinformationen.
              {"\n\n"}
              Die Daten werden verwendet, um Bestellungen zu bearbeiten, die Abholung zu
              organisieren und Kunden bei Rückfragen zu kontaktieren.
              {"\n\n"}
              Bitte hier noch mit echten Angaben des Betreibers ergänzen:
              {"\n"}- Verantwortlicher
              {"\n"}- Kontakt
              {"\n"}- Speicherfrist
              {"\n"}- Rechte der betroffenen Personen
              {"\n"}- ggf. Hosting / technische Dienstleister
            </FooterInfoCard>
          </div>

          <CartDrawer onCheckout={() => setCheckoutOpen(true)} />

          <CheckoutModal
            open={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            onSuccess={() =>
              showToast(
                "Ваш заказ сохранён. Вы можете изменить его до конца приёма.",
                "success"
              )
            }
            onError={() => showToast("Не удалось сохранить заказ", "error")}
          />
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}