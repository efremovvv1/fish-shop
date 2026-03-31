import { useEffect, useMemo, useState, useCallback } from "react";
import {
  clearAdminToken,
  downloadOrdersExcel,
  getAdminCarts,
  getAdminDeliveryPoints,
  getAdminProducts,
  getAdminProductTotals,
  getAdminShopStatus,
  toggleAdminDeliveryPoint,
  toggleAdminProduct,
  updateAdminShopStatus,
  createAdminProduct,
  createAdminDeliveryPoint,
  updateAdminProduct,
  deleteAdminProduct,
  updateAdminDeliveryPoint,
  deleteAdminDeliveryPoint,
  uploadAdminProductImage,
  clearAdminCarts,
  downloadClientFormatExcel,
  getAdminShopSettings,
  updateAdminStoreSettings,
  deleteAdminCart,
  api,
  API_BASE_URL,
} from "../api/client";
import type {
  AdminCart,
  AdminDeliveryPoint,
  AdminProduct,
  AdminProductTotal,
  ShopStatus,
} from "../types";

import axios from "axios"


type TabKey = "orders" | "products" | "delivery";

export default function DashboardPage() {
  const [shopStatus, setShopStatus] = useState<ShopStatus>("closed");
  const [carts, setCarts] = useState<AdminCart[]>([]);
  const [productTotals, setProductTotals] = useState<AdminProductTotal[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [deliveryPoints, setDeliveryPoints] = useState<AdminDeliveryPoint[]>([]);

  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCart, setSelectedCart] = useState<AdminCart | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("orders");
  const [clearLoading, setClearLoading] = useState(false);

  const [storeSettings, setStoreSettings] = useState({
  shop_name: "",
  shop_cover_image: "",
  });

  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [editProductForm, setEditProductForm] = useState({
    sku: "",
    name: "",
    category: "",
    price: "",
    currency: "EUR",
    unit: "",
    pack_size: "",
    min_qty: "1",
    step: "1",
    available_qty: "0",
    notes: "",
    image_url: "",
    short_description: "",
    description: "",
    active: true,
  });

  const [editingPoint, setEditingPoint] = useState<AdminDeliveryPoint | null>(null);
  const [editPointForm, setEditPointForm] = useState({
    city: "",
    place: "",
    active: true,
    notes: "",
    delivery_date: "",
    approx_time: "",
  });

  const [productForm, setProductForm] = useState({
    sku: "",
    name: "",
    category: "",
    price: "",
    currency: "EUR",
    unit: "",
    pack_size: "",
    min_qty: "1",
    step: "1",
    available_qty: "0",
    notes: "",
    image_url: "",
    short_description: "",
    description: "",
    active: true,
  });

  const [pointForm, setPointForm] = useState({
    city: "",
    place: "",
    active: true,
    notes: "",
    delivery_date: "",
    approx_time: "",
  });

const loadData = useCallback(async () => {
  setLoading(true);
  setError("");

  try {
    const [statusRes, settingsRes, cartsRes, totalsRes, productsRes, pointsRes] =
      await Promise.all([
        getAdminShopStatus(),
        getAdminShopSettings(),
        getAdminCarts(selectedDeliveryDate || undefined),
        getAdminProductTotals(),
        getAdminProducts(),
        getAdminDeliveryPoints(),
      ]);

    setShopStatus(statusRes.status);
    setStoreSettings(settingsRes);
    setCarts(cartsRes);
    setProductTotals(totalsRes);
    setProducts(productsRes);
    setDeliveryPoints(pointsRes);
  } catch (err) {
    console.error(err);
    setError("Не удалось загрузить данные админки");
  } finally {
    setLoading(false);
  }
}, [selectedDeliveryDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (nextStatus: ShopStatus) => {
    setStatusLoading(true);
    try {
      const res = await updateAdminShopStatus(nextStatus);
      setShopStatus(res.status);
    } catch (err) {
      console.error(err);
      alert("Не удалось изменить статус магазина");
    } finally {
      setStatusLoading(false);
    }
  };

  const cityOptions = useMemo(() => {
    const cities = Array.from(
      new Set(carts.map((cart) => cart.city).filter(Boolean))
    ) as string[];

    return cities.sort((a, b) => a.localeCompare(b));
  }, [carts]);

  const filteredCarts = useMemo(() => {
    const q = search.trim().toLowerCase();
    
    return carts.filter((cart) => {
      const matchesDate = !selectedDeliveryDate || cart.delivery_date?.startsWith(selectedDeliveryDate);
      const matchesCity = !selectedCity || cart.city === selectedCity;

      const matchesSearch =
        !q ||
        [
          cart.customer_name,
          cart.phone,
          cart.city,
          cart.delivery_point,
          cart.telegram_username,
          cart.telegram_user_id,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));

      return matchesCity && matchesSearch && matchesDate;
    });
  }, [carts, search, selectedCity, selectedDeliveryDate ]);

  const stats = useMemo(() => {
    const totalClients = carts.length;
    const totalItems = carts.reduce((sum, cart) => sum + cart.items.length, 0);
    return { totalClients, totalItems };
  }, [carts]);

  const showCopyMessage = (message: string) => {
    setCopyMessage(message);
    window.setTimeout(() => setCopyMessage(""), 2000);
  };

  const copyText = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showCopyMessage(successMessage);
    } catch (err) {
      console.error(err);
      alert("Не удалось скопировать текст");
    }
  };

  const buildImageUrl = (value?: string) => {
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    return `${API_BASE_URL}${value}`;
  };

  const safeTrim = (value: unknown) =>
    typeof value === "string" ? value.trim() : "";

  const buildOrderRowText = (cart: AdminCart) => {
    const itemsText =
      cart.items.length === 0
        ? "—"
        : cart.items
            .map(
              (item) =>
                `${item.product_name} (${item.sku}) x ${item.qty} ${item.unit}`.trim()
            )
            .join("; ");

    return [
      cart.customer_name || "—",
      cart.phone || "—",
      cart.telegram_username || cart.telegram_user_id || "—",
      cart.city || "—",
      cart.delivery_point || "—",
      itemsText,
      cart.comment || "—",
    ].join("\t");
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createAdminProduct({
        sku: productForm.sku.trim(),
        name: productForm.name.trim(),
        category: productForm.category.trim(),
        price: Number(productForm.price),
        currency: productForm.currency.trim() || "EUR",
        unit: productForm.unit.trim(),
        pack_size: productForm.pack_size ? Number(productForm.pack_size) : null,
        min_qty: Number(productForm.min_qty),
        step: Number(productForm.step),
        available_qty: Number(productForm.available_qty),
        notes: productForm.notes.trim(),
        image_url: safeTrim(productForm.image_url),
        short_description: productForm.short_description.trim(),
        description: productForm.description.trim(),
        active: productForm.active,
      });

      setProductForm({
        sku: "",
        name: "",
        category: "",
        price: "",
        currency: "EUR",
        unit: "",
        pack_size: "",
        min_qty: "1",
        step: "1",
        available_qty: "0",
        notes: "",
        image_url: "",
        short_description: "",
        description: "",
        active: true,
      });

      await loadData();
      showCopyMessage("Товар добавлен");
    } catch (err) {
      console.error(err);
      alert("Не удалось добавить товар");
    }
  };

  const openEditProduct = (product: AdminProduct) => {
    setEditingProduct(product);
    setEditProductForm({
      sku: product.sku,
      name: product.name,
      category: product.category,
      price: String(product.price),
      currency: product.currency,
      unit: product.unit,
      pack_size: product.pack_size != null ? String(product.pack_size) : "",
      min_qty: String(product.min_qty),
      step: String(product.step),
      available_qty: String(product.available_qty),
      notes: product.notes || "",
      image_url: product.image_url || "",
      short_description: product.short_description || "",
      description: product.description || "",
      active: product.active,
    });
  };

    const handleCreatePoint = async (e: React.FormEvent) => {
        e.preventDefault();

        const city = pointForm.city.trim();
        const place = pointForm.place.trim();
        const notes = pointForm.notes.trim();

        if (!city || !place || !pointForm.delivery_date) {
            alert("Заполните город, точку выдачи и дату выдачи");
            return;
        }

        try {
            await createAdminDeliveryPoint({
            city,
            place,
            active: pointForm.active,
            notes,
            delivery_date: pointForm.delivery_date,
            approx_time: pointForm.approx_time.trim() || undefined,
            });

            setPointForm({
            city: "",
            place: "",
            active: true,
            notes: "",
            delivery_date: "",
            approx_time: "",
            });

            await loadData();
            showCopyMessage("Точка выдачи добавлена");
        } catch (err: unknown) {
            console.error(err);

            if (axios.isAxiosError(err)){
              alert( err?.response?.data?.detail ||"Не удалось добавить точку выдачи");
            } else {
              alert("Не удалось добавить точку выдачи")
            }
            
        }
        };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProduct) return;

    try {
      await updateAdminProduct(editingProduct.id, {
        sku: editProductForm.sku.trim(),
        name: editProductForm.name.trim(),
        category: editProductForm.category.trim(),
        price: Number(editProductForm.price),
        currency: editProductForm.currency.trim() || "EUR",
        unit: editProductForm.unit.trim(),
        pack_size: editProductForm.pack_size ? Number(editProductForm.pack_size) : null,
        min_qty: Number(editProductForm.min_qty),
        step: Number(editProductForm.step),
        available_qty: Number(editProductForm.available_qty),
        notes: editProductForm.notes.trim(),
        image_url: editProductForm.image_url.trim(),
        short_description: editProductForm.short_description.trim(),
        description: editProductForm.description.trim(),
        active: editProductForm.active,
      });

      setEditingProduct(null);
      await loadData();
      showCopyMessage("Товар обновлён");
    } catch (err) {
      console.error(err);
      alert("Не удалось обновить товар");
    }
  };

