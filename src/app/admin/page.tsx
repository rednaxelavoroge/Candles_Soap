"use client";

import { optimizeImageClient } from "@/lib/image-optimizer";
import type { BackstageItem, Category, Product } from "@/lib/schemas";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Tab = "products" | "categories" | "texts" | "backstage" | "settings";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("products");

  // Данные
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [backstage, setBackstage] = useState<BackstageItem[]>([]);
  const [siteData, setSiteData] = useState({
    owner: "",
    tagline: "",
    intro: "",
    portrait: { src: "" },
    contacts: {
      phone: "",
      phoneRussia: "",
      whatsapp: "",
      instagram: "",
    },
  });

  // Фильтр
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  // Модалка товара
  const [editProduct, setEditProduct] = useState<Partial<Product> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageStats, setImageStats] = useState<string | null>(null);
  const [newImagesData, setNewImagesData] = useState<
    Array<{ base64: string; width: number; height: number; blurDataURL: string }>
  >([]);

  // Редактирование категории
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  // Портрет автора
  const [newPortraitData, setNewPortraitData] = useState<{
    base64: string;
    width: number;
    height: number;
    blurDataURL: string;
  } | null>(null);

  // Модалка бэкстейджа
  const [newBackstageCaption, setNewBackstageCaption] = useState("");
  const [newBackstageMedia, setNewBackstageMedia] = useState<{
    base64: string;
    width: number;
    height: number;
    blurDataURL: string;
  } | null>(null);

  // Уведомления
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Проверка авторизации и загрузка данных
  useEffect(() => {
    async function loadData() {
      try {
        const authRes = await fetch("/api/admin/login");
        const authData = await authRes.json();
        if (!authData.authenticated) {
          router.push("/admin/login");
          return;
        }

        const [prodRes, backRes, siteRes, catRes] = await Promise.all([
          fetch("/api/admin/products"),
          fetch("/api/admin/backstage"),
          fetch("/api/admin/site"),
          fetch("/api/admin/categories"),
        ]);

        if (prodRes.ok) {
          const p = await prodRes.json();
          setProducts(p.products || []);
        }
        if (catRes.ok) {
          const c = await catRes.json();
          setCategories(c.categories || []);
        }
        if (backRes.ok) {
          const b = await backRes.json();
          setBackstage(b.backstage || []);
        }
        if (siteRes.ok) {
          const s = await siteRes.json();
          if (s.site) setSiteData(s.site);
        }
      } catch (err) {
        console.error("Failed to load admin data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/admin/login");
    router.refresh();
  };

  // Загрузка фото с авто-сжатием в WebP
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setImageStats("Сжатие и оптимизация фото...");

    try {
      const results: Array<{ base64: string; width: number; height: number; blurDataURL: string }> = [];
      let totalOriginalSize = 0;
      let totalCompressedSize = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        totalOriginalSize += file.size;

        const optimized = await optimizeImageClient(file, 1400, 0.85);
        totalCompressedSize += optimized.blob.size;

        results.push({
          base64: optimized.dataUrl,
          width: optimized.width,
          height: optimized.height,
          blurDataURL: optimized.blurDataURL,
        });
      }

      setNewImagesData((prev) => [...prev, ...results]);
      const origMb = (totalOriginalSize / (1024 * 1024)).toFixed(1);
      const compKb = (totalCompressedSize / 1024).toFixed(0);
      setImageStats(`✓ Фото оптимизировано: ${origMb} МБ → ${compKb} КБ (WebP)`);
    } catch {
      setImageStats("Ошибка оптимизации фото");
    } finally {
      setUploadingImage(false);
    }
  };

  // Сохранение товара
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct || !editProduct.title || !editProduct.category) {
      alert("Укажите название и категорию изделия");
      return;
    }

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: editProduct,
          imagesData: newImagesData,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setProducts((prev) => {
          const idx = prev.findIndex((p) => p.id === data.product.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = data.product;
            return next;
          }
          return [data.product, ...prev];
        });
        setIsModalOpen(false);
        setEditProduct(null);
        setNewImagesData([]);
        setImageStats(null);
        showToast("✓ Изделие успешно сохранено!");
      } else {
        alert(data.error || "Ошибка сохранения");
      }
    } catch {
      alert("Ошибка сети при сохранении");
    }
  };

  // Удаление товара
  const handleDeleteProduct = async (id: string, title: string) => {
    if (!confirm(`Удалить изделие «${title}»?`)) return;

    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id && p.slug !== id));
        showToast("Изделие удалено");
      }
    } catch {
      alert("Ошибка удаления");
    }
  };

  // Сохранение категории
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCategory) return;

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: editCategory }),
      });
      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) => (c.slug === editCategory.slug ? editCategory : c)),
        );
        setEditCategory(null);
        showToast("✓ Раздел каталога успешно обновлен!");
      }
    } catch {
      alert("Ошибка сохранения раздела");
    }
  };

  // Сохранение текстов и Обо мне
  const handleSaveTexts = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: siteData.owner,
          tagline: siteData.tagline,
          intro: siteData.intro,
          portraitData: newPortraitData,
        }),
      });
      if (res.ok) {
        setNewPortraitData(null);
        showToast("✓ Тексты и фото автора успешно сохранены!");
      }
    } catch {
      alert("Ошибка сохранения");
    }
  };

  // Сохранение настроек контактов
  const handleSaveContacts = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: siteData.contacts }),
      });
      if (res.ok) {
        showToast("✓ Контакты успешно обновлены!");
      }
    } catch {
      alert("Ошибка сохранения");
    }
  };

  // Добавление фото в бэкстейдж
  const handleAddBackstage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBackstageMedia) {
      alert("Выберите фотографию");
      return;
    }

    try {
      const res = await fetch("/api/admin/backstage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: { kind: "image", caption: newBackstageCaption },
          mediaData: newBackstageMedia,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setBackstage((prev) => [data.item, ...prev]);
        setNewBackstageCaption("");
        setNewBackstageMedia(null);
        showToast("✓ Фото добавлено в Бэкстейдж!");
      }
    } catch {
      alert("Ошибка добавления");
    }
  };

  // Удаление из бэкстейджа
  const handleDeleteBackstage = async (index: number) => {
    if (!confirm("Удалить этот кадр из бэкстейджа?")) return;
    try {
      const res = await fetch(`/api/admin/backstage?index=${index}`, { method: "DELETE" });
      if (res.ok) {
        setBackstage((prev) => prev.filter((_, idx) => idx !== index));
        showToast("Кадр удален");
      }
    } catch {
      alert("Ошибка удаления");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm font-medium text-muted">Загрузка панели управления...</p>
      </div>
    );
  }

  const filteredProducts = products.filter((p) => {
    const matchCat = catFilter === "all" || p.category === catFilter;
    const matchSearch =
      search === "" ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.article.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-bg pb-20 pt-20 md:pt-28">
      {/* Тост-уведомление */}
      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-btn-brown px-5 py-3 text-xs font-semibold text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        {/* Шапка админки */}
        <div className="flex flex-col gap-4 border-b border-sand pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="eyebrow">Atelier Admin</span>
              <span className="rounded-full bg-sand/60 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase text-ink">
                Панель Анны
              </span>
            </div>
            <h1 className="mt-1 font-display text-2xl text-ink md:text-3xl">Управление сайтом</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="rounded-full border border-sand bg-surface px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-sand/30"
            >
              Открыть сайт ↗
            </Link>
            <button
              onClick={handleLogout}
              type="button"
              className="rounded-full border border-sand px-4 py-2 text-xs font-medium text-muted transition-colors hover:text-ink"
            >
              Выйти
            </button>
          </div>
        </div>

        {/* Навигационные вкладки */}
        <div className="mt-6 flex gap-2 border-b border-sand pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setTab("products")}
            type="button"
            className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
              tab === "products"
                ? "btn-brown shadow-sm"
                : "bg-surface/60 text-muted hover:text-ink"
            }`}
          >
            Изделия ({products.length})
          </button>
          <button
            onClick={() => setTab("categories")}
            type="button"
            className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
              tab === "categories"
                ? "btn-brown shadow-sm"
                : "bg-surface/60 text-muted hover:text-ink"
            }`}
          >
            Разделы каталога ({categories.length})
          </button>
          <button
            onClick={() => setTab("texts")}
            type="button"
            className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
              tab === "texts"
                ? "btn-brown shadow-sm"
                : "bg-surface/60 text-muted hover:text-ink"
            }`}
          >
            Тексты и Обо мне
          </button>
          <button
            onClick={() => setTab("backstage")}
            type="button"
            className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
              tab === "backstage"
                ? "btn-brown shadow-sm"
                : "bg-surface/60 text-muted hover:text-ink"
            }`}
          >
            Бэкстейдж ({backstage.length})
          </button>
          <button
            onClick={() => setTab("settings")}
            type="button"
            className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
              tab === "settings"
                ? "btn-brown shadow-sm"
                : "bg-surface/60 text-muted hover:text-ink"
            }`}
          >
            Контакты
          </button>
        </div>

        {/* 1. ВКЛАДКА ТОВАРОВ */}
        {tab === "products" ? (
          <div className="mt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Поиск по названию или артикулу..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-72 rounded-xl border border-sand bg-surface px-4 py-2.5 text-xs text-ink placeholder:text-muted/50 focus:border-btn-brown focus:outline-none"
                />
                <select
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value)}
                  className="rounded-xl border border-sand bg-surface px-4 py-2.5 text-xs text-ink focus:border-btn-brown focus:outline-none"
                >
                  <option value="all">Все категории ({products.length})</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.title} ({products.filter((p) => p.category === c.slug).length})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setEditProduct({
                    category: "soap",
                    title: "",
                    article: `АРТ-${Math.floor(100 + Math.random() * 900)}`,
                    description: "",
                    images: [],
                    specs: {},
                    tags: [],
                  });
                  setNewImagesData([]);
                  setImageStats(null);
                  setIsModalOpen(true);
                }}
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full btn-brown px-6 py-3 text-xs font-semibold tracking-wider uppercase shadow-md"
              >
                <span>+ Добавить изделие</span>
              </button>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredProducts.map((p) => {
                const cover = p.images?.[0]?.src || "/placeholder.jpg";
                return (
                  <div
                    key={p.id}
                    className="flex flex-col justify-between overflow-hidden rounded-2xl border border-sand/60 bg-surface p-3 shadow-sm transition-all hover:shadow-md"
                  >
                    <div>
                      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-sand/40">
                        <Image
                          src={cover}
                          alt={p.title}
                          fill
                          sizes="200px"
                          className="object-cover"
                        />
                        <span className="absolute top-2 left-2 rounded-full bg-ink/75 px-2 py-0.5 text-[0.6rem] font-semibold uppercase text-white backdrop-blur-sm">
                          {p.article}
                        </span>
                      </div>
                      <h3 className="mt-2.5 font-display text-sm font-medium text-ink line-clamp-1">
                        {p.title}
                      </h3>
                      <p className="text-[0.7rem] text-muted">
                        {categories.find((c) => c.slug === p.category)?.title || p.category}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-sand/40 pt-2.5">
                      <button
                        onClick={() => {
                          setEditProduct(p);
                          setNewImagesData([]);
                          setImageStats(null);
                          setIsModalOpen(true);
                        }}
                        type="button"
                        className="text-xs font-medium text-btn-brown hover:underline"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.title)}
                        type="button"
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* 2. ВКЛАДКА РАЗДЕЛЫ КАТАЛОГА */}
        {tab === "categories" ? (
          <div className="mt-8 max-w-3xl">
            <h2 className="font-display text-lg font-medium text-ink">
              Названия и описания разделов каталога
            </h2>
            <p className="mt-1 text-xs text-muted">
              Здесь вы можете изменить названия и пояснительные тексты для каждого направления каталога.
            </p>

            <div className="mt-6 flex flex-col gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.slug}
                  className="rounded-2xl border border-sand/60 bg-surface p-5 shadow-sm"
                >
                  {editCategory?.slug === cat.slug ? (
                    <form onSubmit={handleSaveCategory} className="flex flex-col gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[0.7rem] font-semibold uppercase tracking-wider text-muted mb-1">
                            Название раздела
                          </label>
                          <input
                            type="text"
                            value={editCategory.title}
                            onChange={(e) =>
                              setEditCategory({ ...editCategory, title: e.target.value })
                            }
                            required
                            className="w-full rounded-xl border border-sand bg-bg/50 px-3 py-2 text-xs text-ink focus:border-btn-brown focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[0.7rem] font-semibold uppercase tracking-wider text-muted mb-1">
                            Краткий подзаголовок
                          </label>
                          <input
                            type="text"
                            value={editCategory.subtitle || ""}
                            onChange={(e) =>
                              setEditCategory({ ...editCategory, subtitle: e.target.value })
                            }
                            className="w-full rounded-xl border border-sand bg-bg/50 px-3 py-2 text-xs text-ink focus:border-btn-brown focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[0.7rem] font-semibold uppercase tracking-wider text-muted mb-1">
                          Подробное описание раздела
                        </label>
                        <textarea
                          rows={3}
                          value={editCategory.description || ""}
                          onChange={(e) =>
                            setEditCategory({ ...editCategory, description: e.target.value })
                          }
                          className="w-full rounded-xl border border-sand bg-bg/50 px-3 py-2 text-xs text-ink focus:border-btn-brown focus:outline-none"
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setEditCategory(null)}
                          className="rounded-full border border-sand px-4 py-1.5 text-xs text-muted hover:text-ink"
                        >
                          Отмена
                        </button>
                        <button
                          type="submit"
                          className="rounded-full btn-brown px-5 py-1.5 text-xs font-semibold uppercase tracking-wider shadow-sm"
                        >
                          Сохранить ✓
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display text-base text-ink">{cat.title}</h3>
                        <p className="text-xs font-medium text-clay mt-0.5">{cat.subtitle}</p>
                        <p className="text-xs text-muted mt-2 leading-relaxed max-w-xl">
                          {cat.description}
                        </p>
                      </div>
                      <button
                        onClick={() => setEditCategory(cat)}
                        className="rounded-full border border-sand px-4 py-1.5 text-xs font-medium text-btn-brown hover:bg-sand/30 transition-colors"
                      >
                        Изменить
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* 3. ВКЛАДКА ТЕКСТЫ И ОБО МНЕ */}
        {tab === "texts" ? (
          <div className="mt-8 max-w-2xl rounded-2xl border border-sand/60 bg-surface p-6 shadow-sm">
            <h2 className="font-display text-lg font-medium text-ink">
              Тексты сайта и страница «Обо мне»
            </h2>
            <form onSubmit={handleSaveTexts} className="mt-6 flex flex-col gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Имя автора / Мастера
                </label>
                <input
                  type="text"
                  value={siteData.owner}
                  onChange={(e) => setSiteData({ ...siteData, owner: e.target.value })}
                  className="w-full rounded-xl border border-sand bg-bg/50 px-4 py-2.5 text-xs text-ink focus:border-btn-brown focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Краткий слоган (на главной под именем)
                </label>
                <input
                  type="text"
                  value={siteData.tagline}
                  onChange={(e) => setSiteData({ ...siteData, tagline: e.target.value })}
                  className="w-full rounded-xl border border-sand bg-bg/50 px-4 py-2.5 text-xs text-ink focus:border-btn-brown focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  История и философия (текст «Обо мне» и на главной)
                </label>
                <textarea
                  rows={5}
                  value={siteData.intro}
                  onChange={(e) => setSiteData({ ...siteData, intro: e.target.value })}
                  className="w-full rounded-xl border border-sand bg-bg/50 px-4 py-2.5 text-xs text-ink focus:border-btn-brown focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Портретное фото автора
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const opt = await optimizeImageClient(file, 1400, 0.85);
                    setNewPortraitData({
                      base64: opt.dataUrl,
                      width: opt.width,
                      height: opt.height,
                      blurDataURL: opt.blurDataURL,
                    });
                  }}
                  className="text-xs text-muted file:mr-3 file:rounded-full file:border-0 file:btn-brown file:px-4 file:py-2 file:text-xs file:font-semibold"
                />
              </div>

              <button
                type="submit"
                className="mt-2 rounded-full btn-brown py-3 text-xs font-semibold uppercase tracking-wider shadow-md"
              >
                Сохранить все тексты →
              </button>
            </form>
          </div>
        ) : null}

        {/* 4. ВКЛАДКА БЭКСТЕЙДЖ */}
        {tab === "backstage" ? (
          <div className="mt-8">
            <div className="rounded-2xl border border-sand/60 bg-surface p-6 shadow-sm">
              <h2 className="font-display text-lg font-medium text-ink">
                + Добавить кадр в Бэкстейдж
              </h2>
              <form onSubmit={handleAddBackstage} className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                    Подпись к кадру
                  </label>
                  <input
                    type="text"
                    placeholder="Например: Заливка натурального соевого воска"
                    value={newBackstageCaption}
                    onChange={(e) => setNewBackstageCaption(e.target.value)}
                    required
                    className="w-full rounded-xl border border-sand bg-bg/50 px-4 py-2.5 text-xs text-ink focus:border-btn-brown focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                    Фотография (авто-сжатие)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const opt = await optimizeImageClient(file, 1400, 0.85);
                      setNewBackstageMedia({
                        base64: opt.dataUrl,
                        width: opt.width,
                        height: opt.height,
                        blurDataURL: opt.blurDataURL,
                      });
                    }}
                    className="text-xs text-muted file:mr-3 file:rounded-full file:border-0 file:btn-brown file:px-4 file:py-2 file:text-xs file:font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-full btn-brown px-6 py-2.5 text-xs font-semibold uppercase tracking-wider shadow-sm"
                >
                  Опубликовать
                </button>
              </form>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {backstage.map((b, idx) => {
                const src = b.kind === "image" ? b.image.src : b.poster.src;
                return (
                  <div
                    key={idx}
                    className="relative overflow-hidden rounded-2xl border border-sand/60 bg-surface p-2.5 shadow-sm"
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-sand/30">
                      <Image src={src} alt={b.caption} fill sizes="300px" className="object-cover" />
                    </div>
                    <p className="mt-2 text-xs font-medium text-ink line-clamp-1">{b.caption}</p>
                    <button
                      onClick={() => handleDeleteBackstage(idx)}
                      type="button"
                      className="mt-2 text-[0.7rem] text-red-500 hover:underline"
                    >
                      Удалить кадр
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* 5. ВКЛАДКА КОНТАКТЫ */}
        {tab === "settings" ? (
          <div className="mt-8 max-w-xl rounded-2xl border border-sand/60 bg-surface p-6 shadow-sm">
            <h2 className="font-display text-lg font-medium text-ink">Настройка контактов</h2>
            <form onSubmit={handleSaveContacts} className="mt-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Телефон (Армения) и WhatsApp
                </label>
                <input
                  type="text"
                  value={siteData.contacts.phone}
                  onChange={(e) =>
                    setSiteData({
                      ...siteData,
                      contacts: {
                        ...siteData.contacts,
                        phone: e.target.value,
                        whatsapp: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-xl border border-sand bg-bg/50 px-4 py-2.5 text-xs text-ink focus:border-btn-brown focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Телефон (Россия)
                </label>
                <input
                  type="text"
                  value={siteData.contacts.phoneRussia}
                  onChange={(e) =>
                    setSiteData({
                      ...siteData,
                      contacts: {
                        ...siteData.contacts,
                        phoneRussia: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-xl border border-sand bg-bg/50 px-4 py-2.5 text-xs text-ink focus:border-btn-brown focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Instagram (без @)
                </label>
                <input
                  type="text"
                  value={siteData.contacts.instagram}
                  onChange={(e) =>
                    setSiteData({
                      ...siteData,
                      contacts: {
                        ...siteData.contacts,
                        instagram: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-xl border border-sand bg-bg/50 px-4 py-2.5 text-xs text-ink focus:border-btn-brown focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="mt-4 rounded-full btn-brown py-3 text-xs font-semibold uppercase tracking-wider shadow-md"
              >
                Сохранить контакты →
              </button>
            </form>
          </div>
        ) : null}
      </div>

      {/* МОДАЛЬНОЕ ОКНО ДОБАВЛЕНИЯ / РЕДАКТИРОВАНИЯ ТОВАРА */}
      {isModalOpen && editProduct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative my-8 w-full max-w-2xl rounded-3xl border border-sand bg-surface p-6 shadow-2xl md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-sand pb-4">
              <h2 className="font-display text-xl text-ink">
                {editProduct.id ? "Редактирование изделия" : "Новое изделие"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                type="button"
                className="rounded-full p-2 text-muted hover:bg-sand/30"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                    Название изделия *
                  </label>
                  <input
                    type="text"
                    value={editProduct.title || ""}
                    onChange={(e) => setEditProduct({ ...editProduct, title: e.target.value })}
                    placeholder="Например: Свеча «Соты»"
                    required
                    className="w-full rounded-xl border border-sand bg-bg/50 px-4 py-2.5 text-xs text-ink focus:border-btn-brown focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                    Категория *
                  </label>
                  <select
                    value={editProduct.category || "soap"}
                    onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
                    className="w-full rounded-xl border border-sand bg-bg/50 px-4 py-2.5 text-xs text-ink focus:border-btn-brown focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Артикул
                </label>
                <input
                  type="text"
                  value={editProduct.article || ""}
                  onChange={(e) => setEditProduct({ ...editProduct, article: e.target.value })}
                  placeholder="СВ-01"
                  className="w-full rounded-xl border border-sand bg-bg/50 px-4 py-2.5 text-xs text-ink focus:border-btn-brown focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Описание
                </label>
                <textarea
                  rows={3}
                  value={editProduct.description || ""}
                  onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                  placeholder="Подробное описание изделия, состава, аромата..."
                  className="w-full rounded-xl border border-sand bg-bg/50 px-4 py-2.5 text-xs text-ink focus:border-btn-brown focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.7rem] font-semibold uppercase tracking-wider text-muted mb-1">
                    Аромат
                  </label>
                  <input
                    type="text"
                    value={editProduct.specs?.scent || ""}
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        specs: { ...(editProduct.specs || {}), scent: e.target.value },
                      })
                    }
                    placeholder="Например: Ваниль и сандал"
                    className="w-full rounded-xl border border-sand bg-bg/50 px-3 py-2 text-xs text-ink focus:border-btn-brown focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[0.7rem] font-semibold uppercase tracking-wider text-muted mb-1">
                    Состав и материалы
                  </label>
                  <input
                    type="text"
                    value={editProduct.specs?.composition || ""}
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        specs: { ...(editProduct.specs || {}), composition: e.target.value },
                      })
                    }
                    placeholder="100% соевый воск, хлопковый фитиль"
                    className="w-full rounded-xl border border-sand bg-bg/50 px-3 py-2 text-xs text-ink focus:border-btn-brown focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-sand p-4 bg-bg/30">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  📷 Фотографии изделия (с авто-сжатием в WebP)
                </label>
                <p className="text-[0.7rem] text-muted mb-3">
                  Вы можете выбрать фото любого веса с телефона или камеры — система сама сожмет его без потери качества.
                </p>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="text-xs text-muted file:mr-3 file:rounded-full file:border-0 file:btn-brown file:px-4 file:py-2 file:text-xs file:font-semibold"
                />

                {uploadingImage ? (
                  <p className="mt-2 text-xs text-accent animate-pulse">Оптимизация изображений...</p>
                ) : imageStats ? (
                  <p className="mt-2 text-xs font-medium text-emerald-700">{imageStats}</p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {editProduct.images?.map((img, i) => (
                    <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg border border-sand">
                      <Image src={img.src} alt="" fill sizes="64px" className="object-cover" />
                    </div>
                  ))}
                  {newImagesData.map((img, i) => (
                    <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg border-2 border-btn-brown">
                      <img src={img.base64} alt="" className="h-full w-full object-cover" />
                      <span className="absolute bottom-0 right-0 bg-btn-brown text-[0.55rem] text-white px-1">
                        Новое
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-3 border-t border-sand pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full border border-sand px-6 py-2.5 text-xs font-semibold text-muted hover:text-ink"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="rounded-full btn-brown px-8 py-2.5 text-xs font-semibold uppercase tracking-wider shadow-md"
                >
                  Сохранить изделие ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
