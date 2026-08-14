import { Tile } from "@/components/ui/Tile";
import { getCategories, getProductsByCategory } from "@/lib/content";
import { pluralItems } from "@/lib/plural";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Каталог",
  description: "Свечи, мыло, гипс и декор ручной работы — разделы каталога.",
  openGraph: {
    title: "Каталог",
    description: "Свечи, мыло, гипс и декор ручной работы — разделы каталога.",
  },
};

export default function CatalogPage() {
  const categories = getCategories();

  return (
    <div className="pt-24 md:pt-32">
      <header className="px-5 pb-8 md:px-8 md:pb-12">
        <p className="eyebrow">Каталог</p>
        <h1 className="mt-2 font-display text-4xl md:text-6xl">Разделы</h1>
      </header>

      <ul className="frame-grid grid-cols-2 md:grid-cols-4">
        {categories.map((category, index) => {
          const count = getProductsByCategory(category.slug).length;
          return (
            <li key={category.slug} className="contents">
              <Tile
                href={`/catalog/${category.slug}`}
                title={category.title}
                image={category.cover}
                caption={count > 0 ? `${count} ${pluralItems(count)}` : undefined}
                priority={index < 2}
                className="aspect-[4/5] md:aspect-[3/4]"
                sizes="(min-width: 768px) 25vw, 50vw"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
