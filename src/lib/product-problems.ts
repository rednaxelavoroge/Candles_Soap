import { z } from "zod";
import { productSchema, type Product } from "@/lib/schemas";

/*
  Что здесь и зачем.

  Панель писала в products.json всё, что ей дали: проверялись только название,
  раздел и наличие фотографии. Остальное — описание, ссылка на ролик, подпись
  к кадру — уходило в репозиторий как есть. Схема productSchema строже, и
  падало это не в панели, а через минуту в сборке сайта: заказчица видела
  «Сохранено», ошибок не видела, а сайт тихо оставался вчерашним. 08.09.2026
  так пропало 52 минуты её работы: у изделия «Бенто торт» осталось пустым
  описание, и все сохранения после него не доезжали до сайта.

  Поэтому теперь панель проверяет изделие той же самой схемой, которой
  проверяет данные сборка, и отказывает сразу — словами, а не кодом ошибки.
  Одна схема на две проверки: разъехаться они не могут.
*/

/** Названия полей её словами: в тексте ошибки должно стоять то, что она видит в форме. */
const FIELD_TITLES: Record<string, string> = {
  title: "Название",
  slug: "Адрес страницы",
  article: "Артикул",
  category: "Раздел",
  tags: "Метки",
  images: "Фотографии",
  videos: "Ролики",
  video: "Ролик",
  price: "Цена",
  description: "Описание",
  specs: "Характеристики",
  tones: "Цвета акварели",
  related: "Похожие изделия",
  order: "Позиция в разделе",
  // Внутри фотографии и ролика.
  src: "Файл",
  id: "Ссылка",
  kind: "Вид ролика",
  poster: "Обложка",
  alt: "Подпись",
  width: "Ширина",
  height: "Высота",
  blurDataURL: "Заглушка размытия",
  size: "Размер",
  scent: "Аромат",
  composition: "Состав",
  burnTime: "Время горения",
  weight: "Вес",
};

/** Единственное число для списков: «Фотография 2», а не «Фотографии 2». */
const ITEM_TITLES: Record<string, string> = {
  images: "Фотография",
  videos: "Ролик",
  tags: "Метка",
  related: "Похожее изделие",
  tones: "Цвет акварели",
};

/**
 * Путь ошибки словами: ["videos", 0, "id"] → «Ролик 1 → Ссылка».
 * Числа в пути — это места в списке, и считать их надо с единицы: заказчица
 * не программист, нулевой фотографии для неё не существует.
 */
function pathTitle(path: ReadonlyArray<string | number>): string {
  const parts: string[] = [];

  for (let i = 0; i < path.length; i++) {
    const step = path[i];
    if (typeof step === "number") continue;

    const next = path[i + 1];
    if (typeof next === "number") {
      parts.push(`${ITEM_TITLES[step] ?? FIELD_TITLES[step] ?? step} ${next + 1}`);
    } else {
      parts.push(FIELD_TITLES[step] ?? step);
    }
  }

  return parts.length > 0 ? parts.join(" → ") : "Изделие";
}

/** Одна ошибка схемы — одной строкой, без слова «zod» и без кода. */
function issueText(issue: z.ZodIssue): string {
  const where = pathTitle(issue.path);

  // Поля нет вовсе или в нём null там, где ждут значение.
  if (issue.code === "invalid_type" && (issue.received === "undefined" || issue.received === "null")) {
    return `${where} — не заполнено`;
  }

  // Пустая строка там, где нужен хотя бы один символ: описание, ссылка, подпись.
  if (issue.code === "too_small" && issue.type === "string" && issue.minimum === 1) {
    return `${where} — не заполнено`;
  }

  // Пустой список там, где нужен хотя бы один пункт: изделие без фотографий.
  if (issue.code === "too_small" && issue.type === "array") {
    return `${where} — нужна хотя бы одна`;
  }

  // Ролик выбран, а вид не распознан: ни файл, ни YouTube, ни Vimeo.
  if (issue.code === "invalid_union_discriminator") {
    return `${where} — не выбран вид ролика`;
  }

  if (issue.code === "invalid_type") {
    return `${where} — заполнено не тем: ждали ${issue.expected}, получили ${issue.received}`;
  }

  return `${where} — ${issue.message}`;
}

/**
 * Что мешает изделию попасть на сайт. Пустой список — всё в порядке.
 *
 * Проверяет ровно productSchema, то есть ровно то, на чём падает сборка.
 * Повторы схлопываются: если у трёх кадров нет подписи, строк будет три,
 * но каждая назовёт свой кадр.
 */
export function productProblems(product: unknown): string[] {
  const result = productSchema.safeParse(product);
  if (result.success) return [];

  const seen = new Set<string>();
  for (const issue of result.error.issues) {
    seen.add(issueText(issue));
  }
  return [...seen];
}

/**
 * Текст отказа для панели: что именно не даёт сохранить это изделие.
 */
export function refusalText(title: string, problems: string[]): string {
  const name = title.trim() || "Изделие";
  return [
    `Изделие «${name}» не сохранено: без этого сайт не соберётся и не обновится.`,
    "",
    ...problems.map((problem) => `• ${problem}`),
    "",
    "Заполните и сохраните ещё раз.",
  ].join("\n");
}

/**
 * Предупреждение о чужих изделиях, которые держат сайт.
 *
 * Нужно потому, что сборка падает на первом же плохом изделии, кем бы оно ни
 * было заведено: можно безупречно сохранить одно, а сайт всё равно останется
 * вчерашним из-за соседа, заведённого полчаса назад. Пусть про это говорят
 * сразу, а не через сутки.
 */
export function otherBrokenText(products: Product[], savedId: string): string | undefined {
  const broken = products
    .filter((product) => product.id !== savedId)
    .map((product) => ({ product, problems: productProblems(product) }))
    .filter((entry) => entry.problems.length > 0);

  if (broken.length === 0) return undefined;

  return [
    "Сохранено, но сайт пока не обновится: не дозаполнены другие изделия.",
    "",
    ...broken.map(
      ({ product, problems }) =>
        `• «${product.title || product.slug || product.id}»: ${problems.join("; ")}`,
    ),
    "",
    "Откройте их и заполните — после этого обновится всё сразу.",
  ].join("\n");
}
