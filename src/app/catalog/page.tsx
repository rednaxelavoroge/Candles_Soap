import { CatalogSections } from "@/components/catalog/CatalogSections";
import { Blots } from "@/components/ui/Blots";
import { getFilledCategories, getProductsByCategory } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Каталог",
  description: "Свечи, мыло, гипс и декор ручной работы — разделы каталога.",
  openGraph: {
    title: "Каталог",
    description: "Свечи, мыло, гипс и декор ручной работы — разделы каталога.",
  },
};

/**
 * Каталог разделами во весь экран вместо сетки плиток. Так устроен черновик,
 * который показала заказчица: половина экрана с текстом, половина с кадром,
 * стороны чередуются, половины съезжаются и разъезжаются при прокрутке.
 *
 * Текста разделов у нас пока нет: сочинять описание её изделий нельзя —
 * это утверждения о настоящем товаре. Пока стоит количество изделий, поле
 * под её текст готово.
 */
export default function CatalogPage() {
  // Только наполненные разделы: пустая секция во весь экран читается поломкой.
  const categories = getFilledCategories().map((category) => ({
    category,
    count: getProductsByCategory(category.slug).length,
    intro: null,
  }));

  return (
    <div className="pt-24 md:pt-32">
      <header className="relative overflow-hidden px-5 pt-4 pb-10 md:px-8 md:pb-14">
        <Blots variant={1} />
        <p className="eyebrow relative">Каталог</p>
        <h1 className="relative mt-2 font-display text-4xl md:text-6xl">Разделы</h1>
      </header>

      <CatalogSections categories={categories} />
    </div>
  );
}
