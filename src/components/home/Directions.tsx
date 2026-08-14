import { Tile } from "@/components/ui/Tile";
import { getCategory, getFilledCategories } from "@/lib/content";
import type { Category } from "@/lib/schemas";

/** Витринные направления с главной; остальные категории живут в каталоге. */
const DIRECTION_SLUGS = ["candles", "soap", "gypsum", "decor"] as const;

export function Directions() {
  const filled = new Set(getFilledCategories().map((category) => category.slug));
  const directions = DIRECTION_SLUGS.map((slug) => getCategory(slug)).filter(
    (category): category is Category => category !== undefined && filled.has(category.slug),
  );

  // Нечётное количество оставило бы в сетке белую дыру на месте недостающей
  // плитки — последняя в таком случае занимает всю ширину.
  const oddOnMobile = directions.length % 2 === 1;

  return (
    <div className="mx-auto w-full max-w-[1500px] px-5 md:px-8">
      <p className="eyebrow">Что я делаю</p>
      <h2 className="mt-2 font-display text-3xl leading-tight md:text-5xl">
        {directions.length === 4 ? "Четыре направления" : "Направления"}
      </h2>

      <ul
        className={`frame-grid mt-5 grid-cols-2 md:mt-8 ${
          directions.length === 3 ? "md:grid-cols-3" : "md:grid-cols-4"
        }`}
      >
        {directions.map((category, index) => {
          const isLastOdd = oddOnMobile && index === directions.length - 1;
          return (
            <li key={category.slug} className="contents">
              <Tile
                href={`/catalog/${category.slug}`}
                title={category.title}
                image={category.cover}
                persistentTitle
                className={
                  isLastOdd
                    ? "col-span-2 aspect-[16/9] md:col-span-1 md:aspect-[3/4]"
                    : "aspect-[4/5] md:aspect-[3/4]"
                }
                sizes={
                  directions.length === 3
                    ? "(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
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
