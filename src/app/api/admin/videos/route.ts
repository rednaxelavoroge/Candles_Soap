import { checkAdminAuth } from "@/lib/admin-auth";
import generatedVideos from "@/data/generated_videos.json";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * Библиотека роликов мастерской и загрузка своих.
 *
 * Съёмка процесса уже лежит в репозитории — полсотни вертикальных клипов из
 * папок «видео-свечи» и «видео-мыло». Заказчице чаще нужно не загружать новое,
 * а прицепить готовое к изделию, поэтому панель выбирает из списка.
 *
 * Загрузка своего ролика раньше упиралась в 3,5 МБ: столько пропускала
 * площадка Vercel, а с айфона приходит 10–40 МБ. Панель переехала на обычный
 * хостинг, предел исчез — и теперь ролик берётся целиком, как есть.
 *
 * Сжимать его здесь нельзя: на общем хостинге нет ffmpeg, да и перекодировать
 * сорокамегабайтный файл ему нечем. Поэтому исходник уезжает в GitHub — в
 * приложения к служебному выпуску, не в историю репозитория, — а сжимает его
 * машина сборки: там ffmpeg есть, и все нынешние 47 роликов сделаны ровно им.
 * Готовый ролик она кладёт в `public/catalog/video`, откуда он и попадает на
 * сайт обычной выкладкой.
 */

const VIDEO_DIR = "public/catalog/video";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
const GITHUB_REPO = process.env.GITHUB_REPO || "rednaxelavoroge/Candles_Soap";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

/**
 * Служебный выпуск, через который исходник едет на машину сборки.
 *
 * Почему не коммитом в репозиторий: коммит остаётся в истории навсегда, даже
 * если файл потом удалить. Тридцать роликов по 40 МБ — это гигабайт мёртвого
 * веса, который будет качаться при каждом клонировании. Приложения к выпуску
 * в историю не попадают и удаляются насовсем, поэтому исходник едет так.
 */
const INBOX_TAG = "video-inbox";

/** Имя файла рабочего процесса, который сжимает ролик. */
const COMPRESS_WORKFLOW = "compress-video.yml";

/**
 * Предел на загрузку. Взят с запасом к тому, что даёт айфон: минута съёмки
 * в 4K — около 350 МБ, но заказчица снимает короткие клипы на 10–40 МБ.
 * Предел нужен не ради площадки, а чтобы случайно выбранный часовой файл
 * не занял память приложения на общем хостинге.
 */
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

type LibraryVideo = {
  src: string;
  name: string;
  poster: string | null;
  caption: string | null;
};

/** Чем кончилась обработка ролика — это же кладёт машина сборки. */
type JobResult = {
  ok: boolean;
  src?: string;
  error?: string;
  sizeMb?: number;
};

const POSTERS = new Map(
  (generatedVideos as Array<{ src: string; poster: { src: string }; caption: string }>).map(
    (item) => [item.src, { poster: item.poster.src, caption: item.caption }],
  ),
);

/** Читаемое имя из имени файла: «candle-process-12.mp4» → «Свечи — процесс 12». */
function humanName(file: string): string {
  const base = file.replace(/\.(mp4|webm|mov)$/i, "");
  const process = base.match(/^(candle|soap|gypsum)-process-(\d+)$/);
  if (process) {
    const kind =
      process[1] === "candle" ? "Свечи" : process[1] === "soap" ? "Мыло" : "Гипс";
    return `${kind} — процесс ${process[2]}`;
  }
  return base.replace(/-/g, " ").replace(/^./, (ch) => ch.toUpperCase());
}

function listFromDisk(): string[] {
  try {
    const dir = path.join(process.cwd(), VIDEO_DIR);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((file) => /\.mp4$/i.test(file));
  } catch {
    return [];
  }
}

/** На хостинге и в serverless папки public рядом нет — берём список из репозитория. */
async function listFromGitHub(): Promise<string[]> {
  if (!GITHUB_TOKEN) return [];
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${VIDEO_DIR}?ref=${GITHUB_BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
        cache: "no-store",
      },
    );
    if (!res.ok) return [];
    const entries = (await res.json()) as Array<{ name: string; type: string }>;
    return entries.filter((e) => e.type === "file" && /\.mp4$/i.test(e.name)).map((e) => e.name);
  } catch {
    return [];
  }
}

function gh(url: string, init: RequestInit = {}) {
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
}

type Release = { id: number; assets: Array<{ id: number; name: string }> };

/** Служебный выпуск: находим, а если его ещё нет — заводим. */
async function inboxRelease(create: boolean): Promise<Release | null> {
  const found = await gh(
    `https://api.github.com/repos/${GITHUB_REPO}/releases/tags/${INBOX_TAG}`,
  );
  if (found.ok) return (await found.json()) as Release;
  if (found.status !== 404 || !create) return null;

  const made = await gh(`https://api.github.com/repos/${GITHUB_REPO}/releases`, {
    method: "POST",
    body: JSON.stringify({
      tag_name: INBOX_TAG,
      target_commitish: GITHUB_BRANCH,
      name: "Исходники роликов",
      body:
        "Служебный выпуск. Сюда панель кладёт ролик как он пришёл с телефона, " +
        "машина сборки забирает его отсюда, сжимает и удаляет. " +
        "Ничего постоянного здесь не хранится.",
      prerelease: true,
    }),
  });
  if (!made.ok) return null;
  return (await made.json()) as Release;
}

