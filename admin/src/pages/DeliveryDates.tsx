import { useEffect, useState } from "react";
import axios from "axios";

type DeliveryDate = {
  id: number;
  city: string;
  delivery_date: string;
  active: boolean;
};

const API = import.meta.env.VITE_API_BASE_URL;

export default function DeliveryDatesPage() {
  const [items, setItems] = useState<DeliveryDate[]>([]);
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");

  const token = localStorage.getItem("admin_token");

  const fetchItems = async () => {
    const res = await axios.get(`${API}/admin/delivery-dates`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems(res.data);
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const res = await axios.get(`${API}/admin/delivery-dates`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!cancelled) {
        setItems(res.data);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const create = async () => {
    if (!city || !date) {
      alert("Заполни город и дату");
      return;
    }

    await axios.post(
      `${API}/admin/delivery-dates`,
      {
        city,
        delivery_date: date,
        active: true,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setCity("");
    setDate("");
    await fetchItems();
  };

  const remove = async (id: number) => {
    if (!confirm("Удалить дату?")) return;

    await axios.delete(`${API}/admin/delivery-dates/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    await fetchItems();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Даты доставки</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          placeholder="Город"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <button onClick={create}>Добавить</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Город</th>
            <th>Дата</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.city}</td>
              <td>{item.delivery_date}</td>
              <td>
                <button onClick={() => remove(item.id)}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}