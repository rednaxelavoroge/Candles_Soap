#!/usr/bin/env node
/**
 * Готовит изображения каталога: приводит их к формату проекта и раскладывает
 * по категориям. Два источника, обработка у них общая.
 *
 *   --web    страницы старого сайта из tools/sources.json → pages
 *   --local  папки с оригиналами с камеры из tools/sources.json → folders
 *   (без флагов берутся оба источника, какие описаны в конфиге)
 *
 *   --write-content  перенести результат в src/data/*.json (только с планом)
 *
 * Запуск:  NODE_USE_ENV_PROXY=1 npm run ingest -- --web
 *          npm run ingest -- --local --write-content
 * (переменная окружения нужна только там, где исходящий трафик идёт через прокси)
 *
 * Что делает:
 *   1. Берёт исходники: HTML страниц (собирая ссылки из src, srcset и ленивых
 *      data-атрибутов — на галерейных страницах реальный файл почти всегда лежит
 *      именно там, а в src висит однопиксельная заглушка) либо файлы из папки.
 *   2. Сетевые файлы кэширует в tools/.cache (кэш переживает повторные запуски);
 *      локальные читает с диска как есть.
 *   3. Ужимает до 1600px по длинной стороне, конвертирует в WebP,
 *      снимает blur-плейсхолдер 16px и кладёт в public/catalog/<категория>/.
 *   4. Пишет tools/ingest-manifest.json: разбивка по товарам.
 *
 * Разбивка по товарам берётся из tools/photo-plan.json, если он есть: там для
 * каждого товара перечислены его ракурсы, потому что на глаз это видно, а по
 * порядку файлов — нет. Без плана изображения режутся подряд по groupSize,
 * чтобы было с чем работать дальше.
 *
 * Папка съёмки и раздел каталога — не одно и то же: подсвечники, шкатулки,
 * подносы и саше снимались вместе со свечами и гипсом. Поэтому у товара есть
 * необязательное поле source — из какой папки брать файлы; по умолчанию это
 * его же категория.
 *
 * Названия товаров скрипт не выдумывает: осмысленные русские названия
 * проставляются вручную в плане, когда изображения уже можно посмотреть.
 * Оригиналы в репозиторий не попадают — только обработанный public/catalog.
 */

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = join(ROOT, "tools", ".cache");
const OUTPUT_ROOT = join(ROOT, "public", "catalog");
const DATA_DIR = join(ROOT, "src", "data");
const PLAN_PATH = join(ROOT, "tools", "photo-plan.json");

/** Атрибуты, в которых галереи прячут настоящий путь к файлу. */
const URL_ATTRIBUTES = [
  "src",
  "data-src",
  "data-original",
  "data-lazy",
  "data-lazy-src",
  "data-echo",
  "data-image",
  "data-large",
  "data-full",
  "href",
];

const SRCSET_ATTRIBUTES = ["srcset", "data-srcset", "data-lazy-srcset"];

const IMAGE_EXTENSION = /\.(jpe?g|png|webp|avif)(\?|$)/i;

async function main() {
  const flags = new Set(process.argv.slice(2));
  const config = JSON.parse(await readFile(join(ROOT, "tools", "sources.json"), "utf8"));
  const plan = existsSync(PLAN_PATH) ? JSON.parse(await readFile(PLAN_PATH, "utf8")) : null;

  const bothSources = !flags.has("--web") && !flags.has("--local");
  const useWeb = bothSources || flags.has("--web");
  const useLocal = bothSources || flags.has("--local");

  const manifest = [];
  if (useWeb) manifest.push(...(await ingestWeb(config)));
  if (useLocal) manifest.push(...(await ingestLocal(config, plan)));

  const manifestPath = join(ROOT, "tools", "ingest-manifest.json");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const total = manifest.reduce((sum, entry) => sum + entry.products.length, 0);
  console.log(`\nГотово. Товаров: ${total}`);
  console.log(`Манифест: ${manifestPath}`);

  if (flags.has("--write-content")) {
    if (!plan) throw new Error("--write-content работает только с tools/photo-plan.json");
    await writeContent(manifest, plan, config);
  } else {
    console.log("Дальше: просмотреть изображения, задать названия и описания, перенести в src/data/products.json.");
  }
}

