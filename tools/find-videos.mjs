#!/usr/bin/env node
/**
 * Ищет видео в папках с оригиналами и печатает отчёт: что нашлось, где лежит,
 * сколько весит. Ничего не обрабатывает и не копирует — только смотрит.
 *
 *   npm run find-videos
 *
 * Нужен потому, что ingest и metrics видео не видят: они фильтруют файлы по
 * расширениям изображений и не заходят во вложенные папки. Ролики при этом
 * на диске есть.
 */

import { readdir, stat } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const VIDEO_EXTENSION = /\.(mov|mp4|m4v|avi|mkv|webm|hevc|3gp)$/i;

/** Обходим рекурсивно: ролики часто лежат отдельной вложенной папкой. */
async function walk(dir, found = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    console.warn(`  не открылась папка ${dir}: ${error.message}`);
    return found;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, found);
    } else if (VIDEO_EXTENSION.test(entry.name)) {
      const info = await stat(full);
      found.push({ path: full, size: info.size });
    }
  }

  return found;
}

function mb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

const config = JSON.parse(await readFile(join(ROOT, "tools", "sources.json"), "utf8"));
let total = 0;
let totalBytes = 0;

for (const folder of config.folders ?? []) {
  const dir = resolve(ROOT, folder.dir);
  console.log(`\n→ ${folder.dir}  (категория: ${folder.category})`);

  const found = (await walk(dir)).sort((a, b) => b.size - a.size);
  if (found.length === 0) {
    console.log("  видео не найдено");
    continue;
  }

  const bytes = found.reduce((sum, file) => sum + file.size, 0);
  total += found.length;
  totalBytes += bytes;

  console.log(`  роликов: ${found.length}, суммарно ${mb(bytes)}`);
  const byExtension = new Map();
  for (const file of found) {
    const key = extname(file.path).toLowerCase();
    byExtension.set(key, (byExtension.get(key) ?? 0) + 1);
  }
  console.log(`  форматы: ${[...byExtension].map(([k, v]) => `${k} × ${v}`).join(", ")}`);

  console.log("  самые тяжёлые:");
  for (const file of found.slice(0, 8)) {
    console.log(`    ${mb(file.size).padStart(9)}  ${relative(dir, file.path)}`);
  }
}

console.log(`\nВсего роликов: ${total}, суммарно ${mb(totalBytes)}`);
if (total > 0) {
  console.log(
    "\nВ репозиторий их класть не нужно. Короткие — сжать и положить в public,\n" +
      "остальные залить на YouTube и вставить id: карточка товара это уже умеет.",
  );
}
