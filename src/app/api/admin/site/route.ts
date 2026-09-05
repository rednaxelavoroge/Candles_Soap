import { checkAdminAuth } from "@/lib/admin-auth";
import { loadJsonData, saveJsonData, saveMediaFile } from "@/lib/data-storage";
import { getSite } from "@/lib/content";
import type { Site } from "@/lib/schemas";
import { pruneTexts } from "@/lib/site-texts";
import { NextResponse } from "next/server";

const FILE = "src/data/site.json";

function currentSite(): Promise<Site> {
  return loadJsonData<Site>(FILE, getSite());
}

export async function GET() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ site: await currentSite() });
}

export async function POST(req: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { owner, brand, tagline, intro, contacts, portraitData, featured, texts } = body;
    const current = await currentSite();

    // Название сайта стоит в шапке, подвале и заголовке вкладки: пустым быть не может.
    const cleanBrand = typeof brand === "string" ? brand.trim() : "";
    const cleanOwner = typeof owner === "string" ? owner.trim() : "";
    if (typeof owner === "string" && !cleanOwner) {
      return NextResponse.json({ error: "Имя автора не может быть пустым" }, { status: 400 });
    }
    if (typeof brand === "string" && !cleanBrand) {
      return NextResponse.json({ error: "Название сайта не может быть пустым" }, { status: 400 });
    }

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

    /*
      Каждая форма панели присылает только свои поля. Раньше «Тексты» уезжали
      вместе с «Избранным» из памяти вкладки, и две открытые вкладки затирали
      друг друга тем, что было загружено при открытии.
    */
    const updated: Site = {
      ...current,
      owner: cleanOwner || current.owner,
      brand: cleanBrand || current.brand,
      tagline: typeof tagline === "string" ? tagline : current.tagline,
      intro: typeof intro === "string" ? intro : current.intro,
      portrait,
      featured: featured ?? current.featured,
      // В файле остаётся только то, что отличается от исходных текстов сайта.
      texts:
        texts && typeof texts === "object"
          ? pruneTexts(texts as Record<string, unknown>)
          : current.texts,
      contacts: {
        ...current.contacts,
        ...(contacts || {}),
      },
    };
    if (updated.texts && Object.keys(updated.texts).length === 0) delete updated.texts;

    await saveJsonData(FILE, updated);
    return NextResponse.json({ ok: true, site: updated });
  } catch (err) {
    console.error("Site API error:", err);
    return NextResponse.json({ error: "Ошибка сохранения настроек" }, { status: 500 });
  }
}
