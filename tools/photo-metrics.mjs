#!/usr/bin/env node
/**
 * Считает по оригиналам из sources.json → folders три вещи, которые нужны при
 * отборе кадров и которые не видно глазом за разумное время:
 *
 *   sharpness  — дисперсия лапласиана: чем меньше, тем мягче кадр. Значение
 *                сравнимо только внутри одной съёмки: тёмный фон без деталей
 *                занижает его у совершенно резкого снимка, поэтому это
 *                подсказка для сравнения соседних дублей, а не приговор.
 *   hash       — 64-битный dHash: расстояние Хэмминга 0 значит точный дубль,
 *                до ~8 — почти одинаковые кадры.
 *   portrait   — вертикальный ли кадр (нужно для портрета на первом экране).
 *
 * Запуск:  npm run metrics
 *
 * Результат — tools/.cache/metrics.json, он же кэш: посчитанные файлы при
 * повторном запуске пропускаются, прогресс пишется на диск по ходу дела.
 * Пересчитывать шесть гигабайт съёмки заново на каждый запуск слишком дорого,
 * а прерванный запуск не должен обнулять сделанное.
 */

import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_PATH = join(ROOT, "tools", ".cache", "metrics.json");

/** Как часто сбрасывать накопленное на диск. */
const FLUSH_EVERY = 25;

/** Размер стороны, до которого уменьшаем кадр перед подсчётом резкости. */
const ANALYSIS_SIZE = 320;

const IMAGE_EXTENSION = /\.(jpe?g|png|webp|avif)$/i;

async function main() {
  const config = JSON.parse(await readFile(join(ROOT, "tools", "sources.json"), "utf8"));
  const cache = await loadCache();
  const done = new Set(cache.map((entry) => entry.file));

  let processed = 0;
  let skipped = 0;

  for (const folder of config.folders ?? []) {
    const dir = resolve(ROOT, folder.dir);
    const files = await listImages(dir);
    console.log(`\n→ ${folder.dir}: файлов ${files.length}`);

    for (const name of files) {
      const key = `${folder.dir}/${name}`;
      if (done.has(key)) {
        skipped++;
        continue;
      }

      cache.push(await measure(join(dir, name), key, folder.category));
      done.add(key);
      processed++;

      if (processed % FLUSH_EVERY === 0) {
        await saveCache(cache);
        console.log(`  посчитано ${processed}, всего в кэше ${cache.length}`);
      }
    }
  }

  await saveCache(cache);
  console.log(`\nГотово. Новых: ${processed}, взято из кэша: ${skipped}, всего: ${cache.length}`);
  console.log(`Кэш: ${CACHE_PATH}`);
}

async function measure(path, key, category) {
  try {
    const source = sharp(path, { failOn: "none" });
    const metadata = await source.metadata();
    // Дальше работаем с уменьшенной копией: полноразмерный кадр с камеры
    // декодируется на порядок дольше, а на метрики это не влияет.
    const preview = await source.rotate().resize(1024, 1024, { fit: "inside" }).jpeg().toBuffer();

    return {
      file: key,
      category,
      width: metadata.width ?? null,
      height: metadata.height ?? null,
      portrait: (metadata.height ?? 0) > (metadata.width ?? 0),
      hash: await dhash(preview),
      sharpness: Math.round(await sharpness(preview)),
    };
  } catch (error) {
    return { file: key, category, error: error.message };
  }
}

/** 64 бита: в каждой строке сравниваем соседние пиксели сетки 9×8. */
async function dhash(buffer) {
  const raw = await sharp(buffer).greyscale().resize(9, 8, { fit: "fill" }).raw().toBuffer();

  let bits = "";
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      bits += raw[y * 9 + x] < raw[y * 9 + x + 1] ? "1" : "0";
    }
  }
  return BigInt(`0b${bits}`).toString(16).padStart(16, "0");
}

async function sharpness(buffer) {
  const { data, info } = await sharp(buffer)
    .greyscale()
    .resize(ANALYSIS_SIZE, ANALYSIS_SIZE, { fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  let sum = 0;
  let sumOfSquares = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const laplacian =
        4 * data[i] - data[i - 1] - data[i + 1] - data[i - width] - data[i + width];
      sum += laplacian;
      sumOfSquares += laplacian * laplacian;
      count++;
    }
  }

  const mean = sum / count;
  return sumOfSquares / count - mean * mean;
}

/** Файлы верхнего уровня: во вложенных папках лежат видео, они здесь ни к чему. */
async function listImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && IMAGE_EXTENSION.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

async function loadCache() {
  if (!existsSync(CACHE_PATH)) return [];
  try {
    return JSON.parse(await readFile(CACHE_PATH, "utf8"));
  } catch {
    // Битый кэш (например, запуск прервали посреди записи) — считаем заново.
    console.warn("Кэш метрик не читается, начинаем с нуля.");
    return [];
  }
}

async function saveCache(cache) {
  await mkdir(dirname(CACHE_PATH), { recursive: true });
  await writeFile(CACHE_PATH, `${JSON.stringify(cache)}\n`, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
