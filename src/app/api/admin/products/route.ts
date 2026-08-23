import { checkAdminAuth } from "@/lib/admin-auth";
import { saveJsonData, saveMediaFile } from "@/lib/data-storage";
import { getCategories, getProducts, getTags } from "@/lib/content";
import type { Product } from "@/lib/schemas";
import { NextResponse } from "next/server";

export async function GET() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = getProducts();
  const categories = getCategories();
  const tags = getTags();
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

    const currentProducts = getProducts();
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
          const fileName = `${slugName}-${i + 1}.webp`;
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

    const newSlug =
      product.slug ||
      product.title
        .toLowerCase()
        .replace(/[^a-z0-9а-яё]/gi, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    const finalProduct: Product = {
      id: product.id || `p-${Date.now()}`,
      category: product.category,
      slug: newSlug,
      title: product.title,
      article: product.article || `АРТ-${Math.floor(100 + Math.random() * 900)}`,
      description: product.description || "",
      images: processedImages.length > 0 ? processedImages : product.images || [],
      video: product.video || null,
      price: product.price !== undefined ? product.price : null,
      specs: product.specs || {},
      tags: product.tags || [],
    };

    let updatedProducts: Product[];
    if (isNew) {
      updatedProducts = [finalProduct, ...currentProducts];
    } else {
      updatedProducts = currentProducts.map((p) => (p.id === finalProduct.id ? finalProduct : p));
    }

    await saveJsonData("src/data/products.json", updatedProducts);

    return NextResponse.json({ ok: true, product: finalProduct });
  } catch (err) {
    console.error("Products API error:", err);
    return NextResponse.json({ error: "Ошибка сохранения товара" }, { status: 500 });
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

    const currentProducts = getProducts();
    const updated = currentProducts.filter((p) => p.id !== id && p.slug !== id);
    await saveJsonData("src/data/products.json", updated);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка удаления товара" }, { status: 500 });
  }
}
