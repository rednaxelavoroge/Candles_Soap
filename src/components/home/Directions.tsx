import { Tile } from "@/components/ui/Tile";
import { getCategory } from "@/lib/content";

/** Четыре витринных направления с главной; остальные категории живут в каталоге. */
const DIRECTION_SLUGS = ["candles", "soap", "gypsum", "decor"] as const;

export function Directions() {
  const directions = DIRECTION_SLUGS.map((slug) => getCategory(slug)).filter(
    (category) => category !== undefined,
  );

  return (
    <div className="mx-auto w-full max-w-[1500px] px-5 md:px-8">
      <p className="eyebrow">Что я делаю</p>
      <h2 className="mt-2 font-display text-3xl leading-tight md:text-5xl">Четыре направления</h2>

      <ul className="frame-grid mt-5 grid-cols-2 md:mt-8 md:grid-cols-4">
        {directions.map((category) => (
          <li key={category.slug} className="contents">
            <Tile
              href={`/catalog/${category.slug}`}
              title={category.title}
              image={category.cover}
              persistentTitle
              className="aspect-[4/5] md:aspect-[3/4]"
              sizes="(min-width: 768px) 25vw, 50vw"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