const openEditPoint = (point: AdminDeliveryPoint) => {
  setEditingPoint(point);
  setEditPointForm({
    city: point.city,
    place: point.place,
    active: point.active,
    notes: point.notes || "",
    delivery_date: point.delivery_date || "",
    approx_time: point.approx_time || "",
  });
};

  const handleUpdatePoint = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingPoint) return;

    const city = editPointForm.city.trim();
    const place = editPointForm.place.trim();
    const notes = editPointForm.notes.trim();

    if (!city || !place || !editPointForm.delivery_date) {
        alert("Заполните город, точку выдачи и дату выдачи");
        return;
    }

    try {
        await updateAdminDeliveryPoint(editingPoint.id, {
        city,
        place,
        active: editPointForm.active,
        notes,
        delivery_date: editPointForm.delivery_date,
        approx_time: editPointForm.approx_time.trim() || undefined,
        });

        setEditingPoint(null);
        await loadData();
        showCopyMessage("Точка выдачи обновлена");
    } catch (err: unknown) {
        console.error(err);

        if(axios.isAxiosError(err)){
          alert(err?.response?.data?.detail || "Не удалось обновить точку выдачи");
        } else{
          alert("Не удалось обновить точку выдачи")
        }
        
    }
    };

    const handleUploadNewProductImage = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
        const res = await uploadAdminProductImage(file);
        setProductForm((prev) => ({
            ...prev,
            image_url: res.image_url,
        }));
        showCopyMessage("Фото загружено");
        } catch (err) {
        console.error(err);
        alert("Не удалось загрузить фото");
        }
    };

  const handleUploadEditProductImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadAdminProductImage(file);
      setEditProductForm((prev) => ({
        ...prev,
        image_url: res.image_url,
      }));
      showCopyMessage("Фото загружено");
    } catch (err) {
      console.error(err);
      alert("Не удалось загрузить фото");
    }
  };

  const handleClearCarts = async () => {
    const confirmed = window.confirm(
      "Вы уверены, что хотите удалить все текущие корзины?\n\nПеред этим обязательно сделайте экспорт в Excel.\n\nЭто действие очистит текущий цикл заказов и переведёт магазин в статус closed."
    );

    if (!confirmed) return;

    try {
      setClearLoading(true);

      const res = await clearAdminCarts();
      await loadData();

      setShopStatus(res.shop_status);
      showCopyMessage(`Корзины очищены: ${res.cleared_carts}`);
    } catch (err) {
      console.error(err);
      alert("Не удалось очистить корзины");
    } finally {
      setClearLoading(false);
    }
  };

  return (
    <div className="page">
      {copyMessage && <div className="copy-toast">{copyMessage}</div>}

      <div className="topbar">
        <div>
          <h1>Панель управления</h1>
          <p className="muted">Управление магазином и заказами клиентов</p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => {
            clearAdminToken();
            window.location.href = "/login";
          }}
        >
          Выйти
        </button>
      </div>

      {error && <div className="card error-box">{error}</div>}

      <div className="stats-grid">
        <div className="card">
          <div className="muted">Статус магазина</div>
          <div className="big-text">{shopStatus}</div>
        </div>

        <div className="card">
          <div className="muted">Активных корзин</div>
          <div className="big-text">{stats.totalClients}</div>
        </div>

        <div className="card">
          <div className="muted">Позиции в корзинах</div>
          <div className="big-text">{stats.totalItems}</div>
        </div>
      </div>

            <div className="card">
        <div className="section-head">
          <h2>Управление магазином</h2>

          <div className="actions-row">
            <button className="btn btn-primary" onClick={downloadOrdersExcel}>
              Экспорт в Excel
            </button>
            <button className="btn btn-secondary" onClick={downloadClientFormatExcel}>
             Экспорт клиента
            </button>

            <button
              className="btn btn-danger"
              onClick={handleClearCarts}
              disabled={clearLoading}
            >
              {clearLoading ? "Очистка..." : "Очистить корзины"}
            </button>

             <form
            className="form-grid"
            onSubmit={async (e) => {
              e.preventDefault();

              try {
                await updateAdminStoreSettings(storeSettings);
                showCopyMessage("Настройки магазина обновлены");
              } catch (err: unknown) {
                console.error(err);

                if (axios.isAxiosError(err)) {
                  alert(err.response?.data?.detail || "Не удалось обновить настройки магазина");
                } else {
                  alert("Не удалось обновить настройки магазина");
                }
              }
            }}
          >
            <input
              className="input form-span"
              placeholder="Название магазина"
              value={storeSettings.shop_name}
              onChange={(e) =>
                setStoreSettings((prev) => ({ ...prev, shop_name: e.target.value }))
              }
            />

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                try {
                  const formData = new FormData();
                  formData.append("file", file);

                  const token = localStorage.getItem("admin_token");

                  const res = await api.post("/admin/upload/store-cover", formData, {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "multipart/form-data",
                    },
                  });

                  setStoreSettings((prev) => ({
                    ...prev,
                    shop_cover_image: res.data.image_url,
                  }));
                } catch (err) {
                  console.error(err);
                  alert("Не удалось загрузить обложку");
                }
              }}
            />

            {storeSettings.shop_cover_image && (
              <div className="form-span image-preview-wrap">
                <img
                  src={buildImageUrl(storeSettings.shop_cover_image)}
                  alt="Cover preview"
                  className="image-preview"
                />
              </div>
            )}

            <button className="btn btn-primary form-span" type="submit">
              Сохранить настройки
            </button>
          </form>
          </div>
        </div>

        <div className="status-buttons">
          <button
            className={`btn ${shopStatus === "open" ? "btn-primary" : "btn-secondary"}`}
            disabled={statusLoading}
            onClick={() => handleStatusChange("open")}
          >
            Открыт
          </button>

          <button
            className={`btn ${shopStatus === "locked" ? "btn-primary" : "btn-secondary"}`}
            disabled={statusLoading}
            onClick={() => handleStatusChange("locked")}
          >
            Приём завершён
          </button>

          <button
            className={`btn ${shopStatus === "closed" ? "btn-primary" : "btn-secondary"}`}
            disabled={statusLoading}
            onClick={() => handleStatusChange("closed")}
          >
            Закрыт
          </button>
        </div>
      </div>

      <div className="tabs-row">
        <button
          className={`btn ${activeTab === "orders" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("orders")}
        >
          Заказы
        </button>
        <button
          className={`btn ${activeTab === "products" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("products")}
        >
          Товары
        </button>
        <button
          className={`btn ${activeTab === "delivery" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("delivery")}
        >
          Точки выдачи
        </button>
      </div>

      {activeTab === "orders" && (
        <>
          <div className="card">
            <h2>Сводка по товарам</h2>

            {productTotals.length === 0 ? (
              <div className="muted">Пока нет данных по товарам</div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Товар</th>
                      <th>SKU</th>
                      <th>Количество</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productTotals.map((item) => (
                      <tr key={item.sku}>
                        <td>{item.product_name}</td>
                        <td>{item.sku}</td>
                        <td>
                          {item.total_qty} {item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <div className="section-head">
              <h2>Корзины клиентов</h2>

              <div className="filters-row">
                <select
                  className="input city-select"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                >
                  <option value="">Все города</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>

               <input
                className="input"
                type="date"
                value={selectedDeliveryDate}
                onChange={(e) => setSelectedDeliveryDate(e.target.value)}
                />

                <input
                  className="input search-input"
                  placeholder="Поиск по имени, телефону, городу, Telegram..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="muted">Загрузка...</div>
            ) : filteredCarts.length === 0 ? (
              <div className="muted">Корзины пока отсутствуют</div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>№</th>
                      <th>Имя</th>
                      <th>Телефон</th>
                      <th>Telegram</th>
                      <th>Город</th>
                      <th>Точка выдачи</th>
                      <th>Дата выдачи</th>
                      <th>Позиций</th>
                      <th>Обновлено</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCarts.map((cart) => (
                      <tr key={cart.cart_id}>
                        <td>{cart.cart_id}</td>
                        <td>{cart.pickup_number ?? "—"}</td>
                        <td>{cart.customer_name || "—"}</td>
                        <td>{cart.phone || "—"}</td>
                        <td>{cart.telegram_username || cart.telegram_user_id}</td>
                        <td>{cart.city || "—"}</td>
                        <td>{cart.delivery_point || "—"}</td>
                        <td>{cart.delivery_date || "—"}</td>
                        <td>{cart.items.length}</td>
                        <td>{formatDate(cart.updated_at)}</td>
                        <td>
                          <div className="actions-row">
                            <button
                              className="btn btn-secondary btn-small"
                              onClick={() =>
                                copyText(cart.phone || "", "Телефон скопирован")
                              }
                              disabled={!cart.phone}
                            >
                              Телефон
                            </button>

                            <button
                              className="btn btn-secondary btn-small"
                              onClick={() =>
                                copyText(buildOrderRowText(cart), "Строка заказа скопирована")
                              }
                            >
                              Строка
                            </button>

                            <button
                              className="btn btn-secondary btn-small"
                              onClick={() => setSelectedCart(cart)}
                            >
                              Подробнее
                            </button>

                            <button
                              className="btn btn-danger"
                              onClick={async () => {
                                const reason = window.prompt("Укажи причину удаления корзины");
                                if (!reason) return;

                                try {
                                  await deleteAdminCart(cart.cart_id, reason);
                                  await loadData();
                                  showCopyMessage("Корзина удалена");
                                } catch (err: unknown) {
                                  console.error(err);

                                  if (axios.isAxiosError(err)) {
                                    alert(err.response?.data?.detail || "Не удалось удалить корзину");
                                  } else {
                                    alert("Не удалось удалить корзину");
                                  }
                                }
                              }}
                            >
                              Удалить
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "products" && (
        <>
          <div className="card">
            <h2>Добавить товар</h2>

            <form className="form-grid" onSubmit={handleCreateProduct}>
              <input
                className="input"
                placeholder="SKU"
                value={productForm.sku}
                onChange={(e) => setProductForm((prev) => ({ ...prev, sku: e.target.value }))}
                required
              />
              <input
                className="input"
                placeholder="Название"
                value={productForm.name}
                onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
              <input
                className="input"
                placeholder="Категория"
                value={productForm.category}
                onChange={(e) =>
                  setProductForm((prev) => ({ ...prev, category: e.target.value }))
                }
                required
              />
              <input
                className="input"
                placeholder="Цена"
                type="number"
                step="0.01"
                value={productForm.price}
                onChange={(e) => setProductForm((prev) => ({ ...prev, price: e.target.value }))}
                required
              />
              <input
                className="input"
                placeholder="Валюта"
                value={productForm.currency}
                onChange={(e) =>
                  setProductForm((prev) => ({ ...prev, currency: e.target.value }))
                }
                required
              />
              <input
                className="input"
                placeholder="Ед. измерения"
                value={productForm.unit}
                onChange={(e) => setProductForm((prev) => ({ ...prev, unit: e.target.value }))}
                required
              />
              <input
                className="input"
                placeholder="Размер упаковки"
                type="number"
                step="0.01"
                value={productForm.pack_size}
                onChange={(e) =>
                  setProductForm((prev) => ({ ...prev, pack_size: e.target.value }))
                }
              />
              <input
                className="input"
                placeholder="Минимальное количество"
                type="number"
                step="0.01"
                value={productForm.min_qty}
                onChange={(e) =>
                  setProductForm((prev) => ({ ...prev, min_qty: e.target.value }))
                }
                required
              />
              <input
                className="input"
                placeholder="Шаг"
                type="number"
                step="0.01"
                value={productForm.step}
                onChange={(e) => setProductForm((prev) => ({ ...prev, step: e.target.value }))}
                required
              />
              <input
                className="input"
                placeholder="Доступное количество"
                type="number"
                step="0.01"
                value={productForm.available_qty}
                onChange={(e) =>
                  setProductForm((prev) => ({ ...prev, available_qty: e.target.value }))
                }
                required
              />
              <input
                className="input form-span"
                placeholder="Комментарий"
                value={productForm.notes}
                onChange={(e) => setProductForm((prev) => ({ ...prev, notes: e.target.value }))}
              />

               <input
                    className="input form-span"
                    placeholder="Ссылка на фото (image URL)"
                    value={productForm.image_url}
                    onChange={(e) =>
                        setProductForm((prev) => ({ ...prev, image_url: e.target.value }))
                    }
                    />

                    <input
                    className="input form-span"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleUploadNewProductImage}
                    />
                    {productForm.image_url && (
                        <div className="form-span image-preview-wrap">
                            <img src={productForm.image_url} alt="Preview" className="image-preview" />
                        </div>
                        )}

              <input
                className="input form-span"
                placeholder="Короткое описание"
                value={productForm.short_description}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    short_description: e.target.value,
                  }))
                }
              />

              <textarea
                className="input form-span"
                placeholder="Полное описание"
                value={productForm.description}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={4}
              />

              <label className="checkbox-row form-span">
                <input
                  type="checkbox"
                  checked={productForm.active}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, active: e.target.checked }))
                  }
                />
                Активен
              </label>

              <button className="btn btn-primary form-span" type="submit">
                Добавить товар
              </button>
            </form>
          </div>

          <div className="card">
            <h2>Ассортимент</h2>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Название</th>
                    <th>Категория</th>
                    <th>Цена</th>
                    <th>Ед.</th>
                    <th>Активен</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.sku}</td>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>
                        {product.price} {product.currency}
                      </td>
                      <td>{product.unit}</td>
                      <td>{product.active ? "Да" : "Нет"}</td>
                      <td>
                        <div className="actions-row">
                          <button
                            className="btn btn-secondary btn-small"
                            onClick={() => openEditProduct(product)}
                          >
                            Редактировать
                          </button>

                          <button
                            className="btn btn-secondary btn-small"
                            onClick={async () => {
                              try {
                                await toggleAdminProduct(product.id);
                                await loadData();
                              } catch (err) {
                                console.error(err);
                                alert("Не удалось изменить статус товара");
                              }
                            }}
                          >
                            {product.active ? "Отключить" : "Включить"}
                          </button>

                          <button
                            className="btn btn-danger btn-small"
                            onClick={async () => {
                              const ok = window.confirm(`Удалить товар "${product.name}"?`);
                              if (!ok) return;

                              try {
                                await deleteAdminProduct(product.id);
                                await loadData();
                                showCopyMessage("Товар удалён");
                              } catch (err) {
                                console.error(err);
                                alert("Не удалось удалить товар");
                              }
                            }}
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "delivery" && (
        <>
          <div className="card">
            <h2>Добавить точку выдачи</h2>

            <form className="form-grid" onSubmit={handleCreatePoint}>
            <input
                className="input"
                placeholder="Город"
                value={pointForm.city}
                onChange={(e) => setPointForm((prev) => ({ ...prev, city: e.target.value }))}
                required
            />

            <input
                className="input"
                placeholder="Точка выдачи"
                value={pointForm.place}
                onChange={(e) => setPointForm((prev) => ({ ...prev, place: e.target.value }))}
                required
            />

            <input
                className="input form-span"
                placeholder="Комментарий"
                value={pointForm.notes}
                onChange={(e) => setPointForm((prev) => ({ ...prev, notes: e.target.value }))}
            />

            <input
                className="input"
                type="date"
                value={pointForm.delivery_date}
                onChange={(e) =>
                    setPointForm((prev) => ({ ...prev, delivery_date: e.target.value }))
                }
                required
                />

                <input
                className="input"
                placeholder="Примерное время, например 08:30"
                value={pointForm.approx_time}
                onChange={(e) =>
                    setPointForm((prev) => ({ ...prev, approx_time: e.target.value }))
                }
                />


            <label className="checkbox-row form-span">
                <input
                type="checkbox"
                checked={pointForm.active}
                onChange={(e) =>
                    setPointForm((prev) => ({ ...prev, active: e.target.checked }))
                }
                />
                Активна
            </label>

            <button className="btn btn-primary form-span" type="submit">
                Добавить точку выдачи
            </button>
            </form>
          </div>

          <div className="card">
            <h2>Точки выдачи</h2>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Город</th>
                    <th>Точка</th>
                    <th>Активна</th>
                    <th>Дата выдачи</th>
                    <th>Время</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryPoints.map((point) => (
                    <tr key={point.id}>
                      <td>{point.id}</td>
                      <td>{point.city}</td>
                      <td>{point.place}</td>
                      <td>{point.active ? "Да" : "Нет"}</td>
                      <td>{point.delivery_date || "—"}</td>
                      <td>{point.approx_time || "—"}</td>
                      <td>
                        <div className="actions-row">
                          <button
                            className="btn btn-secondary btn-small"
                            onClick={() => openEditPoint(point)}
                          >
                            Редактировать
                          </button>


                          <button
                            className="btn btn-secondary btn-small"
                            onClick={async () => {
                              try {
                                await toggleAdminDeliveryPoint(point.id);
                                await loadData();
                              } catch (err) {
                                console.error(err);
                                alert("Не удалось изменить статус точки выдачи");
                              }
                            }}
                          >
                            {point.active ? "Отключить" : "Включить"}
                          </button>

                          <button
                            className="btn btn-danger btn-small"
                            onClick={async () => {
                              const ok = window.confirm(
                                `Удалить точку "${point.place}" в городе "${point.city}"?`
                              );
                              if (!ok) return;

                              try {
                                await deleteAdminDeliveryPoint(point.id);
                                await loadData();
                                showCopyMessage("Точка выдачи удалена");
                              } catch (err) {
                                console.error(err);
                                alert("Не удалось удалить точку выдачи");
                              }
                            }}
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

        {editingPoint && (
        <div className="modal-overlay" onClick={() => setEditingPoint(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Редактировать точку выдачи</h2>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setEditingPoint(null)}
              >
                Закрыть
              </button>
            </div>

            <form className="form-grid" onSubmit={handleUpdatePoint}>
              <input
                className="input"
                placeholder="Город"
                value={editPointForm.city}
                onChange={(e) =>
                  setEditPointForm((prev) => ({ ...prev, city: e.target.value }))
                }
                required
              />
              <input
                className="input"
                placeholder="Точка выдачи"
                value={editPointForm.place}
                onChange={(e) =>
                  setEditPointForm((prev) => ({ ...prev, place: e.target.value }))
                }
                required
              />

              <input
                className="input form-span"
                placeholder="Комментарий"
                value={editPointForm.notes}
                onChange={(e) =>
                  setEditPointForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />

              <input
                className="input"
                type="date"
                value={editPointForm.delivery_date}
                onChange={(e) =>
                    setEditPointForm((prev) => ({
                    ...prev,
                    delivery_date: e.target.value,
                    }))
                }
                required
                />

                <input
                className="input"
                placeholder="Примерное время"
                value={editPointForm.approx_time}
                onChange={(e) =>
                    setEditPointForm((prev) => ({
                    ...prev,
                    approx_time: e.target.value,
                    }))
                }
                />

              <label className="checkbox-row form-span">
                <input
                  type="checkbox"
                  checked={editPointForm.active}
                  onChange={(e) =>
                    setEditPointForm((prev) => ({
                      ...prev,
                      active: e.target.checked,
                    }))
                  }
                />
                Активна
              </label>

              <button className="btn btn-primary form-span" type="submit">
                Сохранить изменения
              </button>
            </form>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Редактировать товар</h2>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setEditingProduct(null)}
              >
                Закрыть
              </button>
            </div>

            <form className="form-grid" onSubmit={handleUpdateProduct}>
              <input
                className="input"
                placeholder="SKU"
                value={editProductForm.sku}
                onChange={(e) =>
                  setEditProductForm((prev) => ({ ...prev, sku: e.target.value }))
                }
                required
              />
              <input
                className="input"
                placeholder="Название"
                value={editProductForm.name}
                onChange={(e) =>
                  setEditProductForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
              <input
                className="input"
                placeholder="Категория"
                value={editProductForm.category}
                onChange={(e) =>
                  setEditProductForm((prev) => ({ ...prev, category: e.target.value }))
                }
                required
              />
              <input
                className="input"
                placeholder="Цена"
                type="number"
                step="0.01"
                value={editProductForm.price}
                onChange={(e) =>
                  setEditProductForm((prev) => ({ ...prev, price: e.target.value }))
                }
                required
              />
              <input
                className="input"
                placeholder="Валюта"
                value={editProductForm.currency}
                onChange={(e) =>
                  setEditProductForm((prev) => ({ ...prev, currency: e.target.value }))
                }
                required
              />
              <input
                className="input"
                placeholder="Ед. измерения"
                value={editProductForm.unit}
                onChange={(e) =>
                  setEditProductForm((prev) => ({ ...prev, unit: e.target.value }))
                }
                required
              />
              <input
                className="input"
                placeholder="Размер упаковки"
                type="number"
                step="0.01"
                value={editProductForm.pack_size}
                onChange={(e) =>
                  setEditProductForm((prev) => ({ ...prev, pack_size: e.target.value }))
                }
              />
              <input
                className="input"
                placeholder="Минимальное количество"
                type="number"
                step="0.01"
                value={editProductForm.min_qty}
                onChange={(e) =>
                  setEditProductForm((prev) => ({ ...prev, min_qty: e.target.value }))
                }
                required
              />
              <input
                className="input"
                placeholder="Шаг"
                type="number"
                step="0.01"
                value={editProductForm.step}
                onChange={(e) =>
                  setEditProductForm((prev) => ({ ...prev, step: e.target.value }))
                }
                required
              />
              <input
                className="input"
                placeholder="Доступное количество"
                type="number"
                step="0.01"
                value={editProductForm.available_qty}
                onChange={(e) =>
                  setEditProductForm((prev) => ({
                    ...prev,
                    available_qty: e.target.value,
                  }))
                }
                required
              />
              <input
                className="input form-span"
                placeholder="Комментарий"
                value={editProductForm.notes}
                onChange={(e) =>
                  setEditProductForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />

                <input
                className="input form-span"
                placeholder="Ссылка на фото (image URL)"
                value={editProductForm.image_url}
                onChange={(e) =>
                  setEditProductForm((prev) => ({
                    ...prev,
                    image_url: e.target.value,
                  }))
                }
              />
              <input
                className="input form-span"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleUploadEditProductImage}
                />
                {editProductForm.image_url && (
                <div className="form-span image-preview-wrap">
                    <img src={editProductForm.image_url} alt="Preview" className="image-preview" />
                </div>
                )}

              <input
                className="input form-span"
                placeholder="Короткое описание"
                value={editProductForm.short_description}
                onChange={(e) =>
                  setEditProductForm((prev) => ({
                    ...prev,
                    short_description: e.target.value,
                  }))
                }
              />

              <textarea
                className="input form-span"
                placeholder="Полное описание"
                value={editProductForm.description}
                onChange={(e) =>
                  setEditProductForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={4}
              />

              <label className="checkbox-row form-span">
                <input
                  type="checkbox"
                  checked={editProductForm.active}
                  onChange={(e) =>
                    setEditProductForm((prev) => ({
                      ...prev,
                      active: e.target.checked,
                    }))
                  }
                />
                Активен
              </label>

              <button className="btn btn-primary form-span" type="submit">
                Сохранить изменения
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedCart && (
        <div className="modal-overlay" onClick={() => setSelectedCart(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Заказ клиента #{selectedCart.cart_id}</h2>

              <div className="actions-row">
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() =>
                    copyText(selectedCart.phone || "", "Телефон скопирован")
                  }
                  disabled={!selectedCart.phone}
                >
                  Скопировать телефон
                </button>

                <button
                  className="btn btn-secondary btn-small"
                  onClick={() =>
                    copyText(buildOrderRowText(selectedCart), "Строка заказа скопирована")
                  }
                >
                  Скопировать строку
                </button>

                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setSelectedCart(null)}
                >
                  Закрыть
                </button>
              </div>
            </div>

            <div className="details-grid">
              <div><strong>Номер заказа:</strong> {selectedCart.pickup_number ?? "—"}</div>
              <div><strong>Имя:</strong> {selectedCart.customer_name || "—"}</div>
              <div><strong>Телефон:</strong> {selectedCart.phone || "—"}</div>
              <div><strong>Telegram:</strong> {selectedCart.telegram_username || selectedCart.telegram_user_id}</div>
              <div><strong>Город:</strong> {selectedCart.city || "—"}</div>
              <div><strong>Точка выдачи:</strong> {selectedCart.delivery_point || "—"}</div>
              <div><strong>Дата выдачи:</strong> {selectedCart.delivery_date || "—"}</div>
              <div><strong>Обновлено:</strong> {formatDate(selectedCart.updated_at)}</div>
            </div>

            <div className="card inner-card">
              <h3>Комментарий</h3>
              <div>{selectedCart.comment || "Комментарий отсутствует"}</div>
            </div>

            <div className="card inner-card">
              <h3>Состав заказа</h3>
              {selectedCart.items.length === 0 ? (
                <div className="muted">Корзина пустая</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Название</th>
                      <th>SKU</th>
                      <th>Количество</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCart.items.map((item, index) => (
                      <tr key={`${item.sku}-${index}`}>
                        <td>{item.product_name}</td>
                        <td>{item.sku}</td>
                        <td>
                          {item.qty} {item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}