/* ── источник: страницы старого сайта ─────────────────────────────────────── */

async function ingestWeb(config) {
  const entries = [];

  for (const page of config.pages ?? []) {
    console.log(`\n→ ${page.url}  (категория: ${page.category})`);

    const html = await fetchText(page.url);
    const urls = extractImageUrls(html, page.url);
    console.log(`  найдено ссылок на изображения: ${urls.length}`);

    const images = [];
    for (const [index, url] of urls.entries()) {
      try {
        const buffer = await loadRemote(url);
        const hash = shortHash(url);
        const fileName = `${page.category}-${String(index + 1).padStart(3, "0")}-${hash}.webp`;
        const processed = await processBuffer(buffer, page.category, fileName, config);
        if (processed) images.push({ ...processed, sourceUrl: url });
      } catch (error) {
        console.warn(`  ✗ ${url}\n    ${error.message}`);
      }
    }

    console.log(`  обработано: ${images.length}`);
    entries.push({ category: page.category, products: groupIntoProducts(images, config.groupSize) });
  }

  return entries;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      // Часть галерей отдаёт другую разметку клиентам без внятного UA.
      "user-agent": "Mozilla/5.0 (compatible; content-migration/1.0)",
      "accept-language": "ru,en;q=0.8",
    },
  });
  if (!response.ok) throw new Error(`${url} → HTTP ${response.status}`);
  return response.text();
}

