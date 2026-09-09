import { checkAdminAuth } from "@/lib/admin-auth";
import generatedVideos from "@/data/generated_videos.json";
import {
  loadJsonData,
  planRepoDeletions,
  queueRepoDeletions,
  saveJsonData,
  saveMediaFile,
} from "@/lib/data-storage";
import { deleteFromSite } from "@/lib/site-media";
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
const TITLES_FILE = "src/data/video_titles.json";
/** Файлы, в которых ролик может быть упомянут: без них удаление неполное. */
const PRODUCTS_FILE = "src/data/products.json";
const BACKSTAGE_FILE = "src/data/backstage.json";
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
 * Предел на загрузку.
 *
 * Двести мегабайт стояли здесь не потому, что длинные ролики нельзя, а потому
 * что файл брался в память целиком: на общем хостинге у панели её 150–250 МБ.
 * Теперь ролик переливается в хранилище на ходу, память под него не нужна, и
 * предел поднят до двух гигабайт — это заведомо больше любой съёмки с телефона
 * (минута 4K — около 350 МБ). Он остался только затем, чтобы случайно выбранный
 * фильм не занимал канал заказчицы полчаса впустую.
 *
 * Ограничения по длине ролика нет и не было ни здесь, ни в сжатии.
 */
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;

/**
 * До какого веса ролик уходит в хранилище прежним, проверенным способом —
 * куском памяти. Ровно тот предел, что стоял здесь раньше: всё, что заказчица
 * грузит обычно (10–40 МБ), идёт этой дорогой и не зависит от новой.
 */
const BUFFERED_BYTES = 200 * 1024 * 1024;

type LibraryVideo = {
  src: string;
  name: string;
  poster: string | null;
  caption: string | null;
};

/**
 * Ровно то в изделии и в ленте бэкстейджа, что нужно удалению ролика.
 *
 * Не `Product` и не `BackstageItem` из схем нарочно: здесь файлы читаются как
 * есть и записываются обратно целиком, поэтому лишние поля должны доехать
 * нетронутыми, а не потеряться на разборе.
 */
type ProductRecord = {
  id?: string;
  slug?: string;
  title?: string;
  videos?: Array<{ src?: string } | null>;
  video?: { src?: string } | null;
  [key: string]: unknown;
};

type BackstageRecord = { src?: string; [key: string]: unknown };

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

/**
 * Находит постер для видеофайла:
 * 1. В generated_videos.json
 * 2. Файл <base>-poster.webp в public/catalog/video
 * 3. Файл <base>.webp в public/catalog/posters
 * 4. Запасной путь к постеру в папке video
 */
function getPosterForVideo(file: string, src: string): string | null {
  const known = POSTERS.get(src);
  if (known?.poster) return known.poster;

  const base = file.replace(/\.(mp4|webm|mov)$/i, "");
  const videoPosterPath = path.join(process.cwd(), "public", "catalog", "video", `${base}-poster.webp`);
  if (fs.existsSync(videoPosterPath)) {
    return `/catalog/video/${base}-poster.webp`;
  }

  const postersPath = path.join(process.cwd(), "public", "catalog", "posters", `${base}.webp`);
  if (fs.existsSync(postersPath)) {
    return `/catalog/posters/${base}.webp`;
  }

  return `/catalog/video/${base}-poster.webp`;
}

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

  const customTitles = await loadJsonData<Record<string, { title?: string; caption?: string }>>(
    TITLES_FILE,
    {},
  );

  const videos: LibraryVideo[] = files
    .sort((a, b) => a.localeCompare(b, "ru", { numeric: true, sensitivity: "base" }))
    .map((file) => {
      const src = `/catalog/video/${file}`;
      const known = POSTERS.get(src);
      const custom = customTitles[src];
      return {
        src,
        name: custom?.title || known?.caption || humanName(file),
        poster: getPosterForVideo(file, src),
        caption: custom?.caption || known?.caption || null,
      };
    });

  return NextResponse.json({ videos, maxUploadBytes: MAX_UPLOAD_BYTES });
}

