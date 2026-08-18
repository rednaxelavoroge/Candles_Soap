/**
 * Достаёт из обложки каждого изделия три тона для акварельных пятен вокруг
 * кадра.
 *
 *   npm run tones
 *
 * Заказчица прислала примеры картинками: у зефира пятна розовые, у тюльпанов
 * зелёно-сиреневые, у свечи в чёрной чаше серо-голубые. То есть цвет брызг
 * подобран под сам снимок, а не один на весь сайт. Считать его руками по
 * сотне изделий бессмысленно — берём прямо из пикселей.
 *
 * Как считается. Снимок ужимается до 24×24, почти белые и почти чёрные точки
 * выбрасываются (от них получается серая каша), остальные разбиваются на три
 * группы методом k-средних. Полученные тона приглушаются подмешиванием
 * песочного — на её примерах пятна пыльные, а не открытого цвета, и сайт
 * должен остаться в бежевой гамме.
 *
 * Результат кладётся в products.json полем tones. Прогон повторяемый:
 * начальные центры берутся по яркости, случайности нет.
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTS = join(ROOT, "src", "data", "products.json");

/** Песочный тон сайта: им приглушаются вытащенные из фотографии цвета. */
const SAND = [234, 223, 206];
/** Доля песочного в итоговом тоне. Больше — бледнее и ближе к гамме сайта. */
const MUTE = 0.3;

/**
 * Куда вытягивается яркость трёх тонов. Снимает почти всё снято на тёмном
 * фоне, и прямо взятые из пикселей цвета выходят тёмными и мутными — пятна
 * такого тона на бежевом фоне читались бы грязью. На её примерах акварель
 * пастельная, поэтому оттенок оставляем, а яркость поднимаем до светлой.
 */
const TARGET_LUMA = [236, 222, 206];

const luminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function kmeans(pixels, k = 3, iterations = 14) {
  // Начальные центры — по яркости, равномерно. Так прогон повторяем.
  const sorted = [...pixels].sort((a, b) => luminance(a) - luminance(b));
  let centers = Array.from({ length: k }, (_, i) =>
    sorted[Math.floor(((i + 0.5) / k) * (sorted.length - 1))].slice(),
  );

  for (let step = 0; step < iterations; step++) {
    const groups = Array.from({ length: k }, () => []);
    for (const p of pixels) {
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < k; i++) {
        const d =
          (p[0] - centers[i][0]) ** 2 + (p[1] - centers[i][1]) ** 2 + (p[2] - centers[i][2]) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      groups[best].push(p);
    }
    centers = centers.map((c, i) => {
      const g = groups[i];
      if (!g.length) return c;
      return [0, 1, 2].map((ch) => Math.round(g.reduce((s, p) => s + p[ch], 0) / g.length));
    });
  }

  // Крупные группы вперёд: первый тон должен быть основным.
  return centers;
}

const hex = ([r, g, b]) =>
  "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase();

/**
 * Поднимает цвет к заданной яркости, сохраняя его оттенок: канальные
 * отношения не трогаются, недостающее добирается подмешиванием белого.
 * Затем немного песочного — чтобы пятно село в гамму сайта.
 */
function pastel(c, target) {
  const l = luminance(c) || 1;
  // Сначала пропорциональное осветление, но не дальше упора в 255.
  const scale = Math.min(target / l, 255 / Math.max(...c, 1));
  const lifted = c.map((v) => v * scale);
  // Остаток яркости добираем белым: он гасит насыщенность, и цвет становится
  // пыльным, как на её примерах, вместо открытого.
  const gap = Math.max(0, target - luminance(lifted)) / 255;
  const washed = lifted.map((v) => v + (255 - v) * gap);
  return washed.map((v, i) => v * (1 - MUTE) + SAND[i] * MUTE);
}

async function tonesFor(src) {
  // src вида /catalog/candles/ledyanaya-kupel-01.webp
  const file = join(ROOT, "public", src.replace(/^\//, "").split("?")[0]);
  const { data, info } = await sharp(file)
    .resize(24, 24, { fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = [];
  for (let i = 0; i < data.length; i += info.channels) {
    const p = [data[i], data[i + 1], data[i + 2]];
    const l = luminance(p);
    // Почти белое и почти чёрное выбрасываем: фон съёмки и тени дают серую кашу.
    if (l < 26 || l > 238) continue;
    pixels.push(p);
  }
  if (pixels.length < 12) return null;

  // Тона идут от светлого к более плотному: первый — основная заливка,
  // последний — акцент помельче.
  return kmeans(pixels, 3).map((c, i) => hex(pastel(c, TARGET_LUMA[i])));
}

const products = JSON.parse(await readFile(PRODUCTS, "utf8"));
let done = 0;
let skipped = 0;

for (const product of products) {
  const cover = (product.images || []).find((i) => i.cover) || (product.images || [])[0];
  if (!cover) {
    skipped++;
    continue;
  }
  try {
    const tones = await tonesFor(cover.src);
    if (tones) {
      product.tones = tones;
      done++;
      console.log(`  ${product.article}  ${product.title}  →  ${tones.join(" ")}`);
    } else {
      skipped++;
    }
  } catch (error) {
    console.warn(`  ! ${product.title}: ${error.message}`);
    skipped++;
  }
}

await writeFile(PRODUCTS, `${JSON.stringify(products, null, 2)}\n`);
console.log(`\nГотово: тона у ${done} изделий, пропущено ${skipped}.`);
