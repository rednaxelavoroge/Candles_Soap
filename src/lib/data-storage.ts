import fs from "fs";
import path from "path";
import { commitFiles, type CommitFile } from "./github-commit";
import { writeToSite } from "./site-media";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
const GITHUB_REPO = process.env.GITHUB_REPO || "rednaxelavoroge/Candles_Soap";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

/**
 * Свежесохранённое состояние в памяти процесса.
 *
 * Между коммитом в GitHub и готовым деплоем проходит несколько минут, и всё это
 * время сборка отдаёт старые данные. Панель обязана показывать то, что в ней
 * только что нажали, поэтому последняя запись живёт здесь и перекрывает чтение.
 */
const justWritten = new Map<string, { data: unknown; at: number }>();
const JUST_WRITTEN_TTL = 10 * 60 * 1000;

/**
 * Текущее состояние файла данных — не то, что было на момент сборки.
 *
 * Из-за статических импортов в src/lib/content.ts панель раньше читала снимок
 * сборки: удалишь кадр, сохранишь — и следующая правка приходила поверх старого
 * списка, возвращая удалённое обратно. Источник правды — репозиторий, поэтому
 * админские роуты читают отсюда, а `fallback` (данные сборки) остаётся на
 * случай, когда GitHub недоступен.
 */
export async function loadJsonData<T>(relativePath: string, fallback: T): Promise<T> {
  const fresh = justWritten.get(relativePath);
  if (fresh && Date.now() - fresh.at < JUST_WRITTEN_TTL) {
    return fresh.data as T;
  }

  if (GITHUB_TOKEN) {
    try {
      const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${relativePath}?ref=${GITHUB_BRANCH}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.raw",
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
      });
      if (res.ok) {
        return JSON.parse(await res.text()) as T;
      }
      console.error(`GitHub read failed for ${relativePath}: ${res.status}`);
    } catch (err) {
      console.error(`GitHub read error for ${relativePath}:`, err);
    }
  }

  // Локальная разработка: файл на диске свежее, чем импортированный модуль.
  try {
    const fullPath = path.join(process.cwd(), relativePath);
    if (fs.existsSync(fullPath)) {
      return JSON.parse(fs.readFileSync(fullPath, "utf-8")) as T;
    }
  } catch (err) {
    console.error(`Local read error for ${relativePath}:`, err);
  }

  return fallback;
}

/* ------------------------------------------------------------------ *
 * Пачка правок: одно действие заказчицы — один коммит                  *
 * ------------------------------------------------------------------ */

/**
 * Одна правка в панели — один коммит, а значит одна выкладка.
 *
 * Раньше каждый файл уезжал отдельно: сохранение карточки с шестью
 * фотографиями давало семь коммитов и семь выкладок. Вечером 02.09.2026 этого
 * хватило, чтобы выбрать суточный предел бесплатного тарифа Vercel — сто
 * выкладок на весь аккаунт — и остановить заодно другие проекты.
 *
 * Теперь фотографии не уезжают сразу: они копятся здесь и уходят вместе с
 * `products.json` одним коммитом. Пачка держится открытой ещё короткое время
 * после последней записи — правки, идущие подряд, склеиваются в один коммит.
 * Тот, кто сохраняет данные, дожидается этой отправки: отказ GitHub обязан
 * дойти до заказчицы сообщением об ошибке, а не потеряться в фоне.
 */
type PendingFile = CommitFile & {
  /** Сообщение коммита, если файл в пачке окажется единственным. */
  label: string;
  kind: "data" | "media";
};

/**
 * Есть ли такой файл в репозитории прямо сейчас.
 *
 * Нужно перед удалением: убрать файл — это запись в дереве коммита с пустым
 * адресом содержимого, и GitHub отвергает **весь** коммит, если такого пути
 * в дереве нет. То есть одна лишняя строка в списке на удаление уронила бы
 * заодно и сохранение данных, которое едет тем же коммитом.
 */
