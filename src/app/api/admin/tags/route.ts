import { checkAdminAuth } from "@/lib/admin-auth";
import { getProducts, getTags } from "@/lib/content";
import { loadJsonData, saveJsonData } from "@/lib/data-storage";
import type { Product, Tag } from "@/lib/schemas";
import { NextResponse } from "next/server";

/**
 * Подразделы каталога. Раздел — это тег в пределах категории: «Мыло → Морская
 * тема». Отдельной сущности под него нет намеренно, иначе изделие с двумя
 * темами пришлось бы заводить дважды.
 *
 * Новый подраздел появляется на сайте не в момент создания, а когда его
 * отметят хотя бы у одного изделия: пустых разделов в каталоге не бывает.
 */

const FILE = "src/data/tags.json";
const PRODUCTS_FILE = "src/data/products.json";

function currentTags(): Promise<Tag[]> {
  return loadJsonData<Tag[]>(FILE, getTags());
}

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

/**
 * Пересчитывает `order` подряд идущими числами. Перестановка ↑↓ иначе упирается
 * в подразделы, у которых порядок не проставлен вовсе.
 */
function renumber(tags: Tag[]): Tag[] {
  return tags.map((tag, index) => ({ ...tag, order: (index + 1) * 10 }));
}

export async function GET() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ tags: await currentTags() });
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

    const current = await currentTags();

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
    await saveJsonData(FILE, updated);

    return NextResponse.json({ ok: true, tag, tags: updated });
  } catch (err) {
    console.error("Tags API error:", err);
    return NextResponse.json({ error: "Ошибка создания подраздела" }, { status: 500 });
  }
}

/**
 * Переименование подраздела и порядок показа.
 *
 * Слаг при переименовании не меняется: он стоит в адресе раздела, и смена
 * названия не должна ронять ссылки, которые заказчица уже кому-то отправила.
 */
export async function PUT(req: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { slug, title, order } = await req.json();
    const list = await currentTags();

    // Целиком новый порядок: приходит список слагов в нужной последовательности.
    if (Array.isArray(order)) {
      const bySlug = new Map(list.map((tag) => [tag.slug, tag]));
      const reordered: Tag[] = [];
      for (const key of order) {
        const tag = bySlug.get(key);
        if (tag) {
          reordered.push(tag);
          bySlug.delete(key);
        }
      }
      reordered.push(...bySlug.values());

      const updated = renumber(reordered);
      await saveJsonData(FILE, updated);
      return NextResponse.json({ ok: true, tags: updated });
    }

    const clean = typeof title === "string" ? title.trim() : "";
    if (!slug || !clean) {
      return NextResponse.json({ error: "Не указан подраздел или новое название" }, { status: 400 });
    }
    if (!list.some((tag) => tag.slug === slug)) {
      return NextResponse.json({ error: "Подраздел не найден" }, { status: 404 });
    }

    const updated = list.map((tag) => (tag.slug === slug ? { ...tag, title: clean } : tag));
    await saveJsonData(FILE, updated);
    return NextResponse.json({ ok: true, tags: updated });
  } catch (err) {
    console.error("Tags update error:", err);
    return NextResponse.json({ error: "Ошибка сохранения подраздела" }, { status: 500 });
  }
}

/**
 * Удаление подраздела. Тег снимается и со всех изделий: иначе сборка упадёт на
 * проверке «товар ссылается на неизвестный тег».
 */
export async function DELETE(req: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    if (!slug) return NextResponse.json({ error: "Подраздел не указан" }, { status: 400 });

    const list = await currentTags();
    const updated = list.filter((tag) => tag.slug !== slug);
    if (updated.length === list.length) {
      return NextResponse.json({ error: "Подраздел не найден" }, { status: 404 });
    }

    const products = await loadJsonData<Product[]>(PRODUCTS_FILE, getProducts());
    const touched = products.filter((product) => product.tags.includes(slug));

    /*
      Оба файла кладём в одну пачку и ждём их вместе. Удаление подраздела —
      одно действие заказчицы, значит и коммит один. Если дождаться первой
      записи, пачка уедет без второй, и получатся два коммита и две выкладки.
    */
    const writes: Promise<void>[] = [];
    if (touched.length > 0) {
      const cleaned = products.map((product) =>
        product.tags.includes(slug)
          ? { ...product, tags: product.tags.filter((tag) => tag !== slug) }
          : product,
      );
      writes.push(saveJsonData(PRODUCTS_FILE, cleaned));
    }
    writes.push(saveJsonData(FILE, updated));
    await Promise.all(writes);
    return NextResponse.json({ ok: true, tags: updated, detached: touched.length });
  } catch (err) {
    console.error("Tags delete error:", err);
    return NextResponse.json({ error: "Ошибка удаления подраздела" }, { status: 500 });
  }
}
