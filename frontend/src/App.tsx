import { useEffect, useMemo, useState, useRef } from "react";
import { api, getServerCart, getShopStatus, getStoreSettings ,saveServerCart } from "./api/client";
import CategoryTabs from "./components/CategoryTabs";
import ProductCard from "./components/ProductCard";
import Hero from "./components/Hero";
import CartDrawer from "./components/CartDrawer";
import CheckoutModal from "./components/CheckoutModal";
import Toast from "./components/Toast";
import { initTelegramApp } from "./lib/telegram";
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

  const categoriesRef = useRef<HTMLDivElement | null>(null);
  const productsRef = useRef<HTMLDivElement | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [storeSettings, setStoreSettings] = useState({
  shop_name: "БАВАРИЯ 🐟 РЫБА 2",
  shop_cover_image: "",
});

  const replaceItemsFromServer = useCartStore((state) => state.replaceItemsFromServer);
  const setCheckoutFields = useCartStore((state) => state.setCheckoutFields);
  const setShopStatus = useCartStore((state) => state.setShopStatus);
  const setCartStatus = useCartStore((state) => state.setCartStatus);
  const setInitialized = useCartStore((state) => state.setInitialized);

  const items = useCartStore((state) => state.items);
  const checkout = useCartStore((state) => state.checkout);
  const initialized = useCartStore((state) => state.initialized);
  const canEdit = useCartStore((state) => state.canEdit());

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

  const buildImageUrl = (value?: string) => {
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    return `${API_BASE_URL}${value}`;
  };

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
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [productsRes, categoriesRes, shopStatusRes, settingsRes] = await Promise.all([
          api.get<Product[]>("/products"),
          api.get<string[]>("/products/categories"),
          getShopStatus(),
          getStoreSettings(),
        ]);

        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
        setShopStatus(shopStatusRes.status);
        setStoreSettings(settingsRes);

        try {
          const cartRes = await getServerCart();

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
        } catch (cartErr) {
          console.error("Failed to load cart", cartErr);
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

    if (!checkout.customerName.trim()) return;
    if (!checkout.city.trim()) return;
    if (!checkout.deliveryPoint.trim()) return;
    if (!checkout.deliveryDate.trim()) return;
    if (items.length === 0) return;

    const timeout = setTimeout(async () => {
      try {
        const cartResponse = await saveServerCart({
          customer_name: checkout.customerName,
          phone: checkout.phone,
          city: checkout.city,
          delivery_point: checkout.deliveryPoint,
          delivery_date: checkout.deliveryDate,
          approx_time: null,
          comment: checkout.comment,
          items: items.map((item) => ({
            sku: item.sku,
            qty: item.qty,
          })),
        });

        if (cartResponse?.status) {
          setCartStatus(cartResponse.status as "draft" | "submitted");
        }
      } catch (err) {
        console.error(err);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [items, checkout, initialized, canEdit, setCartStatus]);

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter((product) => product.category === selectedCategory);
  }, [products, selectedCategory]);

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);

    requestAnimationFrame(() => {
      productsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="container" style={{ paddingBottom: 120, minHeight: "100vh", background: `
      radial-gradient(circle at top left, rgba(37, 190, 176, 0.22), transparent 28%),
      radial-gradient(circle at top right, rgba(23, 120, 140, 0.20), transparent 24%),
      linear-gradient(180deg, #081018 0%, #0b1720 35%, #0d1b24 65%, #081018 100%)
    `, }}>
      <Hero 
        title={storeSettings.shop_name || "БАВАРИЯ 🐟 РЫБА 2"}
        coverImage={buildImageUrl(storeSettings.shop_cover_image)}
      />

      <p style={{ color: "#9ca3af", marginBottom: 20, fontSize: 16 }}>
        Выберите товары и добавьте их в корзину
      </p>

      {loading && <div>Загрузка каталога...</div>}
      {error && <div style={{ color: "crimson" }}>{error}</div>}

      {!loading && !error && (
        <>
        <div ref={categoriesRef}>
          <CategoryTabs
            categories={categories}
            selected={selectedCategory}
            onSelect={handleCategorySelect}
          />
          </div>

          <div
            ref={productsRef}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
              scrollMarginTop: 20,
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
              {"\n"}- Name / Firmenname : Frischer Fish & Feinkost RIHOFF
              {"\n"}- Anschrift
              {"\n"}- Kontakt-E-Mail : info@rihoff-frischer-fisch.de
              {"\n"}- Telefonnummer : +49 176 243 40500
              {"\n"}- USt-ID : DE 304755977
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

      {showScrollTop && (
        <button
          onClick={() =>
            categoriesRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
          style={{
            position: "fixed",
            right: 18,
            bottom: 110,
            width: 52,
            height: 52,
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(10, 19, 27, 0.94)",
            color: "#fff",
            fontSize: 22,
            fontWeight: 700,
            boxShadow: "0 10px 24px rgba(0,0,0,0.32)",
            backdropFilter: "blur(10px)",
            zIndex: 60,
            cursor: "pointer",
          }}
          aria-label="Наверх к категориям"
        >
          ↑
        </button>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}