export async function existsInRepo(relativePath: string): Promise<boolean> {
  if (!GITHUB_TOKEN) return false;
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${relativePath}?ref=${GITHUB_BRANCH}`;
    const res = await fetch(url, {
      method: "HEAD",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    });
    return res.ok;
  } catch (err) {
    console.error(`GitHub exists check failed for ${relativePath}:`, err);
    return false;
  }
}

type Batch = {
  files: Map<string, PendingFile>;
  openedAt: number;
  timer: ReturnType<typeof setTimeout> | null;
  /** Дожидается отправки пачки; отказ приходит сюда же. */
  settled: Promise<void>;
  resolve: () => void;
  reject: (err: unknown) => void;
};

function envMs(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

/** Сколько ждём следующую правку, прежде чем отправить пачку. */
const LINGER_MS = envMs("COMMIT_BATCH_LINGER_MS", 1200);
/** Предел ожидания для первой правки в пачке — чтобы сохранение не зависало. */
const MAX_WAIT_MS = envMs("COMMIT_BATCH_MAX_WAIT_MS", 8000);

let openBatch: Batch | null = null;
/** Коммиты идут по очереди: два одновременных перевода ветки мешают друг другу. */
let queue: Promise<unknown> = Promise.resolve();

function openNewBatch(): Batch {
  let resolve!: () => void;
  let reject!: (err: unknown) => void;
  const settled = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  // Фотографию кладут и идут дальше, не дожидаясь пачки. Без этой заглушки
  // отказ GitHub стал бы необработанным отказом промиса и уронил бы процесс.
  settled.catch(() => undefined);

  const batch: Batch = {
    files: new Map(),
    openedAt: Date.now(),
    timer: null,
    settled,
    resolve,
    reject,
  };
  openBatch = batch;
  return batch;
}

function arm(batch: Batch): void {
  if (batch.timer) clearTimeout(batch.timer);
  const deadline = batch.openedAt + MAX_WAIT_MS;
  const delay = Math.max(0, Math.min(LINGER_MS, deadline - Date.now()));
  batch.timer = setTimeout(() => void flush(batch), delay);
}

function enqueue(file: PendingFile): Promise<void> {
  const batch = openBatch ?? openNewBatch();
  batch.files.set(file.path, file);
  arm(batch);
  return batch.settled;
}

/** Русское склонение для сообщения коммита: 1 файл, 2 файла, 5 файлов. */
function pluralFiles(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "файл";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "файла";
  return "файлов";
}

/**
 * Сообщение коммита. Одиночная правка сохраняет прежнюю формулировку —
 * по ней в истории репозитория узнаётся работа заказчицы.
 */
function composeMessage(files: PendingFile[]): string {
  if (files.length === 1) return files[0].label;

  const media = files.filter((file) => file.kind === "media").length;
  const parts: string[] = [];
  if (media > 0) parts.push(`${media} ${pluralFiles(media)} медиа`);
  for (const file of files) {
    if (file.kind === "data") parts.push(file.path);
  }

  return `Сохранение из панели: ${parts.join(", ")}\n\n${files.map((f) => f.path).join("\n")}`;
}

async function flush(batch: Batch): Promise<void> {
  if (batch.timer) {
    clearTimeout(batch.timer);
    batch.timer = null;
  }
  if (openBatch === batch) openBatch = null;

  const files = [...batch.files.values()];
  if (files.length === 0 || !GITHUB_TOKEN) {
    batch.resolve();
    return;
  }

  const sent = queue.catch(() => undefined).then(() =>
    commitFiles({
      token: GITHUB_TOKEN,
      repo: GITHUB_REPO,
      branch: GITHUB_BRANCH,
      files: files.map(({ path: filePath, base64 }) => ({ path: filePath, base64 })),
      message: composeMessage(files),
    }),
  );
  queue = sent.catch(() => undefined);

  try {
    await sent;
    batch.resolve();
  } catch (err) {
    console.error("GitHub commit error:", err);
    batch.reject(err);
  }
}

/** Запись рядом с приложением: в разработке файл на диске и есть источник. */
function writeLocal(relativePath: string, contents: Buffer | string): void {
  try {
    const fullPath = path.join(process.cwd(), relativePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, contents);
  } catch {
    // На хостинге и в serverless папка только для чтения — данные уедут в GitHub.
  }
}

/**
 * Сохраняет JSON-файл на диск и — вместе со всей пачкой — в репозиторий.
 *
 * Дожидается отправки: вызывающий роут отвечает заказчице только тогда, когда
 * правка действительно легла в ветку.
 */
export async function saveJsonData(relativePath: string, data: unknown): Promise<void> {
  const contentStr = JSON.stringify(data, null, 2);
  writeLocal(relativePath, contentStr);

  if (!GITHUB_TOKEN) {
    justWritten.set(relativePath, { data, at: Date.now() });
    return;
  }

  /*
    Свежие данные кладём до отправки, а не после. Пачка держится открытой
    секунду-другую, и всё это время соседний запрос читал бы из репозитория
    старый список — а потом сохранил бы его поверх этой правки. При отказе
    GitHub запись возвращается назад: показывать несохранённое как сохранённое
    нельзя.
  */
  const previous = justWritten.get(relativePath);
  justWritten.set(relativePath, { data, at: Date.now() });

  try {
    await enqueue({
      path: relativePath,
      base64: Buffer.from(contentStr).toString("base64"),
      label: `Обновление данных: ${relativePath}`,
      kind: "data",
    });
  } catch (err) {
    if (previous) {
      justWritten.set(relativePath, previous);
    } else {
      justWritten.delete(relativePath);
    }
    throw err;
  }
}

/**
 * Убирает файлы из репозитория — тем же коммитом, что и правка данных рядом.
 *
 * Зачем отдельная дверь: `saveJsonData` умеет только класть. Пока удаления не
 * было, ролик, убранный из панели, оставался в `public/catalog/video` навсегда
 * и возвращался в список при следующем чтении папки — то есть «удаление»
 * было бы обманом.
 *
 * Путей, которых в репозитории нет, здесь быть не должно: их отсеивает
 * `existsInRepo`, иначе GitHub отвергнет весь коммит целиком.
 */
export async function deleteRepoFiles(relativePaths: string[], label: string): Promise<string[]> {
  const paths = relativePaths.filter(Boolean);
  if (paths.length === 0) return [];

  for (const relativePath of paths) {
    // Локальная разработка: файл на диске рядом.
    try {
      fs.rmSync(path.join(process.cwd(), relativePath), { force: true });
    } catch {
      // На хостинге папка приложения только для чтения — файл уйдёт коммитом.
    }
  }

  if (!GITHUB_TOKEN) return [];

  const present: string[] = [];
  for (const relativePath of paths) {
    if (await existsInRepo(relativePath)) present.push(relativePath);
  }
  if (present.length === 0) return [];

  await Promise.all(
    present.map((relativePath) =>
      enqueue({ path: relativePath, base64: null, label, kind: "media" }),
    ),
  );
  return present;
}

/**
 * Кладёт фотографию туда, откуда её отдаст сайт, и возвращает её адрес.
 *
 * Два пути. Основной: панель стоит на хостинге рядом с сайтом — файл пишется
 * прямо в его папку, ни коммита, ни выкладки, кадр виден сразу
 * (см. src/lib/site-media.ts). Запасной, когда сайта рядом нет — разработка,
 * Vercel: файл едет в репозиторий, в общей пачке с `products.json`.
 *
 * Запасной путь отправки не дожидается намеренно: фотография должна уехать
 * одним коммитом вместе с данными, которые сохранятся следом. Отказ увидит
 * тот, кто пачку дожидается, — сохранение данных, и оно ответит ошибкой.
 *
 * `mimeType` не используется — тип файла виден по расширению; параметр оставлен
 * прежним, чтобы не переписывать вызовы в роутах.
 */
export async function saveMediaFile(
  publicRelativePath: string,
  buffer: Buffer,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mimeType = "image/webp",
): Promise<string> {
  const url = `/${publicRelativePath.replace(/^\//, "")}`;

  /*
    Панель стоит на том же хостинге, что и сайт, и её папка лежит внутри папки
    домена. Тогда фотографию кладём прямо туда: кадр виден на сайте сразу,
    репозиторий не растёт, и загрузка не стоит ни коммита, ни выкладки.
    Подробности и оговорки — в src/lib/site-media.ts.
  */
  if (writeToSite(publicRelativePath, buffer)) {
    return url;
  }

  // Сайта рядом нет (разработка, Vercel) — везём файл через репозиторий.
  const fullRelativePath = path.join("public", publicRelativePath);
  writeLocal(fullRelativePath, buffer);

  if (GITHUB_TOKEN) {
    void enqueue({
      path: fullRelativePath,
      base64: buffer.toString("base64"),
      label: `Загрузка медиафайла: ${publicRelativePath}`,
      kind: "media",
    });
  }

  return url;
}
