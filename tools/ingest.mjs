#!/usr/bin/env node
/**
 * Забирает изображения со страниц старого сайта, приводит их к формату проекта
 * и раскладывает по категориям.
 *
 * Запуск:  NODE_USE_ENV_PROXY=1 npm run ingest
 * (переменная нужна только там, где исходящий трафик идёт через прокси)
 *
 * Что делает:
 *   1. Тянет HTML каждой страницы из tools/sources.json.
 *   2. Собирает ссылки на изображения из src, srcset и ленивых data-атрибутов —
 *      на галерейных страницах реальный файл почти всегда лежит именно там,
 *      а в src висит однопиксельная заглушка.
 *   3. Скачивает в tools/.cache (кэш переживает повторные запуски).
 *   4. Ужимает до 1600px по длинной стороне, конвертирует в WebP,
 *      снимает blur-плейсхолдер 16px и кладёт в public/catalog/<категория>/.
 *   5. Пишет tools/ingest-manifest.json: черновая разбивка по товарам,
 *      3–5 изображений на товар.
 *
 * Названия товаров скрипт не выдумывает: осмысленные русские названия
 * проставляются вручную по манифесту, когда изображения уже можно посмотреть.
 */

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = join(ROOT, "tools", ".cache");
const OUTPUT_ROOT = join(ROOT, "public", "catalog");

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
  const config = JSON.parse(await readFile(join(ROOT, "tools", "sources.json"), "utf8"));
  const manifest = [];

  for (const page of config.pages) {
    console.log(`\n→ ${page.url}  (категория: ${page.category})`);

    const html = await fetchText(page.url);
    const urls = extractImageUrls(html, page.url);
    console.log(`  найдено ссылок на изображения: ${urls.length}`);

    const images = [];
    for (const [index, url] of urls.entries()) {
      try {
        const processed = await processImage(url, page.category, index, config);
        if (processed) images.push(processed);
      } catch (error) {
        console.warn(`  ✗ ${url}\n    ${error.message}`);
      }
    }

    console.log(`  обработано: ${images.length}`);
    manifest.push({ category: page.category, products: groupIntoProducts(images, config.groupSize) });
  }

  const manifestPath = join(ROOT, "tools", "ingest-manifest.json");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const total = manifest.reduce((sum, entry) => sum + entry.products.length, 0);
  console.log(`\nГотово. Черновых товаров: ${total}`);
  console.log(`Манифест: ${manifestPath}`);
  console.log("Дальше: просмотреть изображения, задать названия и описания, перенести в src/data/products.json.");
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      // Часть галерей отдаёт другой разметку клиентам без внятного UA.
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

async function processImage(url, category, index, config) {
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 10);
  await mkdir(CACHE_DIR, { recursive: true });
  const cachePath = join(CACHE_DIR, hash);

  let buffer;
  if (existsSync(cachePath)) {
    buffer = await readFile(cachePath);
  } else {
    const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(cachePath, buffer);
  }

  const source = sharp(buffer, { failOn: "none" });
  const metadata = await source.metadata();
  const longest = Math.max(metadata.width ?? 0, metadata.height ?? 0);

  // Иконки, логотипы и разделители в каталог не попадают.
  if (longest < config.minSourceWidth) return null;

  const outputDir = join(OUTPUT_ROOT, category);
  await mkdir(outputDir, { recursive: true });

  const fileName = `${category}-${String(index + 1).padStart(3, "0")}-${hash}.webp`;
  const outputPath = join(outputDir, fileName);

  const info = await sharp(buffer, { failOn: "none" })
    .resize({
      width: config.maxWidth,
      height: config.maxWidth,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: config.webpQuality })
    .toFile(outputPath);

  const blurBuffer = await sharp(buffer, { failOn: "none" })
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
    sourceUrl: url,
  };
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
