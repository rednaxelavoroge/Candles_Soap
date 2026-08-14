import categoriesJson from "@/data/categories.json";
import productsJson from "@/data/products.json";
import siteJson from "@/data/site.json";
import tagsJson from "@/data/tags.json";
import {
  categorySchema,
  productSchema,
  siteSchema,
  tagSchema,
  type Category,
  type Product,
  type Site,
  type Tag,
  type TagGroup,
} from "@/lib/schemas";
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

export function getSite(): Site {
  return site;
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

export function getProductsByCategory(slug: string): Product[] {
  return products.filter((product) => product.category === slug);
}

export function getProduct(category: string, slug: string): Product | undefined {
  return products.find((product) => product.category === category && product.slug === slug);
}

/** Первое изображение товара — обложка в сетках и в OpenGraph. */
export function getCover(product: Product) {
  return product.images[0];
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
  return tags.filter((tag) => used.has(tag.slug));
}

/** Похожие товары: сначала по совпадению тегов, затем просто соседи по категории. */
export function getRelatedProducts(product: Product, limit = 4): Product[] {
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
