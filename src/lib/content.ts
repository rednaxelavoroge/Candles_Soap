import backstageJson from "@/data/backstage.json";
import categoriesJson from "@/data/categories.json";
import productsJson from "@/data/products.json";
import siteJson from "@/data/site.json";
import tagsJson from "@/data/tags.json";
import {
  backstageItemSchema,
  categorySchema,
  productSchema,
  siteSchema,
  tagSchema,
  type BackstageItem,
  type Category,
  type Product,
  type Site,
  type Tag,
  type TagGroup,
} from "@/lib/schemas";
import { fillText, resolveText } from "@/lib/site-texts";
import { z } from "zod";

/**
 * Единственное место, где контент попадает в приложение. Компоненты импортируют
 * только функции отсюда, поэтому переход с JSON на REST — это правка этого файла.
 * Разбор происходит на этапе сборки: битые данные роняют билд, а не продакшен.
 */

function parse<T>(schema: z.ZodType<T>, data: unknown, source: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Некорректные данные в ${source}:\n${result.error.toString()}`);
  }
  return result.data;
}

const categories = parse(z.array(categorySchema), categoriesJson, "categories.json").sort(
  (a, b) => a.order - b.order,
);
const tags = parse(z.array(tagSchema), tagsJson, "tags.json");
const products = parse(z.array(productSchema), productsJson, "products.json");
const site = parse(siteSchema, siteJson, "site.json");
const backstage = parse(z.array(backstageItemSchema), backstageJson, "backstage.json");

const categorySlugs = new Set(categories.map((c) => c.slug));
const tagSlugs = new Set(tags.map((t) => t.slug));

for (const product of products) {
  if (!categorySlugs.has(product.category)) {
    throw new Error(`Товар «${product.slug}»: неизвестная категория «${product.category}»`);
  }
  const unknownTag = product.tags.find((tag) => !tagSlugs.has(tag));
  if (unknownTag) {
    throw new Error(`Товар «${product.slug}»: неизвестный тег «${unknownTag}»`);
  }
}

export function getBackstage(): BackstageItem[] {
  return backstage;
}

export function getSite(): Site {
  return site;
}

/**
 * Текст сайта по ключу из реестра src/lib/site-texts.ts: то, что заказчица
 * сохранила в панели, иначе исходный. Пустая строка — осмысленное
 * «не показывать», компонент в этом случае элемент не выводит.
 */
export function getText(key: string, values?: Record<string, string>): string {
  const text = resolveText(site.texts, key);
  return values ? fillText(text, values) : text;
}

export function getCategories(): Category[] {
  return categories;
}

export function getCategory(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}

/**
 * Категории, в которых уже есть изделия. Пустой раздел остаётся доступным по
 * прямой ссылке, но в сетки не попадает: плитка без обложки, ведущая в пустоту,
 * читается как недоделанный сайт, а не как «раздел пока не наполнен».
 */
export function getFilledCategories(): Category[] {
  return categories.filter((category) => getProductsByCategory(category.slug).length > 0);
}

export function getTags(): Tag[] {
  return tags;
}

export function getTagsByGroup(group: TagGroup): Tag[] {
  return tags.filter((tag) => tag.group === group);
}

export function getProducts(): Product[] {
  return products;
}

/**
 * Изделия категории в том порядке, в каком их расставила заказчица.
 *
 * `order` проставляется из панели и не обязан быть у всех сразу: у кого его
 * нет, тот держит своё место в конце, а не улетает в начало списка.
 */
export function getProductsByCategory(slug: string): Product[] {
  return products
    .filter((product) => product.category === slug)
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));
}

export function getProduct(category: string, slug: string): Product | undefined {
  return products.find((product) => product.category === category && product.slug === slug);
}

/**
 * Кадры для первого экрана. Отобраны вручную по одному признаку: тёмный фон,
 * по которому белая подпись читается на любом кадре смены. Порядок — это
 * порядок показа, поэтому список живёт кодом, а не выводится из каталога.
 */
const HERO_SLIDES = [
  "gypsum/serdtse-v-ladonyakh",
  "candles/tyulpany",
  "candles/soty",
  "gypsum/rakushka",
] as const;

export function getHeroSlides() {
  return HERO_SLIDES.map((reference) => {
    const [category, slug] = reference.split("/");
    return getProduct(category, slug)?.images[0];
  }).filter((image) => image !== undefined);
}

/** Первое изображение товара — обложка в сетках и в OpenGraph. */
/**
 * Ролики изделия одним списком.
 *
 * Раньше ролик был один, поле называлось `video`, и в данных оно так и лежит
 * у части изделий. Новые записи кладут ролики в `videos`. Здесь оба вида
 * приводятся к одному списку, чтобы страница не знала об этой разнице.
 */
export function productVideos(product: Product) {
  if (product.videos && product.videos.length > 0) return product.videos;
  return product.video ? [product.video] : [];
}

export function getCover(product: Product) {
  return product.images[0];
}

/**
 * Лента «Избранного» на главной: тексты и состав задаёт заказчица в админке.
 *
 * Пустой список изделий значит «не выбрано» — тогда лента собирается сама,
 * по одному изделию из каждой категории. Так на странице всегда что-то есть,
 * даже пока до выбора не дошли руки.
 */
export function getFeatured() {
  const settings = site.featured;
  const chosen = (settings?.ids ?? [])
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => product !== undefined);

  return {
    enabled: settings?.enabled ?? true,
    // Пустая надпись сверху — это выбор «не показывать её», а не «подставь
    // своё»: заказчица стёрла строчку в панели, значит на странице её быть
    // не должно.
    eyebrow: settings?.eyebrow ?? "Избранное мастерской",
    title: settings?.title || "Избранное",
    subtitle: settings?.subtitle || "",
    products: chosen.length > 0 ? chosen : getFeaturedProducts(10),
  };
}

/**
 * Витрина на главной. Берём по одному товару из каждой категории, затем
 * добираем до восьми — так лента не превращается в восемь одинаковых свечей.
 */
export function getFeaturedProducts(limit = 8): Product[] {
  const picked: Product[] = [];
  const seenCategories = new Set<string>();

  for (const product of products) {
    if (seenCategories.has(product.category)) continue;
    seenCategories.add(product.category);
    picked.push(product);
    if (picked.length === limit) return picked;
  }

  for (const product of products) {
    if (picked.includes(product)) continue;
    picked.push(product);
    if (picked.length === limit) break;
  }

  return picked;
}

/**
 * Теги, реально встречающиеся у товаров категории: показывать фильтр,
 * который ничего не находит, нельзя.
 */
export function getTagsForCategory(slug: string): Tag[] {
  const used = new Set(getProductsByCategory(slug).flatMap((product) => product.tags));
  return tags
    .filter((tag) => used.has(tag.slug))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

/**
 * Второй уровень каталога: Каталог → Разделы → Фотографии.
 *
 * Раздел — это тег в пределах одной категории: «Мыло → Морская тема». Отдельной
 * сущности под него нет намеренно, иначе одно и то же изделие пришлось бы
 * заводить дважды. Первым идёт раздел «Все изделия»: без него товар, которому
 * ещё не проставили тег, не был бы виден вообще ниоткуда.
 *
 * Обложка раздела — первый кадр первого его изделия. Своя обложка у раздела
 * появится, когда заказчица загрузит её через админку.
 */
export const ALL_SECTION = "vse";

export type Section = {
  slug: string;
  title: string;
  /** Описание подраздела из панели; у «Всех изделий» его нет. */
  description?: string;
  count: number;
  cover: Product["images"][number] | null;
};

export function getSectionsForCategory(categorySlug: string): Section[] {
  const inCategory = getProductsByCategory(categorySlug);
  if (inCategory.length === 0) return [];

  const sections: Section[] = [
    {
      slug: ALL_SECTION,
      title: getText("category.allSection"),
      count: inCategory.length,
      cover: inCategory[0].images[0] ?? null,
    },
  ];

  for (const tag of getTagsForCategory(categorySlug)) {
    const products = inCategory.filter((product) => product.tags.includes(tag.slug));
    sections.push({
      slug: tag.slug,
      title: tag.title,
      description: tag.description?.trim() || undefined,
      count: products.length,
      cover: products[0]?.images[0] ?? null,
    });
  }

  return sections;
}

export function getSection(categorySlug: string, sectionSlug: string): Section | undefined {
  return getSectionsForCategory(categorySlug).find((section) => section.slug === sectionSlug);
}

export function getProductsBySection(categorySlug: string, sectionSlug: string): Product[] {
  const inCategory = getProductsByCategory(categorySlug);
  if (sectionSlug === ALL_SECTION) return inCategory;
  return inCategory.filter((product) => product.tags.includes(sectionSlug));
}

/**
 * Похожие товары.
 *
 * Если заказчица выбрала их руками — показываем ровно её список и в её
 * порядке. Пустой список значит «подбери сам»: сначала по совпадению тем,
 * затем просто соседи по разделу.
 */
export function getRelatedProducts(product: Product, limit = 4): Product[] {
  const chosen = (product.related ?? [])
    .map((id) => products.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is Product => candidate !== undefined && candidate.id !== product.id);
  if (chosen.length > 0) return chosen.slice(0, limit);

  return getProductsByCategory(product.category)
    .filter((candidate) => candidate.id !== product.id)
    .map((candidate) => ({
      candidate,
      score: candidate.tags.filter((tag) => product.tags.includes(tag)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}
