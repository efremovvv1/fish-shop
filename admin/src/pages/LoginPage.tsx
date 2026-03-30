import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin, setAdminToken } from "../api/client";

export default function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await adminLogin(username, password);
      setAdminToken(res.access_token);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Неверный логин или пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page center">
      <form className="card login-card" onSubmit={handleLogin}>
        <h1>Админ-панель</h1>
        <p className="muted">Вход для владельца магазина</p>

        <input
          className="input"
          placeholder="Логин"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          className="input"
          placeholder="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <div className="error-text">{error}</div>}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Вход..." : "Войти"}
        </button>
      </form>
    </div>
  );
}