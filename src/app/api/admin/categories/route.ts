import { checkAdminAuth } from "@/lib/admin-auth";
import { saveJsonData } from "@/lib/data-storage";
import { getCategories } from "@/lib/content";
import type { Category } from "@/lib/schemas";
import { NextResponse } from "next/server";

export async function GET() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ categories: getCategories() });
}

export async function POST(req: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { category } = body;

    if (!category || !category.slug || !category.title) {
      return NextResponse.json({ error: "Не заполнены обязательные поля" }, { status: 400 });
    }

    const current = getCategories();
    const updated = current.map((c) => (c.slug === category.slug ? { ...c, ...category } : c));

    await saveJsonData("src/data/categories.json", updated);
    return NextResponse.json({ ok: true, categories: updated });
  } catch (err) {
    console.error("Categories API error:", err);
    return NextResponse.json({ error: "Ошибка сохранения категории" }, { status: 500 });
  }
}
