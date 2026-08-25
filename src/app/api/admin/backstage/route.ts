import { checkAdminAuth } from "@/lib/admin-auth";
import { loadJsonData, saveJsonData, saveMediaFile } from "@/lib/data-storage";
import { getBackstage } from "@/lib/content";
import type { BackstageItem } from "@/lib/schemas";
import { NextResponse } from "next/server";

const FILE = "src/data/backstage.json";

/** Актуальная лента из репозитория; данные сборки — только запасной вариант. */
function current(): Promise<BackstageItem[]> {
  return loadJsonData<BackstageItem[]>(FILE, getBackstage());
}

/** Путь к файлу кадра — то, что отличает его от соседей, в отличие от позиции. */
function mediaSrc(item: BackstageItem): string {
  return item.kind === "image" ? item.image.src : item.src;
}

export async function GET() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ backstage: await current() });
}

export async function POST(req: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { item, mediaData } = body;

    let finalItem: BackstageItem = item;

    if (mediaData && mediaData.base64) {
      const base64Data = mediaData.base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `backstage-${Date.now()}.webp`;
      const savedPath = await saveMediaFile(`backstage/${fileName}`, buffer, "image/webp");

      if (item.kind === "image") {
        finalItem = {
          kind: "image",
          caption: item.caption || "Мастерская",
          image: {
            src: savedPath,
            width: mediaData.width || 1200,
            height: mediaData.height || 1200,
            blurDataURL: mediaData.blurDataURL || "",
            alt: item.caption || "Кадр мастерской",
          },
        };
      }
    }

    const updated = [finalItem, ...(await current())];
    await saveJsonData(FILE, updated);

    return NextResponse.json({ ok: true, item: finalItem, backstage: updated });
  } catch (err) {
    console.error("Backstage API error:", err);
    return NextResponse.json({ error: "Ошибка сохранения бэкстейджа" }, { status: 500 });
  }
}

/**
 * Порядок кадров в ленте. Приходит список путей к файлам в нужной
 * последовательности: позиции в панели и в файле могут разойтись, а путь — нет.
 */
export async function PUT(req: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { order } = await req.json();
    if (!Array.isArray(order)) {
      return NextResponse.json({ error: "Порядок не передан" }, { status: 400 });
    }

    const list = await current();
    const bySrc = new Map(list.map((item) => [mediaSrc(item), item]));

    const reordered: BackstageItem[] = [];
    for (const src of order) {
      const item = bySrc.get(src);
      if (item) {
        reordered.push(item);
        bySrc.delete(src);
      }
    }
    // Кадры, добавленные с другого устройства, пока панель была открыта,
    // не должны исчезнуть из-за перестановки — дописываем их в хвост.
    reordered.push(...bySrc.values());

    await saveJsonData(FILE, reordered);
    return NextResponse.json({ ok: true, backstage: reordered });
  } catch (err) {
    console.error("Backstage reorder error:", err);
    return NextResponse.json({ error: "Ошибка сохранения порядка" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const src = searchParams.get("src");
    const indexStr = searchParams.get("index");

    const list = await current();
    let updated: BackstageItem[];

    if (src) {
      updated = list.filter((item) => mediaSrc(item) !== src);
      if (updated.length === list.length) {
        return NextResponse.json({ error: "Кадр не найден" }, { status: 404 });
      }
    } else if (indexStr !== null) {
      // Старый способ — по позиции. Оставлен ради вкладок, открытых до обновления.
      const index = parseInt(indexStr, 10);
      updated = list.filter((_, idx) => idx !== index);
    } else {
      return NextResponse.json({ error: "Не указано, что удалять" }, { status: 400 });
    }

    await saveJsonData(FILE, updated);
    return NextResponse.json({ ok: true, backstage: updated });
  } catch (err) {
    console.error("Backstage delete error:", err);
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 });
  }
}