async function deleteAsset(id: number): Promise<void> {
  await gh(`https://api.github.com/repos/${GITHUB_REPO}/releases/assets/${id}`, {
    method: "DELETE",
  }).catch(() => undefined);
}

export async function GET(req: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  /*
    Панель спрашивает про судьбу загруженного ролика: пока он сжимается, она
    ждёт, а как только машина сборки закончила — показывает, что вышло.
    Ответ машина кладёт туда же, в приложения к выпуску.
  */
  const job = new URL(req.url).searchParams.get("job");
  if (job) {
    if (!GITHUB_TOKEN) {
      return NextResponse.json({ state: "error", error: "Нет доступа к хранилищу" });
    }
    const release = await inboxRelease(false);
    if (!release) return NextResponse.json({ state: "working" });

    const result = release.assets.find((a) => a.name === `${job}.result.json`);
    if (result) {
      const res = await gh(
        `https://api.github.com/repos/${GITHUB_REPO}/releases/assets/${result.id}`,
        { headers: { Accept: "application/octet-stream" } },
      );
      const body = (await res.json().catch(() => ({}))) as JobResult;
      // Ответ прочитан — прибираем за собой, чтобы выпуск не зарастал.
      await deleteAsset(result.id);
      return NextResponse.json(
        body.ok
          ? { state: "done", src: body.src, sizeMb: body.sizeMb }
          : { state: "failed", error: body.error || "Ролик не удалось подготовить" },
      );
    }

    return NextResponse.json({ state: "working" });
  }

  let files = listFromDisk();
  if (files.length === 0) files = await listFromGitHub();

  const videos: LibraryVideo[] = files
    .sort((a, b) => a.localeCompare(b, "ru", { numeric: true, sensitivity: "base" }))
    .map((file) => {
      const src = `/catalog/video/${file}`;
      const known = POSTERS.get(src);
      return {
        src,
        name: humanName(file),
        poster: known?.poster ?? null,
        caption: known?.caption ?? null,
      };
    });

  return NextResponse.json({ videos, maxUploadBytes: MAX_UPLOAD_BYTES });
}

export async function POST(req: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!GITHUB_TOKEN) {
    return NextResponse.json(
      { error: "Панель не может отправить ролик: не задан доступ к хранилищу." },
      { status: 500 },
    );
  }

  try {
    /*
      Файл приходит как есть, отдельным полем формы, а не строкой в base64.
      Раньше было наоборот, и это стоило трети лишнего веса: base64 раздувает
      файл на треть, а сорок мегабайт с телефона превращались в пятьдесят три.
    */
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Файл не пришёл" }, { status: 400 });
    }
    /*
      Тип файла проверяем мягко. Браузер сообщает его сам, но не всегда:
      с айфона `.mov` приходит как `video/quicktime`, а иногда тип пустой или
      обезличенный — тогда браузер просто не взялся его угадывать. Отвергать
      такое нельзя: человек выбрал ролик, он у него есть. Смотрим на расширение,
      а окончательно судит уже машина сборки — она пробует его прочитать
      и говорит внятно, если это не видео.
    */
    const looksLikeVideo =
      file.type.startsWith("video/") || /\.(mp4|mov|m4v|webm|avi|mkv|3gp)$/i.test(file.name || "");
    if (!looksLikeVideo) {
      return NextResponse.json(
        { error: "Похоже, это не видеофайл. Выберите ролик — mp4 или mov." },
        { status: 400 },
      );
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      const mb = Math.round(file.size / (1024 * 1024));
      return NextResponse.json(
        { error: `Ролик слишком длинный: ${mb} МБ. Панель принимает до 200 МБ.` },
        { status: 413 },
      );
    }

    const safeName =
      (file.name || "video")
        .replace(/\.[^.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) || "video";
    const target = `${safeName}-${Date.now()}.mp4`;

    const release = await inboxRelease(true);
    if (!release) {
      return NextResponse.json(
        { error: "Не удалось подготовить хранилище для ролика" },
        { status: 502 },
      );
    }

    // Одноимённое приложение оставаться не должно — GitHub такое отвергает.
    const stale = release.assets.find((a) => a.name === target);
    if (stale) await deleteAsset(stale.id);

    const bytes = Buffer.from(await file.arrayBuffer());
    const sent = await fetch(
      `https://uploads.github.com/repos/${GITHUB_REPO}/releases/${release.id}/assets?name=${encodeURIComponent(target)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          // Длину не выставляем руками: fetch считает её сам, а поставленная
          // вручную в Node либо игнорируется, либо роняет запрос.
          "Content-Type": "application/octet-stream",
        },
        body: new Uint8Array(bytes),
      },
    );
    if (!sent.ok) {
      console.error("Video asset upload failed:", sent.status, await sent.text());
      return NextResponse.json(
        { error: "Ролик не доехал до хранилища. Попробуйте ещё раз." },
        { status: 502 },
      );
    }

    const dispatched = await gh(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${COMPRESS_WORKFLOW}/dispatches`,
      {
        method: "POST",
        body: JSON.stringify({ ref: GITHUB_BRANCH, inputs: { target } }),
      },
    );
    if (!dispatched.ok) {
      console.error("Compress dispatch failed:", dispatched.status, await dispatched.text());
      return NextResponse.json(
        { error: "Ролик загружен, но обработку запустить не вышло. Напишите разработчику." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, job: target });
  } catch (err) {
    console.error("Video upload error:", err);
    return NextResponse.json({ error: "Ошибка загрузки видео" }, { status: 500 });
  }
}
