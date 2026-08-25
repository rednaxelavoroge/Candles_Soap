import { checkAdminAuth } from "@/lib/admin-auth";
import { loadJsonData, saveJsonData, saveMediaFile } from "@/lib/data-storage";
import { getCategories } from "@/lib/content";
import type { Category } from "@/lib/schemas";
import { NextResponse } from "next/server";

const FILE = "src/data/categories.json";

function currentCategories(): Promise<Category[]> {
  return loadJsonData<Category[]>(FILE, getCategories());
}

export async function GET() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ categories: await currentCategories() });
}

export async function POST(req: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { category, coverData } = body;

    if (!category || !category.title) {
      return NextResponse.json({ error: "Не указано название раздела" }, { status: 400 });
    }

    // Auto-generate slug if not set
    let slug = category.slug;
    if (!slug) {
      slug = category.title
        .toLowerCase()
        .replace(/[а-яё]/g, (match: string) => {
          const ru: Record<string, string> = {
            а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
            з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
            п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
            ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya"
          };
          return ru[match] || match;
        })
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    const current = await currentCategories();
    let finalCover = category.cover || null;

    if (coverData && coverData.base64) {
      const base64Data = coverData.base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const filename = `catalog/featured/category-${slug}-${Date.now()}.webp`;
      const savedPath = await saveMediaFile(filename, buffer, "image/webp");

      finalCover = {
        src: savedPath,
        width: coverData.width || 1200,
        height: coverData.height || 1200,
        blurDataURL: coverData.blurDataURL || "",
        alt: category.title,
      };
    }

    const targetCategory: Category = {
      slug,
      title: category.title,
      subtitle: category.subtitle || "",
      description: category.description || "",
      cover: finalCover,
      order: category.order || current.length + 1,
    };

    const exists = current.some((c) => c.slug === slug);
    let updated: Category[];

    if (exists) {
      updated = current.map((c) => (c.slug === slug ? targetCategory : c));
    } else {
      updated = [...current, targetCategory];
    }

    await saveJsonData(FILE, updated);
    return NextResponse.json({ ok: true, category: targetCategory, categories: updated });
  } catch (err) {
    console.error("Categories API error:", err);
    return NextResponse.json({ error: "Ошибка сохранения категории" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    if (!slug) return NextResponse.json({ error: "Slug не указан" }, { status: 400 });

    const current = await currentCategories();
    const updated = current.filter((c) => c.slug !== slug);

    await saveJsonData(FILE, updated);
    return NextResponse.json({ ok: true, categories: updated });
  } catch (err) {
    console.error("Delete category API error:", err);
    return NextResponse.json({ error: "Ошибка удаления категории" }, { status: 500 });
  }
}
