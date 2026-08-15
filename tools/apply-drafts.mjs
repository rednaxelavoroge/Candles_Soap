#!/usr/bin/env node
/**
 * Переносит предварительные характеристики из tools/draft-content.json
 * в src/data/products.json, а с флагом --clear стирает их обратно.
 *
 *   npm run content:drafts        проставить
 *   npm run content:clear-drafts  стереть
 *
 * Значения в draft-content.json заказчицей не подтверждены: их придумал
 * разработчик, чтобы карточки на показе выглядели живыми. До выхода на
 * боевой домен каждую строку нужно заменить настоящей либо стереть.
 *
 * Цену скрипт не проставляет ни при каких условиях: заказчица просила убрать
 * цены с сайта совсем, поэтому price остаётся null. --clear на всякий случай
 * обнуляет и её — если цена откуда-то всё же взялась, это ошибка.
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTS = join(ROOT, "src", "data", "products.json");

const clear = process.argv.includes("--clear");
const products = JSON.parse(await readFile(PRODUCTS, "utf8"));
const drafts = JSON.parse(await readFile(join(ROOT, "tools", "draft-content.json"), "utf8"));

let touched = 0;
for (const product of products) {
  if (clear) {
    if (product.price !== null || Object.keys(product.specs).length > 0) touched++;
    product.price = null;
    product.specs = {};
    continue;
  }
  const draft = drafts.products[product.slug];
  if (!draft) continue;
  product.specs = draft.specs;
  touched++;
}

await writeFile(PRODUCTS, `${JSON.stringify(products, null, 2)}\n`, "utf8");
console.log(clear ? `Стёрто у ${touched} товаров.` : `Проставлено у ${touched} товаров.`);