/** Достаёт кандидатов из тегов img/a/source и из inline background-image. */
export function extractImageUrls(html, baseUrl) {
  const found = new Set();

  const addCandidate = (value) => {
    if (!value) return;
    const trimmed = value.trim();
    if (!trimmed || trimmed.startsWith("data:")) return;
    if (!IMAGE_EXTENSION.test(trimmed)) return;
    try {
      found.add(new URL(trimmed, baseUrl).href);
    } catch {
      /* мусорный путь — пропускаем */
    }
  };

  for (const attribute of URL_ATTRIBUTES) {
    const pattern = new RegExp(`${attribute}\\s*=\\s*["']([^"']+)["']`, "gi");
    for (const match of html.matchAll(pattern)) addCandidate(match[1]);
  }

  for (const attribute of SRCSET_ATTRIBUTES) {
    const pattern = new RegExp(`${attribute}\\s*=\\s*["']([^"']+)["']`, "gi");
    for (const match of html.matchAll(pattern)) {
      // Из srcset берём все варианты: самый крупный отфильтруется по размеру ниже.
      for (const candidate of match[1].split(",")) {
        addCandidate(candidate.trim().split(/\s+/)[0]);
      }
    }
  }

  for (const match of html.matchAll(/background-image\s*:\s*url\((["']?)([^"')]+)\1\)/gi)) {
    addCandidate(match[2]);
  }

  return [...found];
}

async function loadRemote(url) {
  await mkdir(CACHE_DIR, { recursive: true });
  const cachePath = join(CACHE_DIR, shortHash(url));
  if (existsSync(cachePath)) return readFile(cachePath);

  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(cachePath, buffer);
  return buffer;
}

/* ── источник: локальные папки с оригиналами ──────────────────────────────── */

/**
 * Папки задаются в sources.json → folders и лежат вне репозитория: это
 * несколько гигабайт съёмки с камеры, версионируется только результат.
 * Вложенные папки не обходим — там лежат видео и прочее, не относящееся
 * к каталогу.
 */
async function ingestLocal(config, plan) {
  const entries = [];

  for (const folder of config.folders ?? []) {
    const dir = resolve(ROOT, folder.dir);
    console.log(`\n→ ${folder.dir}  (категория: ${folder.category})`);

    // План — источник истины: если он есть, папка без товаров в нём просто ещё
    // не разобрана. Вываливать её в каталог целиком нельзя, иначе один запуск
    // с частичным планом кладёт в public несколько сотен лишних файлов.
    if (plan) {
      const planned = plan.products.filter((product) => sourceOf(product) === folder.category);
      if (!planned.length) {
        console.log("  в плане нет товаров из этой папки — пропускаем");
        continue;
      }
      entries.push({
        source: folder.category,
        products: await ingestPlanned(dir, planned, config),
      });
      continue;
    }

    entries.push({
      source: folder.category,
      products: await ingestWholeFolder(dir, folder.category, config),
    });
  }

  return entries;
}

/** Папка съёмки, из которой берутся файлы товара. */
function sourceOf(product) {
  return product.source ?? product.category;
}

/**
 * Ракурсы товара перечислены в плане — имя файла собираем из слага. Раскладываем
 * по категории товара, а не по папке: из одной съёмки выходит несколько разделов.
 */
async function ingestPlanned(dir, planned, config) {
  const products = [];

  for (const product of planned) {
    const images = [];
    for (const [index, file] of product.files.entries()) {
      const fileName = `${product.slug}-${String(index + 1).padStart(2, "0")}.webp`;
      try {
        const buffer = await readFile(join(dir, file));
        const processed = await processBuffer(buffer, product.category, fileName, config);
        if (processed) images.push({ ...processed, alt: altFor(product, index), source: file });
        else console.warn(`  ✗ ${file}: меньше ${config.minSourceWidth}px`);
      } catch (error) {
        console.warn(`  ✗ ${file}\n    ${error.message}`);
      }
    }
    if (!images.length) throw new Error(`Товар «${product.slug}»: не осталось ни одного изображения`);
    products.push({ ...product, images });
  }

  console.log(`  товаров: ${products.length}, кадров: ${products.reduce((n, p) => n + p.images.length, 0)}`);
  return products;
}

/** Плана нет — обрабатываем папку целиком и режем подряд, как черновик. */
async function ingestWholeFolder(dir, category, config) {
  const files = await listImages(dir);
  console.log(`  найдено файлов: ${files.length}`);

  const images = [];
  for (const [index, file] of files.entries()) {
    try {
      const buffer = await readFile(join(dir, file));
      const fileName = `${category}-${String(index + 1).padStart(3, "0")}-${shortHash(file)}.webp`;
      const processed = await processBuffer(buffer, category, fileName, config);
      if (processed) images.push({ ...processed, source: file });
    } catch (error) {
      console.warn(`  ✗ ${file}\n    ${error.message}`);
    }
  }

  console.log(`  обработано: ${images.length}`);
  return groupIntoProducts(images, config.groupSize);
}

/** Файлы верхнего уровня, отсортированные натурально: candle-9 раньше candle-10. */
async function listImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && IMAGE_EXTENSION.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

/** Первый кадр описывает товар целиком, остальные — его ракурсы. */
function altFor(product, index) {
  if (product.alts?.[index]) return product.alts[index];
  return index === 0 ? product.title : `${product.title} — ракурс ${index + 1}`;
}

/* ── общая обработка ──────────────────────────────────────────────────────── */

async function processBuffer(buffer, category, fileName, config) {
  const metadata = await sharp(buffer, { failOn: "none" }).metadata();
  const longest = Math.max(metadata.width ?? 0, metadata.height ?? 0);

  // Иконки, логотипы и разделители в каталог не попадают.
  if (longest < config.minSourceWidth) return null;

  const outputDir = join(OUTPUT_ROOT, category);
  await mkdir(outputDir, { recursive: true });
  const outputPath = join(outputDir, fileName);

  // rotate() без аргументов применяет EXIF-ориентацию: снимки с телефона
  // иначе лежат на боку, потому что поворот у них живёт только в метаданных.
  const info = await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({
      width: config.maxWidth,
      height: config.maxWidth,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: config.webpQuality })
    .toFile(outputPath);

  const blurBuffer = await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({ width: 16, height: 16, fit: "inside" })
    .webp({ quality: 40 })
    .toBuffer();

  console.log(`  ✓ ${fileName}  ${info.width}×${info.height}`);

  return {
    src: `/catalog/${category}/${fileName}`,
    width: info.width,
    height: info.height,
    blurDataURL: `data:image/webp;base64,${blurBuffer.toString("base64")}`,
    alt: "",
  };
}

function shortHash(value) {
  return createHash("sha1").update(value).digest("hex").slice(0, 10);
}

/**
 * Черновая разбивка: на галерейных страницах ракурсы одного изделия идут
 * подряд, поэтому режем последовательность на группы по 3–5 штук. Хвост короче
 * трёх изображений приклеиваем к предыдущей группе, чтобы не рождать товар
 * с одним ракурсом.
 */
export function groupIntoProducts(images, groupSize = 4) {
  const groups = [];
  for (let index = 0; index < images.length; index += groupSize) {
    groups.push(images.slice(index, index + groupSize));
  }
  if (groups.length > 1 && groups.at(-1).length < 3) {
    const tail = groups.pop();
    groups.at(-1).push(...tail);
  }
  return groups.map((group, index) => ({
    draftId: `${index + 1}`,
    title: "",
    images: group,
  }));
}

/* ── перенос в контент ────────────────────────────────────────────────────── */

/**
 * Названия, описания, артикулы и теги уже написаны человеком в плане — здесь
 * остаётся механическая часть: разложить обработанные кадры по src/data/*.json.
 * Характеристики скрипт не выдумывает: их проставит заказчица. Цену не пишем
 * совсем — заказчица просила убрать цены с сайта, поле остаётся пустым.
 */
async function writeContent(manifest, plan, config) {
  const planned = manifest.flatMap((entry) => entry.products.filter((product) => product.slug));

  const products = planned.map((product) => ({
    id: `${product.category}-${product.slug}`,
    slug: product.slug,
    title: product.title,
    article: product.article,
    category: product.category,
    tags: product.tags ?? [],
    images: product.images.map(({ src, width, height, blurDataURL, alt }) => ({
      src,
      width,
      height,
      blurDataURL,
      alt,
    })),
    video: product.video ? { ...product.video, poster: posterFor(product) } : null,
    price: null,
    description: product.description,
    specs: product.specs ?? {},
  }));

  assertUnique(products, "article");
  assertUnique(products, "id");

  await writeJson(join(DATA_DIR, "products.json"), products);
  console.log(`\nsrc/data/products.json: ${products.length} товаров`);

  // Обложка категории — первый кадр товара, помеченного в плане как cover.
  // Категории вне плана обнуляются: их файлов в public/catalog нет, и оставить
  // на них ссылку значит получить битую картинку на главной.
  const covers = new Map();
  for (const product of planned) {
    if (product.cover) covers.set(product.category, product.images[0]);
  }
  const categories = JSON.parse(await readFile(join(DATA_DIR, "categories.json"), "utf8"));
  for (const category of categories) {
    const cover = covers.get(category.slug);
    category.cover = cover ? { ...imageOf(cover), alt: category.title } : null;
  }
  await writeJson(join(DATA_DIR, "categories.json"), categories);
  console.log(`src/data/categories.json: обложек ${covers.size}`);

  const site = JSON.parse(await readFile(join(DATA_DIR, "site.json"), "utf8"));
  if (plan.portrait) {
    const folder = config.folders.find((entry) => entry.category === plan.portrait.category);
    const buffer = await readFile(join(resolve(ROOT, folder.dir), plan.portrait.file));
    const image = await processBuffer(buffer, "portrait", "portrait.webp", config);
    site.portrait = { ...image, alt: plan.portrait.alt };
    console.log("src/data/site.json: портрет для первого экрана");
  } else {
    site.portrait = null;
  }
  await writeJson(join(DATA_DIR, "site.json"), site);
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

/**
 * Постер ролика — первый кадр товара: отдельного кадра под него не снимали.
 * Подпись при этом своя: под роликом она читается как описание видео, а не
 * фотографии, и повторять текст первого кадра здесь незачем.
 */
function posterFor(product) {
  return { ...imageOf(product.images[0]), alt: `${product.title} — короткий ролик` };
}

/** Поля изображения без служебных: в контент уходит только то, что описано схемой. */
function imageOf({ src, width, height, blurDataURL, alt }) {
  return { src, width, height, blurDataURL, alt };
}

/**
 * Артикул — то, по чему заказчица находит изделие в переписке, а id — ключ
 * маршрута. Повтор любого из них означает опечатку в плане, и заметить её
 * на собранном сайте почти невозможно: страницы просто дублируются.
 */
function assertUnique(products, field) {
  const seen = new Map();
  for (const product of products) {
    const previous = seen.get(product[field]);
    if (previous) {
      throw new Error(`Повтор ${field} «${product[field]}»: ${previous} и ${product.slug}`);
    }
    seen.set(product[field], product.slug);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
