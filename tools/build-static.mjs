/**
 * Собирает публичную часть сайта папкой готовых файлов (out/).
 *
 *   npm run build:static
 *
 * Зачем. На Vercel сайт в России грузится еле-еле — дело не в весе страницы
 * (она 0.37 МБ), а в маршруте до серверов Vercel. Лечится это только тем,
 * что людям сайт отдаётся с другой площадки. Статическую папку можно положить
 * куда угодно, хоть по FTP на обычный хостинг.
 *
 * Почему не обычный next build с output: export. В проекте есть админка
 * (/admin и /api/admin/*) — это серверные маршруты, и выгрузка на них падает.
 * Поэтому на время сборки они убираются из дерева и возвращаются обратно
 * в finally, что бы ни случилось.
 *
 * Админка при этом никуда не девается: она продолжает жить на Vercel, а
 * правки из неё коммитятся в GitHub. Публичная статика пересобирается
 * отдельно этой же командой.
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const STASH = join(ROOT, ".server-routes-stash");

/** Серверные части, которых не может быть в статической выгрузке. */
const SERVER_ONLY = [
  join("src", "app", "api"),
  join("src", "app", "admin"),
];

const moved = [];

function stash() {
  mkdirSync(STASH, { recursive: true });
  for (const rel of SERVER_ONLY) {
    const from = join(ROOT, rel);
    if (!existsSync(from)) continue;
    const to = join(STASH, rel.replace(/[\\/]/g, "__"));
    renameSync(from, to);
    moved.push([from, to]);
    console.log(`  убрано на время сборки: ${rel}`);
  }
}

function restore() {
  for (const [from, to] of moved.reverse()) {
    if (!existsSync(to)) continue;
    mkdirSync(dirname(from), { recursive: true });
    renameSync(to, from);
    console.log(`  возвращено: ${from.replace(ROOT + "/", "")}`);
  }
  rmSync(STASH, { recursive: true, force: true });
}

try {
  stash();
  console.log("\nСобираю публичную статику...\n");
  execSync("next build", {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, STATIC_EXPORT: "1" },
  });
} finally {
  console.log("");
  restore();
}

console.log("\nГотово. Папка out/ — весь публичный сайт обычными файлами.");
