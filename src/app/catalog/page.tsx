import { Blots } from "@/components/ui/Blots";
import { Tile } from "@/components/ui/Tile";
import { getFilledCategories } from "@/lib/content";
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
  // Только наполненные разделы: пустая плитка в сетке выглядит как поломка.
  const categories = getFilledCategories();
  const oddOnMobile = categories.length % 2 === 1;

  return (
    <div className="pt-24 md:pt-32">
      <header className="relative overflow-hidden px-5 pt-4 pb-10 md:px-8 md:pb-14">
        <Blots variant={1} />
        <p className="eyebrow relative">Каталог</p>
        <h1 className="relative mt-2 font-display text-4xl md:text-6xl">Разделы</h1>
      </header>

      <ul
        className={`frame-grid grid-cols-2 ${
          categories.length === 3 ? "md:grid-cols-3" : "md:grid-cols-4"
        }`}
      >
        {categories.map((category, index) => {
          const isLastOdd = oddOnMobile && index === categories.length - 1;
          return (
            <li key={category.slug} className="contents">
              <Tile
                href={`/catalog/${category.slug}`}
                title={category.title}
                image={category.cover}
                priority={index < 2}
                className={
                  isLastOdd
                    ? "col-span-2 aspect-[16/9] md:col-span-1 md:aspect-[3/4]"
                    : "aspect-[4/5] md:aspect-[3/4]"
                }
                sizes={
                  categories.length === 3
                    ? "(min-width: 768px) 33vw, 100vw"
                    : "(min-width: 768px) 25vw, 50vw"
                }
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
