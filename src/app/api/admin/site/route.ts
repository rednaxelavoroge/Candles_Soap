import { checkAdminAuth } from "@/lib/admin-auth";
import { saveJsonData, saveMediaFile } from "@/lib/data-storage";
import { getSite } from "@/lib/content";
import { NextResponse } from "next/server";

export async function GET() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ site: getSite() });
}

export async function POST(req: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { owner, tagline, intro, contacts, portraitData, featured } = body;
    const current = getSite();

    let portrait = current.portrait;
    if (portraitData && portraitData.base64) {
      const base64Data = portraitData.base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `portrait-${Date.now()}.webp`;
      const savedPath = await saveMediaFile(fileName, buffer, "image/webp");

      portrait = {
        src: savedPath,
        width: portraitData.width || 1200,
        height: portraitData.height || 1600,
        blurDataURL: portraitData.blurDataURL || "",
        alt: `${owner || current.owner} — портрет`,
      };
    }

    const updated = {
      ...current,
      owner: owner ?? current.owner,
      tagline: tagline ?? current.tagline,
      intro: intro ?? current.intro,
      portrait,
      // Лента «Избранного» на главной: заказчица правит её целиком, поэтому
      // блок либо приходит из формы, либо остаётся прежним.
      featured: featured ?? current.featured,
      contacts: {
        ...current.contacts,
        ...(contacts || {}),
      },
    };

    await saveJsonData("src/data/site.json", updated);
    return NextResponse.json({ ok: true, site: updated });
  } catch (err) {
    console.error("Site API error:", err);
    return NextResponse.json({ error: "Ошибка сохранения настроек" }, { status: 500 });
  }
}
