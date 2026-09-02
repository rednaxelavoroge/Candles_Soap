/**
 * Один коммит на любое число файлов.
 *
 * Панель пишет правки прямо в репозиторий, а каждый коммит запускает выкладку —
 * и на Vercel, и воркфлоу `deploy-hosting.yml`. Пока файлы уезжали по одному
 * (`PUT /contents/…` умеет ровно один файл за раз), карточка с шестью
 * фотографиями стоила семь коммитов и семь выкладок. Вечером 02.09.2026 этого
 * хватило, чтобы выбрать суточный предел бесплатного тарифа Vercel — сто
 * выкладок на весь аккаунт — и остановить заодно другие проекты.
 *
 * Здесь тот же обход, что делает обычный `git commit`, только через API:
 * содержимое → дерево → коммит → перевод ветки. Число файлов на стоимость
 * не влияет: выкладка всё равно одна.
 */

const API = "https://api.github.com";

export type CommitFile = {
  /** Путь от корня репозитория: `src/data/products.json`, `public/catalog/…`. */
  path: string;
  /** Содержимое в base64 — так одинаково едут и JSON, и фотография. */
  base64: string;
};

export type CommitRequest = {
  token: string;
  /** `владелец/репозиторий`. */
  repo: string;
  branch: string;
  files: CommitFile[];
  message: string;
};

/**
 * Сколько раз пробуем перевести ветку, если она ушла вперёд, пока мы собирали
 * коммит. Так бывает, когда заказчица сохраняет из двух вкладок или когда в
 * ветку пишет машина сборки, сжавшая ролик.
 */
const REF_RETRIES = 4;

/** Одновременных загрузок содержимого — чтобы не упираться в пределы GitHub. */
const BLOB_CONCURRENCY = 4;

export class GitHubApiError extends Error {
  constructor(
    readonly status: number,
    readonly endpoint: string,
    readonly body: string,
  ) {
    super(`GitHub ${status} на ${endpoint}: ${body.slice(0, 300)}`);
    this.name = "GitHubApiError";
  }
}

function send(token: string, endpoint: string, init: RequestInit = {}) {
  return fetch(`${API}${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
}

async function request<T>(token: string, endpoint: string, init: RequestInit = {}): Promise<T> {
  const res = await send(token, endpoint, init);
  if (!res.ok) {
    throw new GitHubApiError(res.status, endpoint, await res.text());
  }
  return (await res.json()) as T;
}

/** Выполняет задачи пачками по `limit` штук, сохраняя порядок результатов. */
async function mapLimit<In, Out>(
  items: In[],
  limit: number,
  worker: (item: In) => Promise<Out>,
): Promise<Out[]> {
  const results: Out[] = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(runners);
  return results;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Кладёт все файлы в ветку одним коммитом и возвращает его адрес.
 *
 * Бросает исключение, если коммит не состоялся: вызывающая сторона должна
 * сказать об этом заказчице, а не делать вид, что сохранение прошло.
 */
export async function commitFiles({
  token,
  repo,
  branch,
  files,
  message,
}: CommitRequest): Promise<string> {
  if (files.length === 0) {
    throw new Error("commitFiles вызван без файлов");
  }

  /*
    Содержимое кладём один раз, до попыток перевести ветку: адрес блоба
    считается из самого содержимого, поэтому повтор его не переделывает —
    заново собирается только дерево.
  */
  const blobs = await mapLimit(files, BLOB_CONCURRENCY, async (file) => {
    const blob = await request<{ sha: string }>(token, `/repos/${repo}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: file.base64, encoding: "base64" }),
    });
    return { path: file.path, sha: blob.sha };
  });

  for (let attempt = 0; attempt < REF_RETRIES; attempt++) {
    const ref = await request<{ object: { sha: string } }>(
      token,
      `/repos/${repo}/git/ref/heads/${branch}`,
    );
    const headSha = ref.object.sha;
    const head = await request<{ tree: { sha: string } }>(
      token,
      `/repos/${repo}/git/commits/${headSha}`,
    );

    /*
      `base_tree` — вершина ветки: в дереве перечислены только наши файлы,
      всё остальное берётся оттуда. Поэтому чужая правка соседнего файла,
      приехавшая минуту назад, коммитом не затирается.
    */
    const tree = await request<{ sha: string }>(token, `/repos/${repo}/git/trees`, {
      method: "POST",
      body: JSON.stringify({
        base_tree: head.tree.sha,
        tree: blobs.map((blob) => ({
          path: blob.path,
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        })),
      }),
    });

    const commit = await request<{ sha: string }>(token, `/repos/${repo}/git/commits`, {
      method: "POST",
      body: JSON.stringify({ message, tree: tree.sha, parents: [headSha] }),
    });

    const endpoint = `/repos/${repo}/git/refs/heads/${branch}`;
    const moved = await send(token, endpoint, {
      method: "PATCH",
      // Без перемотки: если ветка ушла вперёд, GitHub обязан отказать,
      // а не стереть чужой коммит.
      body: JSON.stringify({ sha: commit.sha, force: false }),
    });
    if (moved.ok) return commit.sha;

    // 422 и 409 — «ветка ушла вперёд». Берём новую вершину и собираем заново.
    if (moved.status !== 422 && moved.status !== 409) {
      throw new GitHubApiError(moved.status, endpoint, await moved.text());
    }
    await wait(250 * (attempt + 1));
  }

  throw new Error(
    `Не удалось перевести ветку ${branch} за ${REF_RETRIES} попыток: в неё всё время пишет кто-то ещё`,
  );
}
