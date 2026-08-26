/**
 * Скачивает шрифты к себе и генерирует CSS с локальными путями.
 *
 *   npm run fonts
 *
 * Зачем. В globals.css шрифты подключались через @import с серверов Google.
 * В России Google Fonts отвечает плохо, а такой @import блокирует отрисовку:
 * браузер грузит наш CSS, потом идёт к Google за вторым CSS, потом за самими
 * файлами. Цепочка обращений к тормозящей площадке — и страница «еле-еле»
 * даже там, где сам сайт лёгкий.
 *
 * После прогона шрифты лежат в public/fonts и отдаются с нашего же адреса.
 * Внешних зависимостей у страницы не остаётся.
 *
 * Файлы забираются один раз и коммитятся в репозиторий, поэтому сборке
 * больше не нужна сеть — это же чинит падения вида
 * «Failed to fetch Comfortaa from Google Fonts».
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "fonts");
const CSS_OUT = join(ROOT, "src", "app", "fonts.css");

/**
 * Один шрифт на весь сайт, как на annamanasaryan.com — так попросила
 * заказчица. Второе семейство здесь больше не нужно: каждое лишнее
 * начертание — лишние килобайты на первой же странице.
 */
const FAMILIES = ["Comfortaa:wght@300;400;500;600;700"];

// Современный user-agent нужен, чтобы Google отдал woff2, а не устаревшие форматы.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Только кириллица и латиница. Расширенные наборы (-ext) добавляют редкие
 * знаки европейских языков и вдвое увеличивают число файлов, а на русском
 * сайте не нужны.
 */
const WANTED_SUBSETS = new Set(["cyrillic", "latin"]);

const url = `https://fonts.googleapis.com/css2?family=${FAMILIES.join("&family=")}&display=swap`;
const css = await fetch(url, { headers: { "user-agent": UA } }).then((r) => {
  if (!r.ok) throw new Error(`Google Fonts ответил ${r.status}`);
  return r.text();
});

await mkdir(OUT_DIR, { recursive: true });

// Блоки идут с комментарием-подписью подмножества перед каждым @font-face.
const blocks = css.split("/*").slice(1);
const out = [];
let saved = 0;
let skipped = 0;

for (const raw of blocks) {
  const subset = raw.slice(0, raw.indexOf("*/")).trim();
  const body = raw.slice(raw.indexOf("*/") + 2);
  if (!WANTED_SUBSETS.has(subset)) {
    skipped++;
    continue;
  }

  const family = body.match(/font-family:\s*'([^']+)'/)?.[1];
  const weight = body.match(/font-weight:\s*(\d+)/)?.[1];
  const style = body.match(/font-style:\s*(\w+)/)?.[1] ?? "normal";
  const src = body.match(/url\((https:[^)]+)\)/)?.[1];
  const range = body.match(/unicode-range:\s*([^;]+);/)?.[1];
  if (!family || !weight || !src) continue;

  const name = `${family.toLowerCase().replace(/\s+/g, "-")}-${weight}-${subset}.woff2`;
  const bytes = Buffer.from(await fetch(src).then((r) => r.arrayBuffer()));
  await writeFile(join(OUT_DIR, name), bytes);
  saved++;

  out.push(
    `@font-face {
  font-family: "${family}";
  font-style: ${style};
  font-weight: ${weight};
  font-display: swap;
  src: url("/fonts/${name}") format("woff2");${range ? `\n  unicode-range: ${range};` : ""}
}`,
  );
}

const header = `/**
 * Шрифты, лежащие у нас же. Файл собран командой npm run fonts, руками
 * не правится.
 *
 * Раньше шрифты тянулись @import-ом с серверов Google. В России это заметно
 * тормозит и блокирует отрисовку, поэтому файлы забраны к себе: страница
 * больше никуда не ходит за шрифтами, а сборке не нужна сеть.
 */
`;

await writeFile(CSS_OUT, `${header}\n${out.join("\n\n")}\n`);
console.log(`Сохранено файлов: ${saved}, пропущено лишних подмножеств: ${skipped}`);
console.log(`CSS: src/app/fonts.css`);