/** Сколько весит обложка. Кадр 720 px в webp — это 30–150 КБ, мегабайта хватает. */
const MAX_POSTER_BYTES = 1024 * 1024;

/**
 * Кладёт обложку рядом с роликом: `<имя>-poster.webp` в той же папке.
 *
 * Имя выбрано не случайно: ровно его ищет `getPosterForVideo`, и по нему же
 * панель показывает обложку, не заводя проигрывателя.
 */
async function savePoster(req: Request, src: string): Promise<NextResponse> {
  if (!/^\/catalog\/video\/[A-Za-z0-9][A-Za-z0-9._-]*\.(mp4|webm|mov)$/i.test(src)) {
    return NextResponse.json({ error: "Не тот адрес ролика" }, { status: 400 });
  }

  const image = Buffer.from(await req.arrayBuffer());
  if (image.length === 0) {
    return NextResponse.json({ error: "Обложка не пришла" }, { status: 400 });
  }
  if (image.length > MAX_POSTER_BYTES) {
    return NextResponse.json({ error: "Обложка слишком тяжёлая" }, { status: 413 });
  }

  const poster = src.replace(/\.[^.]+$/, "-poster.webp");
  try {
    // Тот же путь, что у фотографий: рядом с сайтом — прямо в его папку,
    // иначе через репозиторий.
    await saveMediaFile(poster, image, "image/webp");
    return NextResponse.json({ ok: true, poster });
  } catch (err) {
    console.error("Video poster save error:", err);
    // Ролик уже в каталоге и работает — обложка без него не повод пугать.
    return NextResponse.json({ error: "Обложку сохранить не удалось" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  /*
    Обложка загруженного ролика приходит сюда же, следом за ним.

    Почему из браузера. Ролики, снятые прежними сессиями, обложку получили
    от `tools/make-posters.mjs`, а загруженным через панель её не делал никто:
    сжатие кладёт в каталог только сам ролик. Поэтому у новых роликов в панели
    пустая клетка — заказчица про это и написала. Кадр снимает сам браузер с
    файла, который она выбрала: он у него уже есть, ничего качать не нужно, а
    на хостинге для этого не было бы ни ffmpeg, ни памяти.
  */
  const posterFor = new URL(req.url).searchParams.get("poster");
  if (posterFor !== null) return savePoster(req, posterFor);

  if (!GITHUB_TOKEN) {
    return NextResponse.json(
      { error: "Панель не может отправить ролик: не задан доступ к хранилищу." },
      { status: 500 },
    );
  }

  try {
    /*
      Ролик приходит двумя способами, и оба здесь живые.

      Основной — телом запроса, как есть (`?name=…` в адресе). Запасной —
      полем формы: так шлёт панель, открытая до этой правки, и обрывать ей
      загрузку из-за нашего обновления нельзя.

      Дальше важнее другое — не как он пришёл, а как уходит в хранилище.
      Пока ролик легче двухсот мегабайт, он уходит ровно тем же способом,
      каким уходил всегда: куском памяти. Этот путь проверен на живой панели
      настоящим файлом, и трогать его ради красоты незачем. Тяжелее — только
      тогда включается перелив потоком: держать в памяти общего хостинга
      полгигабайта нельзя, а раньше такой ролик просто отвергался.
    */
    const rawName = new URL(req.url).searchParams.get("name");
    const asBody = rawName !== null && req.body !== null;

    let sourceName = "";
    let size = 0;
    let mime = "";
    let body: BodyInit | null = null;

    if (asBody) {
      sourceName = rawName;
      size = Number(req.headers.get("content-length") || 0);
      mime = req.headers.get("content-type") || "";
      body = req.body;
    } else {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Файл не пришёл" }, { status: 400 });
      }
      sourceName = file.name || "";
      size = file.size;
      mime = file.type;
      body = new Uint8Array(await file.arrayBuffer());
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
      mime.startsWith("video/") || /\.(mp4|mov|m4v|webm|avi|mkv|3gp)$/i.test(sourceName);
    if (!looksLikeVideo) {
      return NextResponse.json(
        { error: "Похоже, это не видеофайл. Выберите ролик — mp4 или mov." },
        { status: 400 },
      );
    }
    const limit = asBody ? MAX_UPLOAD_BYTES : BUFFERED_BYTES;
    if (size > limit) {
      const mb = Math.round(size / (1024 * 1024));
      const limitMb = Math.round(limit / (1024 * 1024));
      return NextResponse.json(
        {
          // Прежняя строка говорила «ролик слишком длинный» про вес — и
          // заказчица прочла это как запрет на длинные ролики. По времени
          // ролики не ограничены ничем.
          error: `Ролик слишком тяжёлый: ${mb} МБ, а взять можно до ${limitMb} МБ. Дело в весе файла, а не в его длине.`,
        },
        { status: 413 },
      );
    }

    const safeName =
      (sourceName || "video")
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

    /*
      Тяжёлый ролик переливаем потоком, лёгкий — как раньше, куском памяти.

      Длина. Кусок памяти fetch измеряет сам. У потока измерять нечего, и без
      заголовка запрос ушёл бы «по частям» (chunked), а хранилище GitHub такие
      не принимает — поэтому здесь длина ставится руками, из того, что сообщил
      браузер. Проверено на Node 22: с потоком заголовок доезжает как есть,
      chunked не включается. (Прежнее замечание «Content-Length руками не
      выставлять» осталось верным для куска памяти — там он и правда лишний.)
    */
    const streamed = asBody && size > BUFFERED_BYTES;
    if (asBody && !streamed) {
      body = new Uint8Array(await new Response(body as ReadableStream).arrayBuffer());
    }

    const upload: RequestInit & { duplex?: "half" } = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/octet-stream",
        ...(streamed ? { "Content-Length": String(size) } : {}),
      },
      body,
    };
    if (streamed) upload.duplex = "half";

    const sent = await fetch(
      `https://uploads.github.com/repos/${GITHUB_REPO}/releases/${release.id}/assets?name=${encodeURIComponent(target)}`,
      upload,
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

export async function PUT(req: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { src, title, caption } = await req.json();
    if (!src) {
      return NextResponse.json({ error: "src не передан" }, { status: 400 });
    }

    const currentTitles = await loadJsonData<Record<string, { title?: string; caption?: string }>>(
      TITLES_FILE,
      {},
    );

    const updated = {
      ...currentTitles,
      [src]: {
        title: title !== undefined ? title : currentTitles[src]?.title || "",
        caption: caption !== undefined ? caption : currentTitles[src]?.caption || "",
      },
    };

    await saveJsonData(TITLES_FILE, updated);
    return NextResponse.json({ ok: true, titles: updated });
  } catch (err) {
    console.error("Video rename error:", err);
    return NextResponse.json({ error: "Ошибка сохранения названия" }, { status: 500 });
  }
}

/**
 * Удаление ролика из архива — насовсем.
 *
 * До сих пор ролик можно было только посмотреть и переименовать. Заказчица
 * писала прямо: «Хочу удалить. Там есть повторы. Как?» — никак, кнопки не
 * было. Убрать ролик «наполовину» здесь нельзя: он лежит в четырёх местах, и
 * пропущенное вернёт его обратно.
 *
 * 1. Изделия (`products.json`) — ролик мог быть прикреплён к нескольким.
 * 2. Лента бэкстейджа (`backstage.json`).
 * 3. Название, данное заказчицей (`video_titles.json`).
 * 4. Сами файлы: ролик и его обложка — и в репозитории, и в папке сайта на
 *    хостинге. Одного репозитория мало: выкладка идёт без `--delete`, файл
 *    остался бы на сайте и открывался по прямой ссылке.
 *
 * Порядок важен. Сначала данные и файлы сайта, потом коммит: если GitHub
 * откажет, панель ответит ошибкой, а не «удалено» поверх неудачи.
 */
export async function DELETE(req: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const src = new URL(req.url).searchParams.get("src") || "";
  // Имя приходит из браузера. Одна косая черта или «..» — и удаление ушло бы
  // не туда: ниже это настоящее удаление файлов, а не запись в списке.
  if (!/^\/catalog\/video\/[A-Za-z0-9][A-Za-z0-9._-]*\.(mp4|webm|mov)$/i.test(src)) {
    return NextResponse.json({ error: "Такого ролика в архиве нет" }, { status: 400 });
  }

  try {
    const [products, backstage, titles] = await Promise.all([
      loadJsonData<ProductRecord[]>(PRODUCTS_FILE, []),
      loadJsonData<BackstageRecord[]>(BACKSTAGE_FILE, []),
      loadJsonData<Record<string, { title?: string; caption?: string }>>(TITLES_FILE, {}),
    ]);

    const usedBy: string[] = [];
    const nextProducts = products.map((product) => {
      const videos = (product.videos ?? []).filter((video) => video?.src !== src);
      const single = product.video?.src === src ? null : product.video ?? null;
      const changed =
        videos.length !== (product.videos ?? []).length || single !== (product.video ?? null);
      if (!changed) return product;
      usedBy.push(product.title || product.slug || product.id || "изделие без названия");
      // Прежнее одиночное поле держим в согласии со списком — так же, как это
      // делает сама панель при правке карточки.
      return { ...product, videos, video: single ?? videos[0] ?? null };
    });

    const nextBackstage = backstage.filter((item) => item?.src !== src);
    const nextTitles = { ...titles };
    delete nextTitles[src];

    // Обложка лежит то рядом с роликом, то в общей папке постеров — зависит
    // от того, чем ролик сделан. Убираем ту, которая вправду есть.
    const base = src.replace(/^\/catalog\/video\//, "").replace(/\.[^.]+$/, "");
    const companions = [
      `/catalog/video/${base}-poster.webp`,
      `/catalog/posters/${base}.webp`,
      `/catalog/video/${base}.webm`,
    ];

    // Файлы сайта: сначала сам ролик, потом его обложки. Панель стоит рядом
    // с сайтом, поэтому с сайта он исчезает сразу, не дожидаясь выкладки.
    const gone = [src, ...companions].filter((item) => deleteFromSite(item));

    /*
      Дальше всё уезжает одним коммитом, то есть одной выкладкой сайта.
      Пачка коммита держится открытой секунду-другую, и любое ожидание между
      постановками разрывает её надвое: первая проверка вживую дала на одно
      удаление два коммита и две выкладки. Поэтому сначала — всё, что требует
      ожидания (проверка, какие файлы вправду есть в репозитории), и только
      потом записи, разом.
    */
    const repoPaths = await planRepoDeletions(
      [src, ...companions].map((item) => `public${item}`),
    );

    const writes: Promise<unknown>[] = [];
    if (nextBackstage.length !== backstage.length) {
      writes.push(saveJsonData(BACKSTAGE_FILE, nextBackstage));
    }
    if (usedBy.length > 0) {
      writes.push(saveJsonData(PRODUCTS_FILE, nextProducts));
    }
    if (titles[src]) {
      writes.push(saveJsonData(TITLES_FILE, nextTitles));
    }
    writes.push(queueRepoDeletions(repoPaths, `Удалён ролик: ${src.split("/").pop()}`));
    await Promise.all(writes);

    return NextResponse.json({
      ok: true,
      src,
      // Панели этого хватает, чтобы сказать заказчице, что именно изменилось.
      detachedFrom: usedBy,
      removedFromBackstage: backstage.length - nextBackstage.length,
      files: { site: gone.length, repo: repoPaths.length },
    });
  } catch (err) {
    console.error("Video delete error:", err);
    return NextResponse.json(
      { error: "Не удалось удалить ролик. Попробуйте ещё раз или напишите разработчику." },
      { status: 500 },
    );
  }
}

