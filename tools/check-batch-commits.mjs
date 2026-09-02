/**
 * Проверка главного правила панели: одно действие заказчицы — один коммит.
 *
 * Проверять это на выдуманном GitHub бессмысленно: половина поведения здесь —
 * его собственные отказы (ветка ушла вперёд, ответ пришёл из кеша). Поэтому
 * скрипт работает с настоящим репозиторием, но **никогда не с `main`**: он
 * заводит себе временную ветку, всё делает в ней и удаляет её за собой.
 *
 * Запуск:  npm run check:commits
 * Нужен доступ: переменная GITHUB_TOKEN, а если её нет — берётся `gh auth token`.
 */
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const REPO = process.env.GITHUB_REPO || "rednaxelavoroge/Candles_Soap";

const token =
  process.env.GITHUB_TOKEN ||
  process.env.GITHUB_PAT ||
  execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim();
if (!token) {
  console.error("Нет доступа к GitHub: задайте GITHUB_TOKEN или войдите через `gh auth login`.");
  process.exit(2);
}

const api = async (endpoint, init = {}) => {
  const res = await fetch(`https://api.github.com${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    // Без этого GitHub отвечает из кеша и показывает ветку такой, какой она
    // была секунду назад. Проверка на этом дважды соврала.
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${endpoint} → ${res.status} ${await res.text()}`);
  return res.json();
};

const branch = `test/commit-batching-${Date.now()}`;
if (branch === "main") throw new Error("немыслимо");

const workdir = mkdtempSync(path.join(tmpdir(), "candles-batch-"));
const outDir = path.join(workdir, "lib");
const sandbox = path.join(workdir, "sandbox");
mkdirSync(sandbox, { recursive: true });

