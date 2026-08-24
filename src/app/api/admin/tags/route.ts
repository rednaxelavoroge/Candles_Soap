import { checkAdminAuth } from "@/lib/admin-auth";
import { getTags } from "@/lib/content";
import { saveJsonData } from "@/lib/data-storage";
import type { Tag } from "@/lib/schemas";
import { NextResponse } from "next/server";

/**
 * Подразделы каталога. Раздел — это тег в пределах категории: «Мыло → Морская
 * тема». Отдельной сущности под него нет намеренно, иначе изделие с двумя
 * темами пришлось бы заводить дважды.
 *
 * Новый подраздел появляется на сайте не в момент создания, а когда его
 * отметят хотя бы у одного изделия: пустых разделов в каталоге не бывает.
 */

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

/** Адрес раздела виден в строке браузера, поэтому слаг делаем латиницей. */
function toSlug(title: string): string {
  return title
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ tags: getTags() });
}

export async function POST(req: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { title } = await req.json();
    const clean = typeof title === "string" ? title.trim() : "";
    if (!clean) {
      return NextResponse.json({ error: "Название подраздела пустое" }, { status: 400 });
    }

    const current = getTags();

    // Такой подраздел уже есть — возвращаем его, а не заводим двойника.
    const sameTitle = current.find(
      (tag) => tag.title.toLowerCase() === clean.toLowerCase(),
    );
    if (sameTitle) {
      return NextResponse.json({ ok: true, tag: sameTitle, tags: current, existed: true });
    }

    let slug = toSlug(clean);
    if (!slug) slug = `razdel-${current.length + 1}`;
    // Разные названия могут дать один слаг («Сердце» и «Сердце») — разводим их.
    if (current.some((tag) => tag.slug === slug)) {
      slug = `${slug}-${current.length + 1}`;
    }

    const maxOrder = current.reduce((max, tag) => Math.max(max, tag.order ?? 0), 0);

    const tag: Tag = {
      slug,
      title: clean,
      // Группы остались от прежних фильтров «Повод / Кому / Форма». Фильтров
      // на сайте больше нет, порядок разделов задаёт `order`, поэтому новые
      // подразделы заводятся в общей группе.
      group: "occasion",
      order: maxOrder + 10,
    };

    const updated = [...current, tag];
    await saveJsonData("src/data/tags.json", updated);

    return NextResponse.json({ ok: true, tag, tags: updated });
  } catch (err) {
    console.error("Tags API error:", err);
    return NextResponse.json({ error: "Ошибка создания подраздела" }, { status: 500 });
  }
}
