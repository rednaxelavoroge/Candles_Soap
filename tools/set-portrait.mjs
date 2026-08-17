/**
 * Ставит фотографию хозяйки на первый экран.
 *
 *   npm run portrait -- ~/Desktop/anna.jpg
 *   npm run portrait -- ./anna.jpg "Анна Манасарян со свечой в руках"
 *
 * Берёт любой файл откуда угодно, приводит его к тем же правилам, что и весь
 * каталог (WebP, длинная сторона не больше maxWidth, blur-плейсхолдер 16px,
 * поворот по EXIF), кладёт в public/portrait.webp и прописывает в site.json.
 *
 * Нужен отдельно от ingest, потому что портрет приходит не из папок со
 * съёмкой, а одним файлом в мессенджере: гонять ради него весь конвейер
 * и держать его в photo-plan.json незачем.
 *
 * Снять портрет обратно: npm run portrait -- --clear
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE_JSON = join(ROOT, "src", "data", "site.json");
const OUTPUT = join(ROOT, "public", "portrait.webp");

const config = JSON.parse(await readFile(join(ROOT, "tools", "sources.json"), "utf8"));
const site = JSON.parse(await readFile(SITE_JSON, "utf8"));

const [input, altArg] = process.argv.slice(2);

if (!input) {
  console.error("Укажите файл: npm run portrait -- <путь к фотографии>");
  process.exit(1);
}

if (input === "--clear") {
  site.portrait = null;
  await writeFile(SITE_JSON, `${JSON.stringify(site, null, 2)}\n`);
  console.log("Портрет снят: на первом экране снова кадры каталога.");
  process.exit(0);
}

const buffer = await readFile(resolve(process.cwd(), input));
const metadata = await sharp(buffer, { failOn: "none" }).metadata();

// Портрет вертикальный по построению: он встаёт в рамку 4/5 на первом экране.
// Горизонтальный кадр там обрежется по бокам, поэтому предупреждаем вслух.
if ((metadata.width ?? 0) > (metadata.height ?? 0)) {
  console.warn("⚠ Кадр горизонтальный. В рамке первого экрана его обрежет по бокам.");
}

await mkdir(dirname(OUTPUT), { recursive: true });

const info = await sharp(buffer, { failOn: "none" })
  .rotate()
  .resize({
    width: config.maxWidth,
    height: config.maxWidth,
    fit: "inside",
    withoutEnlargement: true,
  })
  .webp({ quality: config.webpQuality })
  .toFile(OUTPUT);

const blurBuffer = await sharp(buffer, { failOn: "none" })
  .rotate()
  .resize({ width: 16, height: 16, fit: "inside" })
  .webp({ quality: 40 })
  .toBuffer();

// Хвост в адресе меняется вместе с файлом: браузеры и Vercel кешируют
// картинки надолго, и без него заменённый портрет остался бы старым.
const version = createHash("sha1").update(await readFile(OUTPUT)).digest("hex").slice(0, 8);

site.portrait = {
  src: `/portrait.webp?v=${version}`,
  width: info.width,
  height: info.height,
  blurDataURL: `data:image/webp;base64,${blurBuffer.toString("base64")}`,
  alt: altArg || `${site.owner} со свечой в руках`,
};

await writeFile(SITE_JSON, `${JSON.stringify(site, null, 2)}\n`);

console.log(`✓ Портрет готов: ${info.width}×${info.height}, ${Math.round(info.size / 1024)} КБ`);
console.log("  Встал первым кадром на первом экране и в блоке «Обо мне».");