console.log("Собираю модули хранилища…");
execFileSync(
  path.join(process.cwd(), "node_modules/.bin/tsc"),
  [
    "src/lib/github-commit.ts",
    "src/lib/data-storage.ts",
    "src/lib/site-media.ts",
    "--outDir", outDir,
    "--module", "commonjs",
    "--moduleResolution", "node",
    "--target", "es2022",
    "--esModuleInterop",
    "--skipLibCheck",
    "--types", "node",
  ],
  { stdio: "inherit" },
);

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok });
  console.log(`${ok ? "OK  " : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const frame = (n) => Buffer.from(`кадр ${n} ${"x".repeat(200)}`, "utf8");

const head = async () => (await api(`/repos/${REPO}/git/ref/heads/${branch}`)).object.sha;

/*
  Идём по родителям, а не через `/repos/…/commits`: список коммитов отстаёт
  на секунды и показывает ноль там, где коммит уже есть.

  Вершину ветки GitHub тоже отдаёт с задержкой — уже после того, как сам
  подтвердил коммит. Поэтому читаем, пока ответ не перестанет меняться: писать
  в ветку в этот момент некому, значит устоявшийся ответ и есть правда.
  Без этого проверка объявляет «коммитов: 0» там, где коммит лежит в ветке.
*/
const walk = async (from) => {
  const out = [];
  let cursor = await head();
  while (cursor && cursor !== from && out.length < 50) {
    const commit = await api(`/repos/${REPO}/git/commits/${cursor}`);
    out.push({ sha: cursor, message: commit.message });
    cursor = commit.parents[0]?.sha;
  }
  return out;
};

const commitsSince = async (from) => {
  let previous = await walk(from);
  for (let attempt = 0; attempt < 16; attempt++) {
    await wait(500);
    const current = await walk(from);
    if (current.length > 0 && current.length === previous.length) return current;
    previous = current;
  }
  return previous;
};
const filesOf = async (sha) =>
  (await api(`/repos/${REPO}/commits/${sha}`)).files.map((f) => f.filename).sort();
const readFile = async (file) => {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${file}?ref=${branch}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.raw" },
    cache: "no-store",
  });
  return res.ok ? res.text() : null;
};

const mainSha = (await api(`/repos/${REPO}/git/ref/heads/main`)).object.sha;
await api(`/repos/${REPO}/git/refs`, {
  method: "POST",
  body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: mainSha }),
});
console.log(`Временная ветка ${branch}\n`);

try {
  process.env.GITHUB_TOKEN = token;
  process.env.GITHUB_REPO = REPO;
  process.env.GITHUB_BRANCH = branch;
  process.env.COMMIT_BATCH_LINGER_MS = "800";
  process.env.COMMIT_BATCH_MAX_WAIT_MS = "5000";
  // Записи «рядом с приложением» должны уйти в песочницу, а не в рабочую копию.
  process.chdir(sandbox);

  const require = createRequire(path.join(outDir, "x.cjs"));
  const { saveJsonData, saveMediaFile, loadJsonData } = require(path.join(outDir, "data-storage.js"));
  const { commitFiles } = require(path.join(outDir, "github-commit.js"));
  const { writeToSite } = require(path.join(outDir, "site-media.js"));

  const stamp = Date.now();

  // А. Карточка с тремя фотографиями — один коммит, а не четыре.
  let base = await head();
  const images = [];
  for (let i = 1; i <= 3; i++) {
    images.push(await saveMediaFile(`catalog/candles/proba-${stamp}-${i}.webp`, frame(i)));
  }
  await saveJsonData("src/data/products.json", [{ id: `proba-${stamp}`, images }]);
  let made = await commitsSince(base);
  check("карточка с 3 фото = 1 коммит", made.length === 1, `коммитов: ${made.length}`);
  if (made.length === 1) {
    const files = await filesOf(made[0].sha);
    check("в коммите все 4 файла", files.length === 4 && files.includes("src/data/products.json"), files.join(", "));
    check(
      "сообщение про пачку",
      made[0].message.startsWith("Сохранение из панели: 3 файла медиа, src/data/products.json"),
      JSON.stringify(made[0].message.split("\n")[0]),
    );
    check("путь фотографии прежний", images[0] === `/catalog/candles/proba-${stamp}-1.webp`, images[0]);
  }

  // Б. Одиночная правка данных сохраняет прежнюю формулировку.
  base = await head();
  await saveJsonData("src/data/tags.json", [{ slug: `t-${stamp}` }]);
  made = await commitsSince(base);
  check(
    "одиночная правка = прежнее сообщение",
    made.length === 1 && made[0].message === "Обновление данных: src/data/tags.json",
    made.map((c) => c.message).join(" | "),
  );

  // В. Две правки подряд склеиваются в один коммит.
  base = await head();
  await Promise.all([
    saveJsonData("src/data/categories.json", [{ slug: `c-${stamp}` }]),
    (async () => {
      await wait(150);
      await saveJsonData("src/data/backstage.json", [{ kind: "image", caption: `b-${stamp}` }]);
    })(),
  ]);
  made = await commitsSince(base);
  check("две правки подряд = 1 коммит", made.length === 1, `коммитов: ${made.length}`);
  if (made.length === 1) {
    const files = await filesOf(made[0].sha);
    check(
      "обе правки внутри",
      files.includes("src/data/categories.json") && files.includes("src/data/backstage.json"),
      files.join(", "),
    );
  }

  // Г. Правки врозь не склеиваются и не теряют друг друга.
  base = await head();
  await saveJsonData("src/data/tags.json", [{ slug: `t2-${stamp}` }]);
  await wait(1500);
  await saveJsonData("src/data/tags.json", [{ slug: `t3-${stamp}` }]);
  made = await commitsSince(base);
  check("правки врозь = 2 коммита", made.length === 2, `коммитов: ${made.length}`);
  check("в ветке последняя правка", (await readFile("src/data/tags.json")).includes(`t3-${stamp}`));

  // Д. Ветка ушла вперёд, пока пачка ждала: чужая работа не затирается.
  const pending = saveJsonData("src/data/site.json", { owner: `o-${stamp}` });
  await commitFiles({
    token,
    repo: REPO,
    branch,
    files: [
      { path: "docs/proba-storonnaya.md", base64: Buffer.from(`чужая правка ${stamp}`).toString("base64") },
    ],
    message: "Чужая правка мимо панели",
  });
  await pending;
  check("чужой коммит уцелел", (await readFile("docs/proba-storonnaya.md"))?.includes(`чужая правка ${stamp}`));
  check("правка панели доехала", (await readFile("src/data/site.json"))?.includes(`o-${stamp}`));

  // Е. Два коммита разом: один получает отказ и переделывает попытку.
  // Считать коммиты здесь нельзя — ответ про вершину ветки приходит из кеша.
  // Смысл проверки в том, что ни один файл не потерян.
  await Promise.all([
    commitFiles({
      token, repo: REPO, branch,
      files: [{ path: "docs/proba-gonka-a.md", base64: Buffer.from(`гонка A ${stamp}`).toString("base64") }],
      message: "Гонка A",
    }),
    commitFiles({
      token, repo: REPO, branch,
      files: [{ path: "docs/proba-gonka-b.md", base64: Buffer.from(`гонка B ${stamp}`).toString("base64") }],
      message: "Гонка B",
    }),
  ]);
  check(
    "одновременные коммиты не теряются",
    (await readFile("docs/proba-gonka-a.md")) !== null && (await readFile("docs/proba-gonka-b.md")) !== null,
  );

  // Ж. Панель показывает только что сохранённое, не дожидаясь выкладки.
  const fresh = await loadJsonData("src/data/site.json", null);
  check("чтение отдаёт свежие данные", fresh?.owner === `o-${stamp}`);

  /*
    З. Панель рядом с сайтом: фотография пишется прямо в папку сайта и в
    репозиторий не попадает вовсе. В коммите обязан оказаться только
    products.json — иначе кадры продолжат ехать через git.
  */
  const fakeSite = path.join(workdir, "site");
  mkdirSync(path.join(fakeSite, "catalog"), { recursive: true });
  writeFileSync(path.join(fakeSite, "index.html"), "<!doctype html>");
  process.env.SITE_PUBLIC_DIR = fakeSite;
  try {
    base = await head();
    const local = [];
    for (let i = 1; i <= 2; i++) {
      local.push(await saveMediaFile(`catalog/candles/ryadom-${stamp}-${i}.webp`, frame(i)));
    }
    await saveJsonData("src/data/products.json", [{ id: `ryadom-${stamp}`, images: local }]);
    made = await commitsSince(base);
    check("рядом с сайтом: 1 коммит на сохранение", made.length === 1, `коммитов: ${made.length}`);
    if (made.length === 1) {
      const files = await filesOf(made[0].sha);
      check(
        "рядом с сайтом: фото в репозиторий не поехали",
        files.length === 1 && files[0] === "src/data/products.json",
        files.join(", "),
      );
    }
    check(
      "рядом с сайтом: файлы легли в папку сайта",
      existsSync(path.join(fakeSite, `catalog/candles/ryadom-${stamp}-1.webp`)) &&
        existsSync(path.join(fakeSite, `catalog/candles/ryadom-${stamp}-2.webp`)),
    );
    check("рядом с сайтом: адрес кадра прежний", local[0] === `/catalog/candles/ryadom-${stamp}-1.webp`, local[0]);

    /*
      И. За пределы папки сайта запись не выпускается. Проверяем сам writeToSite,
      а не saveMediaFile: у второго на такой случай есть запасной путь через
      репозиторий, и он бы утащил в коммит мусорный файл.
    */
    const escaped = writeToSite(`catalog/../../chuzhoe-${stamp}.webp`, frame(9));
    check(
      "выход за пределы папки сайта не разрешён",
      escaped === false && !existsSync(path.join(workdir, `chuzhoe-${stamp}.webp`)),
    );
  } finally {
    delete process.env.SITE_PUBLIC_DIR;
  }
} finally {
  await api(`/repos/${REPO}/git/refs/heads/${branch}`, { method: "DELETE" }).catch(() => {});
  console.log(`\nВременная ветка ${branch} удалена.`);
}

const failed = results.filter((r) => !r.ok);
console.log(`${results.length - failed.length}/${results.length} проверок прошло`);
process.exit(failed.length ? 1 : 0);
