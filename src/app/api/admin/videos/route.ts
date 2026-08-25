import { checkAdminAuth } from "@/lib/admin-auth";
import generatedVideos from "@/data/generated_videos.json";
import { saveMediaFile } from "@/lib/data-storage";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * Библиотека роликов мастерской.
 *
 * Съёмка процесса уже лежит в репозитории — полсотни вертикальных клипов из
 * папок «видео-свечи» и «видео-мыло». Заказчице нужно не загружать их заново,
 * а прицепить нужный к нужному изделию, поэтому панель выбирает из готового
 * списка. Загрузка файла остаётся, но только для коротких клипов: тело запроса
 * в serverless ограничено, и ролик прямо с телефона в него не пролезет.
 */

const VIDEO_DIR = "public/catalog/video";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
const GITHUB_REPO = process.env.GITHUB_REPO || "rednaxelavoroge/Candles_Soap";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

/** Максимум для загрузки файлом — предел тела запроса в serverless. */
const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;

type LibraryVideo = {
  src: string;
  name: string;
  poster: string | null;
  caption: string | null;
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

/** В serverless папка public в лямбду не попадает — берём список из репозитория. */
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

export async function GET() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  try {
    const { base64, fileName } = await req.json();
    if (typeof base64 !== "string" || !base64.startsWith("data:video/")) {
      return NextResponse.json({ error: "Это не видеофайл" }, { status: 400 });
    }

    const payload = base64.slice(base64.indexOf(",") + 1);
    const buffer = Buffer.from(payload, "base64");
    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          error:
            "Ролик слишком тяжёлый для загрузки через панель. Выложите его на YouTube и вставьте ссылку — так он и открываться будет быстрее.",
        },
        { status: 413 },
      );
    }

    const safeName = (fileName || "video")
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    const savedPath = await saveMediaFile(
      `catalog/video/${safeName || "video"}-${Date.now()}.mp4`,
      buffer,
      "video/mp4",
    );

    return NextResponse.json({ ok: true, src: savedPath });
  } catch (err) {
    console.error("Video upload error:", err);
    return NextResponse.json({ error: "Ошибка загрузки видео" }, { status: 500 });
  }
}
