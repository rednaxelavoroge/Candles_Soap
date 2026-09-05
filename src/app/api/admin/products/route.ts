import { checkAdminAuth } from "@/lib/admin-auth";
import { loadJsonData, saveJsonData, saveMediaFile } from "@/lib/data-storage";
import { getCategories, getProducts, getTags } from "@/lib/content";
import type { Category, Product, Tag, Video } from "@/lib/schemas";
import { NextResponse } from "next/server";

const FILE = "src/data/products.json";

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

/** Адрес изделия из названия — латиницей, как делают панель и роут подразделов. */
function toSlug(title: string): string {
  return title
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function currentProductsList(): Promise<Product[]> {
  return loadJsonData<Product[]>(FILE, getProducts());
}

export async function GET() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [products, categories, tags] = await Promise.all([
    currentProductsList(),
    loadJsonData<Category[]>("src/data/categories.json", getCategories()),
    loadJsonData<Tag[]>("src/data/tags.json", getTags()),
  ]);
  return NextResponse.json({ products, categories, tags });
}

export async function POST(req: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { product, imagesData } = body;

    if (!product || !product.title || !product.category) {
      return NextResponse.json({ error: "Не заполнены обязательные поля" }, { status: 400 });
    }

    const currentProducts = await currentProductsList();
    const isNew = !product.id || !currentProducts.some((p) => p.id === product.id);

    // Обработка загруженных новых изображений (base64)
    const processedImages = [...(product.images || [])];
    if (imagesData && Array.isArray(imagesData) && imagesData.length > 0) {
      for (let i = 0; i < imagesData.length; i++) {
        const item = imagesData[i];
        if (item.base64 && item.base64.startsWith("data:")) {
          const base64Data = item.base64.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(base64Data, "base64");
          const slugName = product.slug || `item-${Date.now()}`;
          // Метка времени в имени: иначе повторная загрузка второго кадра
          // перезаписала бы файл первого, и обе карточки показали бы одно фото.
          const fileName = `${slugName}-${Date.now()}-${i + 1}.webp`;
          const savedPath = await saveMediaFile(
            `catalog/${product.category}/${fileName}`,
            buffer,
            "image/webp",
          );

          processedImages.push({
            src: savedPath,
            width: item.width || 1200,
            height: item.height || 1200,
            blurDataURL: item.blurDataURL || "",
            alt: item.alt || product.title,
          });
        }
      }
    }

    if (processedImages.length === 0) {
      return NextResponse.json(
        { error: "У изделия должна остаться хотя бы одна фотография" },
        { status: 400 },
      );
    }

    // Адрес — латиницей: кириллица в ссылке превращается в проценты и не читается.
    let newSlug = product.slug || toSlug(product.title);
    if (!newSlug) newSlug = `izdelie-${Date.now()}`;

    // Адрес страницы правится вручную, поэтому проверяем, что он не занят
    // соседом по категории: два изделия по одному адресу открыть нельзя.
    const slugTaken = currentProducts.some(
      (p) => p.category === product.category && p.slug === newSlug && p.id !== product.id,
    );
    if (slugTaken) {
      return NextResponse.json(
        { error: `Адрес «${newSlug}» уже занят другим изделием в этом разделе` },
        { status: 400 },
      );
    }

    // Поля, которых нет в форме админки, берутся из прежней записи и не теряются.
    // Так сохранилось `tones` — три цвета акварели, снятые с самой обложки
    // командой `npm run tones`: заново их взять неоткуда, а форма о них не знает.
    const existing = currentProducts.find((p) => p.id === product.id);

    /*
      Обложка ролика. Раньше её всегда подменяли первой фотографией — и
      обложка, выбранная в панели из архива, молча терялась. Теперь своя
      обложка остаётся; первая фотография подставляется только тем роликам,
      у которых обложки нет или она указывает на удалённый кадр.
    */
    const incoming: Video[] = Array.isArray(product.videos)
      ? product.videos
      : product.video
        ? [product.video]
        : [];
    const stillPresent = new Set(processedImages.map((image) => image.src));
    const videos: Video[] = incoming.map((item) => {
      const own = item.poster;
      const ownIsProductImage = own && stillPresent.has(own.src);
      const ownIsExternal = own && own.src && !own.src.startsWith(`/catalog/${product.category}/`);
      const poster = own && own.src && (ownIsProductImage || ownIsExternal) ? own : processedImages[0];
      return { ...item, poster: { ...poster, blurDataURL: poster.blurDataURL || processedImages[0].blurDataURL } };
    });
    // Прежнее одиночное поле держим в согласии со списком: по нему читают
    // данные, сохранённые до этой правки.
    const video = videos[0] ?? null;

    const finalProduct: Product = {
      ...existing,
      id: product.id || `p-${Date.now()}`,
      category: product.category,
      slug: newSlug,
      title: product.title,
      article: product.article || `АРТ-${Math.floor(100 + Math.random() * 900)}`,
      description: product.description || "",
      images: processedImages,
      videos,
      video,
      price: product.price !== undefined ? product.price : null,
      specs: product.specs || {},
      tags: product.tags || [],
      // Пустой список — это осознанный выбор «подбирай сам», поэтому поле
      // берётся из формы всегда, а не только когда в нём что-то есть.
      related: Array.isArray(product.related) ? product.related : [],
    };

    let updatedProducts: Product[];
    if (isNew) {
      updatedProducts = [finalProduct, ...currentProducts];
    } else {
      updatedProducts = currentProducts.map((p) => (p.id === finalProduct.id ? finalProduct : p));
    }

    await saveJsonData(FILE, updatedProducts);

    return NextResponse.json({ ok: true, product: finalProduct });
  } catch (err) {
    console.error("Products API error:", err);
    return NextResponse.json({ error: "Ошибка сохранения товара" }, { status: 500 });
  }
}

/**
 * Порядок изделий внутри раздела каталога.
 *
 * Приходит список id в нужной последовательности; `order` расставляется
 * с шагом 10, чтобы вставка нового изделия не требовала пересчёта всей ленты.
 */
export async function PUT(req: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { order } = await req.json();
    if (!Array.isArray(order)) {
      return NextResponse.json({ error: "Порядок не передан" }, { status: 400 });
    }

    const position = new Map<string, number>();
    order.forEach((id: string, index: number) => position.set(id, (index + 1) * 10));

    const products = await currentProductsList();
    const updated = products.map((product) =>
      position.has(product.id) ? { ...product, order: position.get(product.id) } : product,
    );

    await saveJsonData(FILE, updated);
    return NextResponse.json({ ok: true, products: updated });
  } catch (err) {
    console.error("Products reorder error:", err);
    return NextResponse.json({ error: "Ошибка сохранения порядка" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID не указан" }, { status: 400 });
    }

    const currentProducts = await currentProductsList();
    const updated = currentProducts.filter((p) => p.id !== id && p.slug !== id);
    if (updated.length === currentProducts.length) {
      return NextResponse.json({ error: "Изделие не найдено" }, { status: 404 });
    }
    await saveJsonData(FILE, updated);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Products delete error:", err);
    return NextResponse.json({ error: "Ошибка удаления товара" }, { status: 500 });
  }
}
