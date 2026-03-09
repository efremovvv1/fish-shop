import { useEffect, useMemo, useState } from "react";
import { api } from "./api/client";
import CategoryTabs from "./components/CategoryTabs";
import ProductCard from "./components/ProductCard";
import Hero from "./components/Hero";
import CartDrawer from "./components/CartDrawer";
import CheckoutModal from "./components/CheckoutModal";
import Toast from "./components/Toast";
import { initTelegramApp } from "./lib/telegram";
import type { Product } from "./types";

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

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

        const [productsRes, categoriesRes] = await Promise.all([
          api.get<Product[]>("/products"),
          api.get<string[]>("/products/categories"),
        ]);

        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
      } catch (err) {
        console.error(err);
        setError("Не удалось загрузить каталог");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter((product) => product.category === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <div className="container" style={{ paddingBottom: 100 }}>
      <Hero />

      <p style={{ color: "#9ca3af", marginBottom: 20 }}>
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
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {filteredProducts.map((product) => (
              <ProductCard key={product.sku} product={product} />
            ))}
          </div>

          <CartDrawer
            onCheckout={() => setCheckoutOpen(true)}
            onExpired={() =>
              showToast("Время корзины истекло. Соберите заказ заново.", "error")
            }
          />

          <CheckoutModal
            open={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            onSuccess={(orderId) =>
              showToast(`Заказ №${orderId} успешно оформлен`, "success")
            }
            onError={() => showToast("Не удалось оформить заказ", "error")}
          />
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}