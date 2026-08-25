import fs from "fs";
import path from "path";

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

/**
 * Сохраняет JSON-файл либо в локальную файловую систему, либо через GitHub API в продакшене.
 */
export async function saveJsonData(relativePath: string, data: unknown): Promise<void> {
  const contentStr = JSON.stringify(data, null, 2);

  // 1. Попытка записи в локальную ФС
  try {
    const fullPath = path.join(process.cwd(), relativePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, contentStr, "utf-8");
  } catch {
    // В serverless-среде ФС доступна только для чтения — используем GitHub API ниже
  }

  // 2. Если задан GITHUB_TOKEN — синхронизируем с GitHub репозиторием
  if (GITHUB_TOKEN) {
    await commitToGitHub(relativePath, Buffer.from(contentStr).toString("base64"), `Обновление данных: ${relativePath}`);
  }

  justWritten.set(relativePath, { data, at: Date.now() });
}

/**
 * Сохраняет бинарный файл (изображение/видео) в public/ либо в GitHub.
 */
export async function saveMediaFile(
  publicRelativePath: string,
  buffer: Buffer,
  mimeType = "image/webp",
): Promise<string> {
  const fullRelativePath = path.join("public", publicRelativePath);

  // 1. Попытка локальной записи
  try {
    const fullPath = path.join(process.cwd(), fullRelativePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, buffer);
  } catch {
    // В Vercel используем GitHub API
  }

  // 2. Синхронизация с GitHub
  if (GITHUB_TOKEN) {
    await commitToGitHub(
      fullRelativePath,
      buffer.toString("base64"),
      `Загрузка медиафайла: ${publicRelativePath}`,
    );
  }

  return `/${publicRelativePath.replace(/^\//, "")}`;
}

/**
 * Запись файла в репозиторий.
 *
 * Два сохранения подряд — обычное дело: отметили тему, тут же переставили фото.
 * Второе приходит со ссылкой на версию, которой уже нет, и GitHub отвечает
 * отказом. Поэтому при конфликте берём свежую версию и пробуем ещё раз, а не
 * сообщаем заказчице об ошибке там, где всё поправимо.
 */
async function commitToGitHub(filePath: string, base64Content: string, message: string): Promise<void> {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;

  const currentSha = async (): Promise<string | undefined> => {
    const res = await fetch(`${url}?ref=${GITHUB_BRANCH}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    });
    if (!res.ok) return undefined;
    return (await res.json()).sha as string | undefined;
  };

  const put = async (sha: string | undefined) =>
    fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, content: base64Content, branch: GITHUB_BRANCH, sha }),
    });

  try {
    let res = await put(await currentSha());

    // 409 и 422 — «версия устарела». Перечитываем и повторяем ровно один раз.
    if (res.status === 409 || res.status === 422) {
      res = await put(await currentSha());
    }

    if (!res.ok) {
      const err = await res.text();
      console.error("GitHub API commit error:", err);
      throw new Error(`GitHub commit failed: ${res.status}`);
    }
  } catch (err) {
    console.error("Error committing to GitHub:", err);
    throw err;
  }
}
