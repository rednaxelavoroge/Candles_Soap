import fs from "fs";
import path from "path";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
const GITHUB_REPO = process.env.GITHUB_REPO || "rednaxelavoroge/Candles_Soap";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

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

async function commitToGitHub(filePath: string, base64Content: string, message: string): Promise<void> {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;
    
    // Получаем текущий SHA файла, если он уже существует
    let sha: string | undefined;
    const getRes = await fetch(`${url}?ref=${GITHUB_BRANCH}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
    }

    // Создаем / обновляем файл
    const putRes = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content: base64Content,
        branch: GITHUB_BRANCH,
        sha,
      }),
    });

    if (!putRes.ok) {
      const err = await putRes.text();
      console.error("GitHub API commit error:", err);
    }
  } catch (err) {
    console.error("Error committing to GitHub:", err);
  }
}
