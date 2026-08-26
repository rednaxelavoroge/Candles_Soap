"use client";

import { optimizeImageClient } from "@/lib/image-optimizer";
import { useDragOrder, withMoved } from "@/lib/use-drag-order";
import type { BackstageItem, Category, Product, Tag, Video } from "@/lib/schemas";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Tab = "products" | "categories" | "sections" | "featured" | "texts" | "backstage" | "settings";

/** Ролик из библиотеки мастерской: то, что уже загружено в проект. */
type LibraryVideo = { src: string; name: string; poster: string | null; caption: string | null };

/**
 * Предел на свой ролик. Тот же, что стоит на сервере: тело запроса к панели
 * ограничено площадкой, и ролик с телефона в него не помещается. Проверяем
 * ещё до отправки, чтобы сказать понятную причину, а не «ошибка загрузки».
 */
const MAX_VIDEO_UPLOAD_MB = 3.5;
const MAX_VIDEO_UPLOAD_BYTES = MAX_VIDEO_UPLOAD_MB * 1024 * 1024;

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("products");

  // Данные
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [backstage, setBackstage] = useState<BackstageItem[]>([]);
  const [siteData, setSiteData] = useState({
    owner: "",
    tagline: "",
    intro: "",
    portrait: { src: "" },
    // Лента «Избранного» на главной: своё название, своя подпись, свой состав.
    featured: {
      enabled: true,
      eyebrow: "Избранное мастерской",
      title: "Избранное",
      subtitle: "",
      ids: [] as string[],
    },
    contacts: {
      phone: "",
      phoneRussia: "",
      whatsapp: "",
      instagram: "",
      facebook: "",
      email: "",
      city: "",
    },
  });

  // Фильтр
  const [search, setSearch] = useState("");
  // Поиск изделий для ленты «Избранного»
  const [featuredSearch, setFeaturedSearch] = useState("");
  // Создание нового подраздела прямо из карточки изделия
  const [newTagTitle, setNewTagTitle] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [catFilter, setCatFilter] = useState("all");

  // Модалка товара
  const [editProduct, setEditProduct] = useState<Partial<Product> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageStats, setImageStats] = useState<string | null>(null);
  const [newImagesData, setNewImagesData] = useState<
    Array<{ base64: string; width: number; height: number; blurDataURL: string }>
  >([]);

  // Редактирование / Создание категории
  const [editCategory, setEditCategory] = useState<Partial<Category> | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryCover, setNewCategoryCover] = useState<{
    base64: string;
    width: number;
    height: number;
    blurDataURL: string;
  } | null>(null);

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

  // Библиотека роликов мастерской для карточки изделия
  const [videoLibrary, setVideoLibrary] = useState<LibraryVideo[]>([]);
  const [videoPickerOpen, setVideoPickerOpen] = useState(false);
  const [videoLink, setVideoLink] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Переименование подраздела на вкладке «Подразделы»
  const [editingTagSlug, setEditingTagSlug] = useState<string | null>(null);
  const [editingTagTitle, setEditingTagTitle] = useState("");
  // Создание подраздела там же, не открывая изделие
  const [sectionTagTitle, setSectionTagTitle] = useState("");
  // Поиск изделий для блока «Похожие» в карточке
  const [relatedSearch, setRelatedSearch] = useState("");

  // Пока порядок уезжает на сервер, стрелки заблокированы: два быстрых нажатия
  // подряд ушли бы от одного и того же исходного списка и затёрли друг друга.
  const [savingOrder, setSavingOrder] = useState(false);

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

        const [prodRes, backRes, siteRes, catRes, vidRes] = await Promise.all([
          fetch("/api/admin/products"),
          fetch("/api/admin/backstage"),
          fetch("/api/admin/site"),
          fetch("/api/admin/categories"),
          fetch("/api/admin/videos"),
        ]);

        if (prodRes.ok) {
          const p = await prodRes.json();
          setProducts(p.products || []);
          setTags(p.tags || []);
        }
        if (catRes.ok) {
          const c = await catRes.json();
          setCategories(c.categories || []);
        }
        if (backRes.ok) {
          const b = await backRes.json();
          setBackstage(b.backstage || []);
        }
        if (vidRes.ok) {
          const v = await vidRes.json();
          setVideoLibrary(v.videos || []);
        }
        if (siteRes.ok) {
          const s = await siteRes.json();
          if (s.site) {
            // В данных, сохранённых до появления ленты, поля featured нет.
            setSiteData({
              ...s.site,
              featured: {
                enabled: true,
                eyebrow: "Избранное мастерской",
                title: "Избранное",
                subtitle: "",
                ids: [],
                ...(s.site.featured || {}),
              },
            });
          }
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
    if ((editProduct.images?.length ?? 0) + newImagesData.length === 0) {
      alert("Добавьте хотя бы одну фотографию изделия");
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
        setVideoPickerOpen(false);
        showToast("✓ Сохранено. На сайте обновится через несколько минут");
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

  // Сохранение / Создание категории
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCategory || !editCategory.title) {
      alert("Укажите название раздела");
      return;
    }

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: editCategory,
          coverData: newCategoryCover,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setCategories(data.categories);
        setIsCategoryModalOpen(false);
        setEditCategory(null);
        setNewCategoryCover(null);
        showToast("✓ Раздел каталога успешно сохранен!");
      } else {
        alert(data.error || "Ошибка сохранения раздела");
      }
    } catch {
      alert("Ошибка сохранения раздела");
    }
  };

  // Удаление категории
  const handleDeleteCategory = async (slug: string, title: string) => {
    if (!confirm(`Вы действительно хотите удалить раздел «${title}»?`)) return;

    try {
      const res = await fetch(`/api/admin/categories?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setCategories(data.categories);
        showToast(`Раздел «${title}» удален`);
      } else {
        alert(data.error || "Ошибка удаления");
      }
    } catch {
      alert("Ошибка удаления");
    }
  };

  // Сохранение текстов и Обо мне
  /**
   * Заводит новый подраздел и сразу отмечает его у открытого изделия.
   * На сайте подраздел появится вместе с этим изделием: пустых разделов
   * в каталоге не бывает.
   */
  const handleCreateTag = async () => {
    const title = newTagTitle.trim();
    if (!title || !editProduct) return;

    setCreatingTag(true);
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (!res.ok || !data.tag) {
        alert(data.error || "Не удалось создать подраздел");
        return;
      }

      setTags(data.tags || []);
      const currentTags = editProduct.tags || [];
      if (!currentTags.includes(data.tag.slug)) {
        setEditProduct({ ...editProduct, tags: [...currentTags, data.tag.slug] });
      }
      setNewTagTitle("");
      showToast(
        data.existed
          ? `Подраздел «${data.tag.title}» уже был — отметили его`
          : `✓ Подраздел «${data.tag.title}» создан и отмечен`,
      );
    } catch {
      alert("Ошибка создания подраздела");
    } finally {
      setCreatingTag(false);
    }
  };

  /**
   * Новый подраздел прямо со вкладки «Подразделы».
   *
   * Раньше завести его можно было только изнутри карточки изделия, и заказчица
   * искала кнопку там, где список — то есть здесь. Подраздел появляется в
   * списке сразу, а в каталоге — когда им отметят хотя бы одно изделие.
   */
  const handleCreateSectionTag = async () => {
    const title = sectionTagTitle.trim();
    if (!title || creatingTag) return;

    setCreatingTag(true);
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (!res.ok || !data.tag) {
        alert(data.error || "Не удалось создать подраздел");
        return;
      }
      setTags(data.tags || []);
      setSectionTagTitle("");
      showToast(
        data.existed
          ? `Подраздел «${data.tag.title}» уже был в списке`
          : `✓ Подраздел «${data.tag.title}» создан`,
      );
    } catch {
      alert("Ошибка создания подраздела");
    } finally {
      setCreatingTag(false);
    }
  };

  /**
   * Переименование подраздела. Адрес раздела (слаг) остаётся прежним: он стоит
   * в ссылке, а ссылку заказчица могла уже кому-то отправить.
   */
  const handleRenameTag = async (slug: string) => {
    const title = editingTagTitle.trim();
    if (!title) return;

    try {
      const res = await fetch("/api/admin/tags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setTags(data.tags);
        setEditingTagSlug(null);
        setEditingTagTitle("");
        showToast("✓ Название подраздела изменено");
      } else {
        alert(data.error || "Не удалось переименовать подраздел");
      }
    } catch {
      alert("Ошибка сети при переименовании");
    }
  };

  /** Удаление подраздела: метка снимается и со всех изделий, где стояла. */
  const handleDeleteTag = async (slug: string, title: string) => {
    const used = products.filter((p) => p.tags.includes(slug)).length;
    const warning = used > 0 ? `\n\nОн отмечен у ${used} изд. — метка снимется, сами изделия останутся.` : "";
    if (!confirm(`Удалить подраздел «${title}»?${warning}`)) return;

    try {
      const res = await fetch(`/api/admin/tags?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setTags(data.tags);
        setProducts((prev) =>
          prev.map((p) =>
            p.tags.includes(slug) ? { ...p, tags: p.tags.filter((t) => t !== slug) } : p,
          ),
        );
        showToast(`Подраздел «${title}» удалён`);
      } else {
        alert(data.error || "Не удалось удалить подраздел");
      }
    } catch {
      alert("Ошибка сети при удалении");
    }
  };

  /** Порядок подразделов в каталоге: в нём они и покажутся на сайте. */
  const moveTag = async (from: number, to: number) => {
    if (to < 0 || to >= tags.length || from === to || savingOrder) return;

    const next = withMoved(tags, from, to);
    setTags(next);

    setSavingOrder(true);
    try {
      const res = await fetch("/api/admin/tags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: next.map((t) => t.slug) }),
      });
      const data = await res.json();
      if (res.ok && data.ok) setTags(data.tags);
      else {
        setTags(tags);
        alert(data.error || "Не удалось сохранить порядок");
      }
    } catch {
      setTags(tags);
      alert("Ошибка сети при сохранении порядка");
    } finally {
      setSavingOrder(false);
    }
  };

  /** Порядок кадров в бэкстейдже. */
  const moveBackstage = async (from: number, to: number) => {
    if (to < 0 || to >= backstage.length || from === to || savingOrder) return;

    const next = withMoved(backstage, from, to);
    setBackstage(next);

    setSavingOrder(true);
    try {
      const res = await fetch("/api/admin/backstage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: next.map((item) => (item.kind === "image" ? item.image.src : item.src)),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) setBackstage(data.backstage);
      else {
        setBackstage(backstage);
        alert(data.error || "Не удалось сохранить порядок");
      }
    } catch {
      setBackstage(backstage);
      alert("Ошибка сети при сохранении порядка");
    } finally {
      setSavingOrder(false);
    }
  };

  /**
   * Порядок изделий внутри раздела каталога. Работает по видимому списку,
   * поэтому доступен только когда выбран один раздел и не задан поиск —
   * иначе «выше» означало бы позицию в отфильтрованной выборке, а не в разделе.
   */
  const moveProduct = async (visible: Product[], from: number, to: number) => {
    if (to < 0 || to >= visible.length || from === to || savingOrder) return;

    const next = withMoved(visible, from, to);

    const position = new Map(next.map((p, i) => [p.id, (i + 1) * 10]));
    const before = products;
    setProducts((prev) =>
      prev.map((p) => (position.has(p.id) ? { ...p, order: position.get(p.id) } : p)),
    );

    setSavingOrder(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: next.map((p) => p.id) }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setProducts(before);
        alert(data.error || "Не удалось сохранить порядок");
      }
    } catch {
      setProducts(before);
      alert("Ошибка сети при сохранении порядка");
    } finally {
      setSavingOrder(false);
    }
  };

  /** Добавляет изделие в блок «Похожие» открытой карточки. */
  const addRelated = (id: string) => {
    if (!editProduct) return;
    const current = editProduct.related || [];
    if (current.includes(id) || id === editProduct.id) return;
    setEditProduct({ ...editProduct, related: [...current, id] });
    setRelatedSearch("");
  };

  const removeRelated = (id: string) => {
    if (!editProduct) return;
    setEditProduct({
      ...editProduct,
      related: (editProduct.related || []).filter((x) => x !== id),
    });
  };

  /** Порядок в блоке «Похожие» — это порядок показа на странице изделия. */
  const moveRelated = (from: number, to: number) => {
    if (!editProduct) return;
    const ids = editProduct.related || [];
    if (to < 0 || to >= ids.length || from === to) return;
    setEditProduct({ ...editProduct, related: withMoved(ids, from, to) });
  };

  /** Убирает фотографию из открытого изделия. Сохранится при нажатии «Сохранить». */
  const removeProductImage = (index: number) => {
    if (!editProduct) return;
    const images = [...(editProduct.images || [])];
    images.splice(index, 1);
    setEditProduct({ ...editProduct, images });
  };

  /** Переставляет фотографию: первая в ряду — обложка изделия в каталоге. */
  const moveProductImage = (from: number, to: number) => {
    if (!editProduct) return;
    const images = editProduct.images || [];
    if (to < 0 || to >= images.length || from === to) return;
    setEditProduct({ ...editProduct, images: withMoved(images, from, to) });
  };

  /** Как ролик называется в библиотеке; если его там нет — имя файла. */
  const videoTitle = (src: string) =>
    videoLibrary.find((v) => v.src === src)?.name || src.split("/").pop() || src;

  /**
   * Ролики открытого изделия одним списком. Раньше поле было одно (`video`),
   * и у части изделий данные так и лежат; здесь оба вида приводятся к списку.
   */
  const editVideos: Video[] = editProduct
    ? editProduct.videos && editProduct.videos.length > 0
      ? editProduct.videos
      : editProduct.video
        ? [editProduct.video]
        : []
    : [];

  /** Записывает список роликов, держа прежнее одиночное поле в согласии с ним. */
  const setVideos = (next: Video[]) => {
    if (!editProduct) return;
    setEditProduct({ ...editProduct, videos: next, video: next[0] ?? null });
  };

  /** Обложка ролика — первая фотография изделия. */
  const videoPoster = () =>
    editProduct?.images?.[0] || {
      src: "/placeholder.jpg",
      width: 800,
      height: 800,
      blurDataURL: "",
      alt: editProduct?.title || "",
    };

  /** Добавляет ролик из библиотеки мастерской. Роликов может быть несколько. */
  const attachVideo = (src: string) => {
    if (!editProduct) return;
    if (editVideos.some((v) => v.kind === "file" && v.src === src)) {
      showToast("Этот ролик уже прикреплён");
      return;
    }
    setVideos([...editVideos, { kind: "file", src, poster: videoPoster() }]);
    showToast("✓ Видео прикреплено к изделию");
  };

  const removeVideo = (index: number) => setVideos(editVideos.filter((_, i) => i !== index));

  const moveVideo = (from: number, to: number) => {
    if (to < 0 || to >= editVideos.length || from === to) return;
    setVideos(withMoved(editVideos, from, to));
  };

  /**
   * Загрузка своего ролика. Тяжёлые файлы сюда не проходят — их место на
   * YouTube, и об этом честно говорит сообщение с сервера.
   */
  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    /*
      Тяжёлый файл отсекаем здесь, до отправки. Раньше он уходил на сервер,
      тот обрывал запрос целиком — ещё до нашего кода, — и в ответ приходила
      не наша ошибка, а страница сервера. Разбор её падал, и заказчица видела
      единственное слово «Ошибка загрузки видео» без объяснения, почему.
    */
    const megabytes = file.size / (1024 * 1024);
    if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
      alert(
        `Этот ролик слишком тяжёлый: ${megabytes.toFixed(1)} МБ, а загрузить можно до ${MAX_VIDEO_UPLOAD_MB} МБ.\n\n` +
          "Что можно сделать:\n" +
          "• взять готовый ролик кнопкой «Выбрать из моих роликов» — там вся ваша съёмка;\n" +
          "• прислать этот файл мне, я подготовлю его и добавлю в список.",
      );
      e.target.value = "";
      return;
    }

    setUploadingVideo(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("read"));
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, fileName: file.name }),
      });

      // Ответ может оказаться не нашим (обрыв на сервере) — тогда читаем как текст.
      const raw = await res.text();
      let data: { ok?: boolean; src?: string; error?: string } = {};
      try {
        data = JSON.parse(raw);
      } catch {
        data = {};
      }

      if (res.ok && data.ok && data.src) {
        setVideoLibrary((prev) => [{ src: data.src!, name: file.name, poster: null, caption: null }, ...prev]);
        attachVideo(data.src);
      } else if (res.status === 413) {
        alert(
          `Ролик не прошёл: ${megabytes.toFixed(1)} МБ — слишком тяжёлый для загрузки через панель.\n\n` +
            "Возьмите готовый ролик кнопкой «Выбрать из моих роликов» или пришлите файл мне.",
        );
      } else {
        alert(data.error || "Не удалось загрузить видео. Попробуйте ещё раз или пришлите файл мне.");
      }
    } catch {
      alert(
        "Видео не загрузилось: связь с сервером оборвалась.\n\n" +
          "Попробуйте ещё раз. Если повторится — возьмите ролик кнопкой «Выбрать из моих роликов».",
      );
    } finally {
      setUploadingVideo(false);
      e.target.value = "";
    }
  };

  /** Переставляет изделие в ленте «Избранного» на позицию выше или ниже. */
  const moveFeatured = (from: number, to: number) => {
    const ids = siteData.featured.ids;
    if (to < 0 || to >= ids.length || from === to) return;
    setSiteData({ ...siteData, featured: { ...siteData.featured, ids: withMoved(ids, from, to) } });
  };

  /**
   * Что предложить для ленты: то, что ещё не выбрано. Без поиска показываем
   * первые два десятка, иначе список в 239 изделий листать невозможно.
   */
  const featuredQuery = featuredSearch.trim().toLowerCase();
  const featuredCandidates = products
    .filter((p) => !siteData.featured.ids.includes(p.id))
    .filter(
      (p) =>
        featuredQuery === "" ||
        p.title.toLowerCase().includes(featuredQuery) ||
        p.article.toLowerCase().includes(featuredQuery),
    )
    .slice(0, featuredQuery === "" ? 20 : 40);

  /**
   * Что предложить в «Похожие»: изделия того же раздела, кроме самого
   * открытого и уже выбранных. Поиск снимает ограничение по разделу — иногда
   * к свече просится подсвечник.
   */
  const relatedQuery = relatedSearch.trim().toLowerCase();
  const relatedCandidates = products
    .filter((p) => p.id !== editProduct?.id && !(editProduct?.related || []).includes(p.id))
    .filter((p) =>
      relatedQuery === ""
        ? p.category === editProduct?.category
        : p.title.toLowerCase().includes(relatedQuery) ||
          p.article.toLowerCase().includes(relatedQuery),
    )
    .slice(0, relatedQuery === "" ? 20 : 40);

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
          featured: siteData.featured,
          portraitData: newPortraitData,
        }),
      });
      if (res.ok) {
        // Ответ приносит уже сохранённое состояние: без него превью портрета
        // осталось бы показывать прежний снимок, и панель снова врала бы.
        const saved = await res.json().catch(() => null);
        if (saved?.site?.portrait) {
          setSiteData((prev) => ({ ...prev, portrait: saved.site.portrait }));
        }
        setNewPortraitData(null);
        showToast("✓ Тексты и фото автора успешно сохранены!");
      } else {
        alert("Не удалось сохранить. Попробуйте ещё раз.");
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
  /**
   * Удаление кадра — по пути к файлу, а не по позиции.
   *
   * Позиция в панели и позиция в файле расходятся, стоит один раз что-то
   * переставить или удалить: удалялся не тот кадр, а исчезнувший возвращался
   * следующим сохранением. Путь к файлу такой подмены не допускает.
   */
  const handleDeleteBackstage = async (src: string) => {
    if (!confirm("Удалить этот кадр из бэкстейджа?")) return;
    try {
      const res = await fetch(`/api/admin/backstage?src=${encodeURIComponent(src)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setBackstage(data.backstage);
        showToast("Кадр удалён — на сайте пропадёт через несколько минут");
      } else {
        alert(data.error || "Не удалось удалить кадр");
      }
    } catch {
      alert("Ошибка удаления");
    }
  };

  /**
   * Стрелки порядка показываем только внутри одного раздела и без поиска:
   * иначе «выше» означало бы позицию в отфильтрованной выборке, а не в разделе,
   * и на сайте изделие оказалось бы совсем не там, куда его подняли.
   */
  const canReorderProducts = catFilter !== "all" && search.trim() === "";

  /*
    Перетаскивание мышью там, где раньше были только стрелки. Стрелки остаются
    рядом: на телефоне перетаскивания нет, палец прокручивает страницу.
  */
  const imageDrag = useDragOrder(moveProductImage);
  const relatedDrag = useDragOrder(moveRelated);
  const videoDrag = useDragOrder(moveVideo);
  const tagDrag = useDragOrder(moveTag);
  const featuredDrag = useDragOrder(moveFeatured);
  const backstageDrag = useDragOrder(moveBackstage);
  const productDrag = useDragOrder(
    (from, to) => moveProduct(filteredProducts, from, to),
    canReorderProducts,
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm font-medium text-muted">Загрузка панели управления...</p>
      </div>
    );
  }

  const filteredProducts = products
    .filter((p) => {
      const matchCat = catFilter === "all" || p.category === catFilter;
      const matchSearch =
        search === "" ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.article.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    })
    // Тот же порядок, что и на сайте: у кого позиция не задана — в конец.
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));

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
              href="/admin/instrukciya"
              className="rounded-full border border-sand bg-surface px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-sand/30"
            >
              Инструкция
            </Link>
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
            onClick={() => setTab("sections")}
            type="button"
            className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
              tab === "sections"
                ? "btn-brown shadow-sm"
                : "bg-surface/60 text-muted hover:text-ink"
            }`}
          >
            Подразделы ({tags.length})
          </button>
          <button
            onClick={() => setTab("featured")}
            type="button"
            className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
              tab === "featured"
                ? "btn-brown shadow-sm"
                : "bg-surface/60 text-muted hover:text-ink"
            }`}
          >
            Избранное ({siteData.featured.ids.length})
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
                    category: categories[0]?.slug || "candles",
                    title: "",
                    article: `АРТ-${Math.floor(100 + Math.random() * 900)}`,
                    description: "",
                    images: [],
                    specs: {},
                    tags: [],
                  });
                  setNewImagesData([]);
                  setImageStats(null);
                  setVideoPickerOpen(false);
                  setIsModalOpen(true);
                }}
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full btn-brown px-6 py-3 text-xs font-semibold tracking-wider uppercase shadow-md"
              >
                <span>+ Добавить изделие</span>
              </button>
            </div>

            <p className="mt-6 text-[0.7rem] leading-relaxed text-muted">
              {canReorderProducts
                ? "Порядок карточек здесь — это порядок изделий в разделе на сайте. Возьмите карточку мышью и перетащите на нужное место; на телефоне — стрелками ↑ ↓."
                : "Чтобы менять порядок изделий, выберите один раздел в списке слева и очистите поиск — тогда карточки можно будет перетаскивать."}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredProducts.map((p, index) => {
                const cover = p.images?.[0]?.src || "/placeholder.jpg";
                return (
                  <div
                    key={p.id}
                    {...productDrag.itemProps(index)}
                    className={`flex flex-col justify-between overflow-hidden rounded-2xl border border-sand/60 bg-surface p-3 shadow-sm transition-all hover:shadow-md ${
                      canReorderProducts ? "cursor-grab active:cursor-grabbing" : ""
                    } ${productDrag.itemClass(index)}`}
                  >
                    <div>
                      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-sand/40">
                        <Image
                          src={cover}
                          alt={p.title}
                          fill
                          sizes="200px"
                          draggable={false}
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

                    {canReorderProducts ? (
                      <div className="mt-2.5 flex items-center gap-1 border-t border-sand/40 pt-2">
                        <button
                          type="button"
                          onClick={() => moveProduct(filteredProducts, index, index - 1)}
                          disabled={index === 0 || savingOrder}
                          aria-label="Поднять выше в разделе"
                          className="rounded-full px-2 py-1 text-xs text-muted hover:text-ink disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveProduct(filteredProducts, index, index + 1)}
                          disabled={index === filteredProducts.length - 1 || savingOrder}
                          aria-label="Опустить ниже в разделе"
                          className="rounded-full px-2 py-1 text-xs text-muted hover:text-ink disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <span className="ml-auto text-[0.65rem] text-muted">{index + 1}</span>
                      </div>
                    ) : null}

                    <div className="mt-3 flex items-center justify-between border-t border-sand/40 pt-2.5">
                      <button
                        onClick={() => {
                          setEditProduct(p);
                          setNewImagesData([]);
                          setImageStats(null);
                          setVideoPickerOpen(false);
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

        {/* 2. ВКЛАДКА РАЗДЕЛЫ КАТАЛОГА (ПОЛНЫЙ КОНСТРУКТОР РАЗДЕЛОВ) */}
        {tab === "categories" ? (
          <div className="mt-8 max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-medium text-ink">
                  Разделы каталога (блоки на главной и в каталоге)
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Вы можете добавлять новые направления (например, «Мастер-классы», «Картины»), менять названия и удалять ненужные.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditCategory({
                    title: "",
                    subtitle: "",
                    description: "",
                    order: categories.length + 1,
                  });
                  setNewCategoryCover(null);
                  setIsCategoryModalOpen(true);
                }}
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full btn-brown px-5 py-2.5 text-xs font-semibold uppercase tracking-wider shadow-md"
              >
                <span>+ Добавить новый раздел</span>
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.slug}
                  className="rounded-2xl border border-sand/60 bg-surface p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    {cat.cover?.src ? (
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-sand/40">
                        <Image src={cat.cover.src} alt="" fill sizes="64px" className="object-cover" />
                      </div>
                    ) : null}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base text-ink">{cat.title}</h3>
                        <span className="text-[0.65rem] tracking-wide text-muted bg-sand/40 px-2 py-0.5 rounded">
                          /{cat.slug}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-clay mt-0.5">{cat.subtitle}</p>
                      <p className="text-xs text-muted mt-1 leading-relaxed max-w-xl line-clamp-2">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => {
                        setEditCategory(cat);
                        setNewCategoryCover(null);
                        setIsCategoryModalOpen(true);
                      }}
                      className="rounded-full border border-sand px-4 py-1.5 text-xs font-medium text-btn-brown hover:bg-sand/30 transition-colors"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.slug, cat.title)}
                      className="rounded-full border border-sand px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* 2б. ВКЛАДКА ПОДРАЗДЕЛЫ */}
        {tab === "sections" ? (
          <div className="mt-8 max-w-4xl">
            <div>
              <h2 className="font-display text-lg font-medium text-ink">
                Подразделы каталога
              </h2>
              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted">
                Подраздел — это тема внутри раздела: «Свечи → Новый год». Порядок в
                этом списке — это порядок, в котором подразделы стоят на странице
                раздела. Подняли «Новый год» наверх — он встал первым; прошёл
                праздник — опустили вниз. Подраздел показывается только там, где
                есть отмеченные им изделия.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-sand/60 bg-surface p-4 shadow-sm">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                Новый подраздел
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={sectionTagTitle}
                  onChange={(e) => setSectionTagTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateSectionTag();
                    }
                  }}
                  placeholder="Например: Свадьба или Мужчинам в подарок"
                  className="flex-1 rounded-xl border border-sand bg-bg/50 px-4 py-2.5 text-xs text-ink placeholder:text-muted/50 focus:border-btn-brown focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCreateSectionTag}
                  disabled={creatingTag || sectionTagTitle.trim() === ""}
                  className="rounded-full btn-brown px-6 py-2.5 text-xs font-semibold uppercase tracking-wider shadow-md disabled:opacity-40"
                >
                  {creatingTag ? "Создаю..." : "+ Создать подраздел"}
                </button>
              </div>
              <p className="mt-1.5 text-[0.7rem] leading-relaxed text-muted">
                Он появится в списке ниже сразу, а в каталоге — когда вы отметите им
                хотя бы одно изделие. Отмечают на вкладке «Изделия», внутри карточки.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {tags.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-sand p-6 text-xs text-muted">
                  Подразделов пока нет. Новый заводится в карточке изделия — там же,
                  где отмечают темы.
                </p>
              ) : (
                tags.map((t, index) => {
                  const used = products.filter((p) => p.tags.includes(t.slug)).length;
                  const isEditing = editingTagSlug === t.slug;

                  return (
                    <div
                      key={t.slug}
                      {...tagDrag.itemProps(index)}
                      className={`flex flex-wrap items-center gap-3 rounded-2xl border border-sand/60 bg-surface px-4 py-3 shadow-sm cursor-grab active:cursor-grabbing transition-all ${tagDrag.itemClass(index)}`}
                    >
                      <span className="w-6 shrink-0 text-xs text-muted">{index + 1}</span>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveTag(index, index - 1)}
                          disabled={index === 0 || savingOrder}
                          aria-label="Поднять выше"
                          className="rounded-full px-2 py-1 text-xs text-muted hover:text-ink disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTag(index, index + 1)}
                          disabled={index === tags.length - 1 || savingOrder}
                          aria-label="Опустить ниже"
                          className="rounded-full px-2 py-1 text-xs text-muted hover:text-ink disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>

                      {isEditing ? (
                        <input
                          type="text"
                          autoFocus
                          value={editingTagTitle}
                          onChange={(e) => setEditingTagTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleRenameTag(t.slug);
                            }
                            if (e.key === "Escape") setEditingTagSlug(null);
                          }}
                          className="min-w-0 flex-1 rounded-xl border border-sand bg-bg/50 px-3 py-2 text-xs text-ink focus:border-btn-brown focus:outline-none"
                        />
                      ) : (
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                          {t.title}
                        </span>
                      )}

                      <span className="shrink-0 rounded-full bg-sand/40 px-2.5 py-0.5 text-[0.65rem] text-muted">
                        {used} изд.
                      </span>

                      {isEditing ? (
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRenameTag(t.slug)}
                            className="rounded-full btn-brown px-4 py-1.5 text-[0.7rem] font-semibold"
                          >
                            Сохранить
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTagSlug(null)}
                            className="text-[0.7rem] text-muted hover:text-ink"
                          >
                            Отмена
                          </button>
                        </div>
                      ) : (
                        <div className="flex shrink-0 items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTagSlug(t.slug);
                              setEditingTagTitle(t.title);
                            }}
                            className="text-[0.7rem] font-medium text-btn-brown hover:underline"
                          >
                            Переименовать
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTag(t.slug, t.title)}
                            className="text-[0.7rem] text-red-500 hover:text-red-700"
                          >
                            Удалить
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
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

              {/*
                Поле портрета. Раньше оно работало вслепую: не показывало, какое
                фото стоит сейчас, не предупреждало, что снимок уходит на главную,
                и не давало отменить выбранное. Заказчица вставила кадр «посмотреть
                что будет» — и он молча заменил её портрет на первом экране.
              */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Портретное фото автора
                </label>
                <p className="mb-3 text-xs leading-relaxed text-muted">
                  Это фото стоит на первом экране главной страницы и на странице
                  «Обо мне». Выбранный снимок встанет на сайт после кнопки
                  «Сохранить все тексты» внизу.
                </p>

                <div className="flex items-start gap-4">
                  <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl border border-sand bg-bg">
                    {newPortraitData?.base64 || siteData.portrait?.src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={newPortraitData?.base64 || siteData.portrait.src}
                        alt="Портрет автора"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[0.65rem] text-muted">
                        нет фото
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-ink">
                      {newPortraitData ? "Новое фото — ещё не сохранено" : "Сейчас на сайте"}
                    </span>
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
                    {newPortraitData ? (
                      <button
                        type="button"
                        onClick={() => setNewPortraitData(null)}
                        className="self-start text-xs font-semibold text-btn-brown hover:underline"
                      >
                        Убрать выбранное фото, оставить прежнее
                      </button>
                    ) : null}
                  </div>
                </div>
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

        {/* 3б. ВКЛАДКА ИЗБРАННОЕ */}
        {tab === "featured" ? (
          <div className="mt-8 max-w-3xl">
            <div>
              <h2 className="font-display text-lg font-medium text-ink">
                Избранное на главной странице
              </h2>
              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted">
                Лента изделий на главной: свой заголовок, своя подпись и свой состав.
                Пока ни одно изделие не выбрано, лента собирается сама — по одному
                изделию из каждого раздела. Как только выберете первое, лента станет
                показывать только выбранное, в том порядке, в каком вы его расставите.
              </p>
            </div>

            <form onSubmit={handleSaveTexts} className="mt-6 flex flex-col gap-4">
            {/* ЛЕНТА «ИЗБРАННОГО» НА ГЛАВНОЙ */}
            <div className="rounded-2xl border border-sand/60 bg-bg/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Лента избранного на главной
                </span>
                <label className="flex items-center gap-2 text-xs text-ink">
                  <input
                    type="checkbox"
                    checked={siteData.featured.enabled}
                    onChange={(e) =>
                      setSiteData({
                        ...siteData,
                        featured: { ...siteData.featured, enabled: e.target.checked },
                      })
                    }
                    className="h-4 w-4 accent-[color:var(--color-btn-brown,#7a5c50)]"
                  />
                  Показывать на сайте
                </label>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-muted">
                Название и подпись пишете сами: «Хиты продаж», «К Новому году» — что нужно.
                Изделия тоже выбираете сами, в том порядке, в котором они встанут в ленте.
                Если не выбрать ни одного, лента соберётся сама — по одному изделию из
                каждого раздела.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[0.7rem] font-semibold uppercase tracking-wider text-muted mb-1">
                    Надпись сверху
                  </label>
                  <input
                    type="text"
                    value={siteData.featured.eyebrow}
                    onChange={(e) =>
                      setSiteData({
                        ...siteData,
                        featured: { ...siteData.featured, eyebrow: e.target.value },
                      })
                    }
                    placeholder="Например: Избранное мастерской"
                    className="w-full rounded-xl border border-sand bg-surface px-3 py-2 text-xs text-ink focus:border-btn-brown focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[0.7rem] font-semibold uppercase tracking-wider text-muted mb-1">
                    Заголовок
                  </label>
                  <input
                    type="text"
                    value={siteData.featured.title}
                    onChange={(e) =>
                      setSiteData({
                        ...siteData,
                        featured: { ...siteData.featured, title: e.target.value },
                      })
                    }
                    placeholder="Например: Хиты продаж"
                    className="w-full rounded-xl border border-sand bg-surface px-3 py-2 text-xs text-ink focus:border-btn-brown focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-[0.7rem] font-semibold uppercase tracking-wider text-muted mb-1">
                  Подпись под заголовком
                </label>
                <input
                  type="text"
                  value={siteData.featured.subtitle}
                  onChange={(e) =>
                    setSiteData({
                      ...siteData,
                      featured: { ...siteData.featured, subtitle: e.target.value },
                    })
                  }
                  placeholder="Например: то, что чаще всего заказывают к празднику"
                  className="w-full rounded-xl border border-sand bg-surface px-3 py-2 text-xs text-ink focus:border-btn-brown focus:outline-none"
                />
              </div>

              <div className="mt-4">
                <span className="block text-[0.7rem] font-semibold uppercase tracking-wider text-muted mb-1.5">
                  Выбранные изделия ({siteData.featured.ids.length})
                </span>

                {siteData.featured.ids.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-sand px-3 py-2.5 text-xs text-muted">
                    Пока ничего не выбрано — на сайте лента собирается сама.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {siteData.featured.ids.map((id, index) => {
                      const item = products.find((p) => p.id === id);
                      return (
                        <div
                          key={id}
                          {...featuredDrag.itemProps(index)}
                          className={`flex items-center gap-2 rounded-xl border border-sand bg-surface px-3 py-2 cursor-grab active:cursor-grabbing transition-all ${featuredDrag.itemClass(index)}`}
                        >
                          <span className="text-[0.7rem] text-muted">{index + 1}</span>
                          <span className="flex-1 truncate text-xs text-ink">
                            {item ? `${item.title} · ${item.article}` : `Изделие удалено (${id})`}
                          </span>
                          <button
                            type="button"
                            onClick={() => moveFeatured(index, index - 1)}
                            disabled={index === 0}
                            aria-label="Выше"
                            className="rounded-full px-2 py-1 text-xs text-muted hover:text-ink disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveFeatured(index, index + 1)}
                            disabled={index === siteData.featured.ids.length - 1}
                            aria-label="Ниже"
                            className="rounded-full px-2 py-1 text-xs text-muted hover:text-ink disabled:opacity-30"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSiteData({
                                ...siteData,
                                featured: {
                                  ...siteData.featured,
                                  ids: siteData.featured.ids.filter((x) => x !== id),
                                },
                              })
                            }
                            aria-label="Убрать из ленты"
                            className="rounded-full px-2 py-1 text-xs text-muted hover:text-ink"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <input
                  type="text"
                  value={featuredSearch}
                  onChange={(e) => setFeaturedSearch(e.target.value)}
                  placeholder="Найти изделие по названию или артикулу..."
                  className="w-full rounded-xl border border-sand bg-surface px-3 py-2 text-xs text-ink placeholder:text-muted/50 focus:border-btn-brown focus:outline-none"
                />

                <div className="mt-2 flex max-h-56 flex-col gap-1 overflow-y-auto overscroll-contain rounded-xl border border-sand bg-surface p-2">
                  {featuredCandidates.length === 0 ? (
                    <p className="px-2 py-3 text-xs text-muted">Ничего не нашлось.</p>
                  ) : (
                    featuredCandidates.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          setSiteData({
                            ...siteData,
                            featured: {
                              ...siteData.featured,
                              ids: [...siteData.featured.ids, p.id],
                            },
                          })
                        }
                        className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-xs text-ink hover:bg-bg/60"
                      >
                        <span className="truncate">{p.title}</span>
                        <span className="flex-none text-[0.7rem] text-muted">{p.article}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
              <button
                type="submit"
                className="mt-2 rounded-full btn-brown py-3 text-xs font-semibold uppercase tracking-wider shadow-md"
              >
                Сохранить избранное →
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

            <p className="mt-6 text-[0.7rem] leading-relaxed text-muted">
              Порядок кадров здесь — это порядок на странице «Бэкстейдж».
              Возьмите кадр мышью и перетащите на нужное место; на телефоне — стрелками ↑ ↓.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {backstage.map((b, idx) => {
                const poster = b.kind === "image" ? b.image.src : b.poster.src;
                const mediaSrc = b.kind === "image" ? b.image.src : b.src;
                return (
                  <div
                    key={mediaSrc}
                    {...backstageDrag.itemProps(idx)}
                    className={`relative overflow-hidden rounded-2xl border border-sand/60 bg-surface p-2.5 shadow-sm cursor-grab active:cursor-grabbing transition-all ${backstageDrag.itemClass(idx)}`}
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-sand/30">
                      <Image
                        src={poster}
                        alt={b.caption}
                        fill
                        sizes="300px"
                        draggable={false}
                        className="object-cover"
                      />
                      {b.kind === "video" ? (
                        <span className="absolute top-2 left-2 rounded-full bg-ink/75 px-2 py-0.5 text-[0.6rem] font-semibold uppercase text-white backdrop-blur-sm">
                          Видео
                        </span>
                      ) : null}
                      <span className="absolute top-2 right-2 rounded-full bg-ink/75 px-2 py-0.5 text-[0.6rem] font-semibold text-white backdrop-blur-sm">
                        {idx + 1}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-ink line-clamp-1">{b.caption}</p>

                    <div className="mt-2 flex items-center justify-between border-t border-sand/40 pt-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveBackstage(idx, idx - 1)}
                          disabled={idx === 0 || savingOrder}
                          aria-label="Переставить раньше"
                          className="rounded-full px-2 py-1 text-xs text-muted hover:text-ink disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveBackstage(idx, idx + 1)}
                          disabled={idx === backstage.length - 1 || savingOrder}
                          aria-label="Переставить позже"
                          className="rounded-full px-2 py-1 text-xs text-muted hover:text-ink disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteBackstage(mediaSrc)}
                        type="button"
                        className="text-[0.7rem] text-red-500 hover:underline"
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
                  value={siteData.contacts.instagram || ""}
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

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Facebook (ссылка на профиль / страницу)
                </label>
                <input
                  type="text"
                  placeholder="https://facebook.com/..."
                  value={siteData.contacts.facebook || ""}
                  onChange={(e) =>
                    setSiteData({
                      ...siteData,
                      contacts: {
                        ...siteData.contacts,
                        facebook: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-xl border border-sand bg-bg/50 px-4 py-2.5 text-xs text-ink focus:border-btn-brown focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Email для связи
                </label>
                <input
                  type="email"
                  placeholder="anna@example.com"
                  value={siteData.contacts.email || ""}
                  onChange={(e) =>
                    setSiteData({
                      ...siteData,
                      contacts: {
                        ...siteData.contacts,
                        email: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-xl border border-sand bg-bg/50 px-4 py-2.5 text-xs text-ink focus:border-btn-brown focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Город / Локация
                </label>
                <input
                  type="text"
                  placeholder="Ереван, Армения"
                  value={siteData.contacts.city || ""}
                  onChange={(e) =>
                    setSiteData({
                      ...siteData,
                      contacts: {
                        ...siteData.contacts,
                        city: e.target.value,
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

      {/* МОДАЛЬНОЕ ОКНО ДОБАВЛЕНИЯ / РЕДАКТИРОВАНИЯ РАЗДЕЛА КАТАЛОГА */}
      {isCategoryModalOpen && editCategory ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90dvh] w-full max-w-xl flex-col rounded-3xl border border-sand bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-sand px-6 py-4 md:px-8">
              <h2 className="font-display text-xl text-ink">
                {editCategory.slug ? "Редактирование раздела" : "Новый раздел каталога"}
              </h2>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                type="button"
                className="rounded-full p-2 text-muted hover:bg-sand/30"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="flex min-h-0 flex-1 flex-col">
              <div
                data-lenis-prevent
                className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-6 py-6 md:px-8"
              >
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Название раздела *
                </label>
                <input
                  type="text"
                  value={editCategory.title || ""}
                  onChange={(e) => setEditCategory({ ...editCategory, title: e.target.value })}
                  placeholder="Например: Мастер-классы или Текстурные картины"
                  required
                  className="w-full rounded-xl border border-sand bg-bg/50 px-4 py-2.5 text-xs text-ink focus:border-btn-brown focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Краткий подзаголовок
                </label>
                <input
                  type="text"
                  value={editCategory.subtitle || ""}
                  onChange={(e) => setEditCategory({ ...editCategory, subtitle: e.target.value })}
                  placeholder="Например: Обучение и творческие встречи"
                  className="w-full rounded-xl border border-sand bg-bg/50 px-4 py-2.5 text-xs text-ink focus:border-btn-brown focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Подробное описание раздела
                </label>
                <textarea
                  rows={3}
                  value={editCategory.description || ""}
                  onChange={(e) =>
                    setEditCategory({ ...editCategory, description: e.target.value })
                  }
                  placeholder="Текст, который будет отображаться на главной под названием раздела..."
                  className="w-full rounded-xl border border-sand bg-bg/50 px-4 py-2.5 text-xs text-ink focus:border-btn-brown focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Обложка раздела (фотография с авто-сжатием)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const opt = await optimizeImageClient(file, 1400, 0.85);
                    setNewCategoryCover({
                      base64: opt.dataUrl,
                      width: opt.width,
                      height: opt.height,
                      blurDataURL: opt.blurDataURL,
                    });
                  }}
                  className="text-xs text-muted file:mr-3 file:rounded-full file:border-0 file:btn-brown file:px-4 file:py-2 file:text-xs file:font-semibold"
                />
              </div>

              </div>

              <div className="flex justify-end gap-3 border-t border-sand px-6 py-4 md:px-8">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="rounded-full border border-sand px-6 py-2.5 text-xs font-semibold text-muted hover:text-ink"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="rounded-full btn-brown px-8 py-2.5 text-xs font-semibold uppercase tracking-wider shadow-md"
                >
                  Сохранить раздел ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* МОДАЛЬНОЕ ОКНО ДОБАВЛЕНИЯ / РЕДАКТИРОВАНИЯ ТОВАРА */}
      {isModalOpen && editProduct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90dvh] w-full max-w-2xl flex-col rounded-3xl border border-sand bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-sand px-6 py-4 md:px-8">
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

            <form onSubmit={handleSaveProduct} className="flex min-h-0 flex-1 flex-col">
              <div
                data-lenis-prevent
                className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-6 py-6 md:px-8"
              >
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
                    value={editProduct.category || categories[0]?.slug || "candles"}
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                {/*
                  Адрес страницы. Название правится свободно и адрес за ним не
                  тянется — ссылку, которую заказчица кому-то отправила, менять
                  без спроса нельзя. Но если адрес и правда некрасивый, вот поле.
                */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                    Адрес страницы (в ссылке)
                  </label>
                  <input
                    type="text"
                    value={editProduct.slug || ""}
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]+/g, "-")
                          .replace(/-+/g, "-"),
                      })
                    }
                    placeholder="svecha-soty"
                    className="w-full rounded-xl border border-sand bg-bg/50 px-4 py-2.5 text-xs text-ink focus:border-btn-brown focus:outline-none"
                  />
                  <p className="mt-1 text-[0.7rem] leading-relaxed text-muted">
                    Латиницей. Название можно менять как угодно — адрес от этого не
                    меняется, старые ссылки продолжают работать. Меняйте его, только
                    если сам адрес вам не нравится.
                  </p>
                </div>
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

              {/* Выбор подразделов / тематики (теги) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                  Подразделы и темы (отметьте подходящие)
                </label>
                <div data-lenis-prevent className="flex flex-wrap gap-2 p-3 bg-bg/50 rounded-2xl border border-sand max-h-48 overflow-y-auto overscroll-contain">
                  {tags.map((t) => {
                    const isChecked = (editProduct.tags || []).includes(t.slug);
                    return (
                      <button
                        key={t.slug}
                        type="button"
                        onClick={() => {
                          const currentTags = editProduct.tags || [];
                          const nextTags = isChecked
                            ? currentTags.filter((s) => s !== t.slug)
                            : [...currentTags, t.slug];
                          setEditProduct({ ...editProduct, tags: nextTags });
                        }}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                          isChecked
                            ? "bg-btn-brown text-white shadow-sm scale-105"
                            : "bg-surface text-ink border border-sand hover:border-clay"
                        }`}
                      >
                        {isChecked ? "✓ " : "+ "}{t.title}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Новый подраздел заводится прямо отсюда */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                  Нет нужного подраздела? Создайте свой
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={newTagTitle}
                    onChange={(e) => setNewTagTitle(e.target.value)}
                    onKeyDown={(e) => {
                      // Enter внутри формы иначе сохранил бы изделие целиком.
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateTag();
                      }
                    }}
                    placeholder="Например: Свадьба или Мужчинам в подарок"
                    className="flex-1 rounded-xl border border-sand bg-bg/50 px-4 py-2.5 text-xs text-ink placeholder:text-muted/50 focus:border-btn-brown focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreateTag}
                    disabled={creatingTag || newTagTitle.trim() === ""}
                    className="rounded-full btn-brown px-6 py-2.5 text-xs font-semibold uppercase tracking-wider shadow-md disabled:opacity-40"
                  >
                    {creatingTag ? "Создаю..." : "+ Создать подраздел"}
                  </button>
                </div>
                <p className="mt-1.5 text-[0.7rem] leading-relaxed text-muted">
                  Подраздел появится на сайте вместе с этим изделием — внутри того
                  раздела каталога, к которому изделие относится. Пустых подразделов
                  в каталоге не бывает.
                </p>
              </div>


              {/* 5 характеристик изделия */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

                <div>
                  <label className="block text-[0.7rem] font-semibold uppercase tracking-wider text-muted mb-1">
                    Вес
                  </label>
                  <input
                    type="text"
                    value={editProduct.specs?.weight || ""}
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        specs: { ...(editProduct.specs || {}), weight: e.target.value },
                      })
                    }
                    placeholder="Например: 120 г"
                    className="w-full rounded-xl border border-sand bg-bg/50 px-3 py-2 text-xs text-ink focus:border-btn-brown focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[0.7rem] font-semibold uppercase tracking-wider text-muted mb-1">
                    Размеры
                  </label>
                  <input
                    type="text"
                    value={editProduct.specs?.size || ""}
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        specs: { ...(editProduct.specs || {}), size: e.target.value },
                      })
                    }
                    placeholder="Например: 8 × 8 × 10 см"
                    className="w-full rounded-xl border border-sand bg-bg/50 px-3 py-2 text-xs text-ink focus:border-btn-brown focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[0.7rem] font-semibold uppercase tracking-wider text-muted mb-1">
                    Время горения (для свечей)
                  </label>
                  <input
                    type="text"
                    value={editProduct.specs?.burnTime || ""}
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        specs: { ...(editProduct.specs || {}), burnTime: e.target.value },
                      })
                    }
                    placeholder="Например: до 35 часов"
                    className="w-full rounded-xl border border-sand bg-bg/50 px-3 py-2 text-xs text-ink focus:border-btn-brown focus:outline-none"
                  />
                </div>

              </div>

              <div className="rounded-2xl border border-dashed border-sand p-4 bg-bg/30">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  📷 Фотографии изделия (с авто-сжатием в WebP)
                </label>
                <p className="text-[0.7rem] text-muted mb-3">
                  Выбирайте фото любого веса, прямо с телефона или камеры — панель сама
                  сожмёт их без потери качества.
                </p>
                <p className="text-[0.7rem] leading-relaxed text-ink mb-3">
                  <strong className="font-semibold">✕ на снимке</strong> — убрать его.{" "}
                  <strong className="font-semibold">Возьмите снимок мышью и перетащите</strong>{" "}
                  на нужное место — так быстрее всего. На телефоне для этого{" "}
                  <strong className="font-semibold">стрелки ← → под снимком</strong>. Первый в
                  ряду помечен «Обложка»: именно он стоит в каталоге. Всё записывается
                  кнопкой «Сохранить изделие» внизу.
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

                {/*
                  Первое фото в ряду — обложка изделия в каталоге, поэтому
                  порядок здесь не косметика. Крестик убирает кадр, стрелки
                  двигают; всё это записывается кнопкой «Сохранить изделие».
                */}
                <div className="mt-3 flex flex-wrap gap-3">
                  {editProduct.images?.map((img, i) => (
                    <div
                      key={`${img.src}-${i}`}
                      {...imageDrag.itemProps(i)}
                      className={`w-20 cursor-grab active:cursor-grabbing rounded-lg transition-all ${imageDrag.itemClass(i)}`}
                    >
                      <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-sand">
                        <Image
                          src={img.src}
                          alt=""
                          fill
                          sizes="80px"
                          draggable={false}
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeProductImage(i)}
                          aria-label="Убрать фотографию"
                          className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink/75 text-[0.7rem] leading-none text-white backdrop-blur-sm hover:bg-red-600"
                        >
                          ✕
                        </button>
                        {i === 0 ? (
                          <span className="absolute bottom-0 left-0 right-0 bg-ink/70 px-1 py-0.5 text-center text-[0.5rem] font-semibold uppercase text-white">
                            Обложка
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveProductImage(i, i - 1)}
                          disabled={i === 0}
                          aria-label="Переставить левее"
                          className="rounded px-1.5 py-0.5 text-[0.7rem] text-muted hover:text-ink disabled:opacity-30"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => moveProductImage(i, i + 1)}
                          disabled={i === (editProduct.images?.length ?? 0) - 1}
                          aria-label="Переставить правее"
                          className="rounded px-1.5 py-0.5 text-[0.7rem] text-muted hover:text-ink disabled:opacity-30"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  ))}

                  {newImagesData.map((img, i) => (
                    <div key={i} className="w-20">
                      <div className="relative h-20 w-20 overflow-hidden rounded-lg border-2 border-btn-brown">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.base64} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setNewImagesData((prev) => prev.filter((_, idx) => idx !== i))
                          }
                          aria-label="Убрать новую фотографию"
                          className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink/75 text-[0.7rem] leading-none text-white backdrop-blur-sm hover:bg-red-600"
                        >
                          ✕
                        </button>
                        <span className="absolute bottom-0 left-0 right-0 bg-btn-brown px-1 py-0.5 text-center text-[0.5rem] font-semibold uppercase text-white">
                          Новое
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {(editProduct.images?.length ?? 0) + newImagesData.length === 0 ? (
                  <p className="mt-3 text-[0.7rem] text-red-500">
                    У изделия должна остаться хотя бы одна фотография.
                  </p>
                ) : null}
              </div>
              {/*
                Видео изделия. Съёмка процесса уже лежит в проекте, поэтому
                главный путь — выбрать готовый ролик, а не загружать заново:
                тяжёлый файл с телефона в запрос всё равно не помещается.
              */}
              <div className="rounded-2xl border border-dashed border-sand p-4 bg-bg/30">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  🎬 Видео изделия
                </label>

                <p className="mt-1 text-[0.7rem] leading-relaxed text-muted">
                  Роликов может быть несколько. Они встанут в ряду маленьких
                  фотографий после снимков — каждый с треугольником «плей» на
                  обложке, в том порядке, в каком стоят здесь. Порядок меняется
                  перетаскиванием мышью.
                </p>

                {editVideos.length > 0 ? (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {editVideos.map((v, i) => (
                      <div
                        key={`${v.kind === "file" ? v.src : v.id}-${i}`}
                        {...videoDrag.itemProps(i)}
                        className={`flex flex-wrap items-center gap-3 rounded-xl border border-sand bg-surface px-3 py-2.5 cursor-grab active:cursor-grabbing transition-all ${videoDrag.itemClass(i)}`}
                      >
                        <span className="w-4 shrink-0 text-[0.7rem] text-muted">{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-xs text-ink">
                          {v.kind === "file"
                            ? videoTitle(v.src)
                            : `Ролик ${v.kind === "youtube" ? "YouTube" : "Vimeo"}: ${v.id}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => moveVideo(i, i - 1)}
                          disabled={i === 0}
                          aria-label="Поднять выше"
                          className="rounded-full px-2 py-1 text-xs text-muted hover:text-ink disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveVideo(i, i + 1)}
                          disabled={i === editVideos.length - 1}
                          aria-label="Опустить ниже"
                          className="rounded-full px-2 py-1 text-xs text-muted hover:text-ink disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeVideo(i)}
                          className="shrink-0 text-[0.7rem] text-red-500 hover:underline"
                        >
                          Убрать
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-[0.7rem] text-muted">Видео пока не прикреплено.</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setVideoPickerOpen((open) => !open)}
                    className="rounded-full border border-sand bg-surface px-4 py-2 text-[0.7rem] font-semibold text-ink hover:bg-sand/30"
                  >
                    {videoPickerOpen ? "Свернуть список" : `Выбрать из моих роликов (${videoLibrary.length})`}
                  </button>

                  <label className="cursor-pointer rounded-full border border-sand bg-surface px-4 py-2 text-[0.7rem] font-semibold text-ink hover:bg-sand/30">
                    {uploadingVideo ? "Загружаю..." : "Загрузить короткий ролик"}
                    <input
                      type="file"
                      accept="video/mp4,video/*"
                      onChange={handleVideoFileChange}
                      disabled={uploadingVideo}
                      className="hidden"
                    />
                  </label>
                </div>

                {videoPickerOpen ? (
                  <div
                    data-lenis-prevent
                    className="mt-3 max-h-56 overflow-y-auto overscroll-contain rounded-xl border border-sand bg-surface"
                  >
                    {videoLibrary.length === 0 ? (
                      <p className="px-3 py-4 text-xs text-muted">Библиотека роликов пуста.</p>
                    ) : (
                      videoLibrary.map((v) => (
                        <button
                          key={v.src}
                          type="button"
                          onClick={() => attachVideo(v.src)}
                          className={`flex w-full items-center gap-3 border-b border-sand/40 px-3 py-2 text-left last:border-0 hover:bg-sand/20 ${
                            editVideos.some((x) => x.kind === "file" && x.src === v.src)
                              ? "bg-sand/30"
                              : ""
                          }`}
                        >
                          <span className="relative h-10 w-8 shrink-0 overflow-hidden rounded-md bg-sand/40">
                            {v.poster ? (
                              <Image src={v.poster} alt="" fill sizes="32px" className="object-cover" />
                            ) : null}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-xs text-ink">
                            {v.caption || v.name}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                ) : null}

                <div className="mt-3">
                  <label className="block text-[0.7rem] font-semibold uppercase tracking-wider text-muted mb-1">
                    Или добавить ссылкой на YouTube
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={videoLink}
                      onChange={(e) => setVideoLink(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="min-w-0 flex-1 rounded-xl border border-sand bg-bg/50 px-3 py-2 text-xs text-ink focus:border-btn-brown focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = videoLink.trim();
                        if (!val) return;
                        const match = val.match(
                          /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
                        );
                        setVideos([
                          ...editVideos,
                          match
                            ? { kind: "youtube", id: match[1], poster: videoPoster() }
                            : { kind: "file", src: val, poster: videoPoster() },
                        ]);
                        setVideoLink("");
                        showToast("✓ Видео прикреплено к изделию");
                      }}
                      className="shrink-0 rounded-full btn-brown px-4 py-2 text-[0.7rem] font-semibold"
                    >
                      Добавить
                    </button>
                  </div>
                  <p className="mt-1.5 text-[0.7rem] leading-relaxed text-muted">
                    Ролик с телефона обычно слишком тяжёлый, чтобы загрузить его прямо
                    отсюда. Выложите его на YouTube и вставьте ссылку — так он и
                    открываться у покупателей будет быстрее.
                  </p>
                </div>
              </div>


              {/*
                Блок «Похожие» внизу страницы изделия. Пока он пуст, соседи
                подбираются сами — по совпадению тем внутри раздела. Как только
                выбрано хотя бы одно, показывается ровно выбранное.
              */}
              <div className="rounded-2xl border border-dashed border-sand p-4 bg-bg/30">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  🔗 Похожие изделия (внизу страницы)
                </label>
                <p className="text-[0.7rem] leading-relaxed text-muted mb-3">
                  Пока ничего не выбрано, сайт подбирает соседей сам — по общим темам
                  внутри раздела. Выберете хоть одно — будет показывать только ваш
                  список и в вашем порядке.
                </p>

                {(editProduct.related || []).length === 0 ? (
                  <p className="rounded-xl border border-dashed border-sand px-3 py-2.5 text-xs text-muted">
                    Выбирает сайт.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {(editProduct.related || []).map((id, index) => {
                      const item = products.find((x) => x.id === id);
                      return (
                        <div
                          key={id}
                          {...relatedDrag.itemProps(index)}
                          className={`flex items-center gap-2 rounded-xl border border-sand bg-surface px-3 py-2 cursor-grab active:cursor-grabbing transition-all ${relatedDrag.itemClass(index)}`}
                        >
                          <span className="w-4 shrink-0 text-[0.7rem] text-muted">{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => moveRelated(index, index - 1)}
                            disabled={index === 0}
                            aria-label="Поднять выше"
                            className="rounded-full px-2 py-1 text-xs text-muted hover:text-ink disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveRelated(index, index + 1)}
                            disabled={index === (editProduct.related || []).length - 1}
                            aria-label="Опустить ниже"
                            className="rounded-full px-2 py-1 text-xs text-muted hover:text-ink disabled:opacity-30"
                          >
                            ↓
                          </button>
                          <span className="min-w-0 flex-1 truncate text-xs text-ink">
                            {item ? item.title : "Изделие удалено"}
                          </span>
                          <span className="shrink-0 text-[0.65rem] text-muted">{item?.article}</span>
                          <button
                            type="button"
                            onClick={() => removeRelated(id)}
                            aria-label="Убрать из похожих"
                            className="shrink-0 rounded-full px-2 py-1 text-xs text-muted hover:text-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <input
                  type="text"
                  value={relatedSearch}
                  onChange={(e) => setRelatedSearch(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter внутри формы иначе сохранил бы изделие целиком.
                    if (e.key === "Enter") e.preventDefault();
                  }}
                  placeholder="Найти изделие по названию или артикулу…"
                  className="mt-3 w-full rounded-xl border border-sand bg-surface px-3 py-2 text-xs text-ink placeholder:text-muted/50 focus:border-btn-brown focus:outline-none"
                />

                <div
                  data-lenis-prevent
                  className="mt-2 max-h-40 overflow-y-auto overscroll-contain rounded-xl border border-sand bg-surface"
                >
                  {relatedCandidates.length === 0 ? (
                    <p className="px-3 py-3 text-xs text-muted">Ничего не нашлось.</p>
                  ) : (
                    relatedCandidates.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addRelated(p.id)}
                        className="flex w-full items-center gap-2 border-b border-sand/40 px-3 py-2 text-left text-xs text-ink last:border-0 hover:bg-sand/20"
                      >
                        <span className="truncate">{p.title}</span>
                        <span className="ml-auto flex-none text-[0.7rem] text-muted">{p.article}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              </div>

              <div className="flex justify-end gap-3 border-t border-sand px-6 py-4 md:px-8">
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
