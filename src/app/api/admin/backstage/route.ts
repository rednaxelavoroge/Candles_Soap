import { checkAdminAuth } from "@/lib/admin-auth";
import { saveJsonData, saveMediaFile } from "@/lib/data-storage";
import { getBackstage } from "@/lib/content";
import type { BackstageItem } from "@/lib/schemas";
import { NextResponse } from "next/server";

export async function GET() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ backstage: getBackstage() });
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

    const current = getBackstage();
    const updated = [finalItem, ...current];
    await saveJsonData("src/data/backstage.json", updated);

    return NextResponse.json({ ok: true, item: finalItem });
  } catch (err) {
    console.error("Backstage API error:", err);
    return NextResponse.json({ error: "Ошибка сохранения бэкстейджа" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const indexStr = searchParams.get("index");
    if (indexStr === null) return NextResponse.json({ error: "Индекс не указан" }, { status: 400 });

    const index = parseInt(indexStr, 10);
    const current = getBackstage();
    const updated = current.filter((_, idx) => idx !== index);
    await saveJsonData("src/data/backstage.json", updated);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 });
  }
}
