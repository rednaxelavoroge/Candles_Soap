"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(data.error || "Неверный пароль");
      }
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-bg px-5 py-12">
      <div className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-[0_8px_30px_rgba(62,43,32,0.06)] border border-sand/60">
        <div className="text-center">
          <span className="eyebrow">Мастерская Анны Манасарян</span>
          <h1 className="mt-2 font-display text-2xl font-medium text-ink md:text-3xl">
            Панель управления
          </h1>
          <p className="mt-2 text-xs text-muted">
            Введите пароль для управления изделиями, фотографиями и контактами
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 flex flex-col gap-4">
          <div>
            <label htmlFor="pass" className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Пароль
            </label>
            <input
              id="pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoFocus
              className="w-full rounded-xl border border-sand bg-bg/50 px-4 py-3 text-sm text-ink placeholder:text-muted/50 focus:border-btn-brown focus:bg-surface focus:outline-none transition-colors"
            />
          </div>

          {error ? (
            <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-full btn-brown py-3.5 text-xs font-semibold tracking-widest uppercase shadow-md disabled:opacity-50"
          >
            {loading ? "Вход..." : "Войти в кабинет →"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-xs text-muted hover:text-ink transition-colors">
            ← Вернуться на сайт
          </a>
        </div>
      </div>
    </div>
  );
}
