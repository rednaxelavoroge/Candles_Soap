import { checkAdminAuth } from "@/lib/admin-auth";
import { loadJsonData, saveJsonData, saveMediaFile } from "@/lib/data-storage";
import { getSite } from "@/lib/content";
import type { Site } from "@/lib/schemas";
import { pruneTexts } from "@/lib/site-texts";
import { NextResponse } from "next/server";

const FILE = "src/data/site.json";

/** Заглушка размытия, если её не посчитали: схема требует непустую строку. */
const BLANK_BLUR =
  "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA";

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
    const { owner, brand, tagline, intro, contacts, portraitData, portraitAlt, featured, texts, gallery, galleryData } =
      body;
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
        alt: (typeof portraitAlt === "string" && portraitAlt.trim()) || `${owner || current.owner} — портрет`,
      };
    } else if (portrait && typeof portraitAlt === "string" && portraitAlt.trim()) {
      // Подпись к фото для поисковиков правится и без замены самого фото.
      portrait = { ...portrait, alt: portraitAlt.trim() };
    }

    /*
      Фотографии внизу страницы «Обо мне». Из формы приходит список уже
      стоящих (с их подписями и порядком) и отдельно новые файлы. Список не
      пришёл — галерея остаётся прежней; пришёл пустой — блок с сайта уходит.
    */
    let nextGallery = current.gallery;
    if (Array.isArray(gallery)) {
      const kept = gallery
        .filter((image) => image && typeof image.src === "string" && image.src)
        .map((image) => ({
          src: image.src as string,
          width: Number(image.width) || 1200,
          height: Number(image.height) || 1600,
          blurDataURL: (image.blurDataURL as string) || BLANK_BLUR,
          alt: (typeof image.alt === "string" && image.alt.trim()) || `${owner || current.owner} — в мастерской`,
        }));
      const added: typeof kept = [];
      if (Array.isArray(galleryData)) {
        for (let i = 0; i < galleryData.length; i++) {
          const item = galleryData[i];
          if (!item?.base64 || typeof item.base64 !== "string") continue;
          const buffer = Buffer.from(item.base64.replace(/^data:image\/\w+;base64,/, ""), "base64");
          const savedPath = await saveMediaFile(`about/gallery-${Date.now()}-${i + 1}.webp`, buffer, "image/webp");
          added.push({
            src: savedPath,
            width: Number(item.width) || 1200,
            height: Number(item.height) || 1600,
            blurDataURL: item.blurDataURL || BLANK_BLUR,
            alt: (typeof item.alt === "string" && item.alt.trim()) || `${owner || current.owner} — в мастерской`,
          });
        }
      }
      nextGallery = [...kept, ...added];
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
      gallery: nextGallery,
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
    if (updated.gallery && updated.gallery.length === 0) delete updated.gallery;

    await saveJsonData(FILE, updated);
    return NextResponse.json({ ok: true, site: updated });
  } catch (err) {
    console.error("Site API error:", err);
    return NextResponse.json({ error: "Ошибка сохранения настроек" }, { status: 500 });
  }
}
