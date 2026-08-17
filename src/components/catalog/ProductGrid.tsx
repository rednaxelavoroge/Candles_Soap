import { Tile } from "@/components/ui/Tile";
import { getCover } from "@/lib/content";
import type { Product } from "@/lib/schemas";

/**
 * Раскладка кадров. Заказчица просила уйти от ровных квадратиков:
 * «мне не нравится, что они чётко поделены на ровные квадратики, у меня есть
 * и горизонтальные и вертикальные, они должны вперемешку собираться».
 *
 * Пропорции идут повторяющимся рисунком из шести плиток: широкая на две
 * колонки, две обычные вертикальные, высокая, и снова пара. Рисунок
 * детерминированный — на сервере и в браузере раскладка одна и та же,
 * прыжков при гидратации нет.
 */
const LAYOUT = [
  "aspect-[4/5] md:aspect-[3/4]",
  "aspect-[4/5] md:col-span-2 md:aspect-[16/10]",
  "aspect-[4/5] md:aspect-[3/4]",
  "aspect-[4/5] md:aspect-[4/5]",
  "aspect-[4/5] md:col-span-2 md:aspect-[3/2]",
  "aspect-[4/5] md:aspect-[2/3]",
] as const;

/** Ширина кадра в вёрстке зависит от того, занимает он одну колонку или две. */
const SIZES = [
  "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw",
  "(min-width: 1024px) 50vw, (min-width: 768px) 66vw, 50vw",
  "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw",
  "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw",
  "(min-width: 1024px) 50vw, (min-width: 768px) 66vw, 50vw",
  "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw",
] as const;

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="frame-grid grid-cols-2 md:grid-cols-4">
      {products.map((product, index) => {
        const slot = index % LAYOUT.length;
        return (
          <li key={product.id} className="contents">
            <Tile
              href={`/catalog/${product.category}/${product.slug}`}
              title={product.title}
              image={getCover(product)}
              article={product.article}
              priority={index < 2}
              className={LAYOUT[slot]}
              sizes={SIZES[slot]}
            />
          </li>
        );
      })}
    </ul>
  );
}
