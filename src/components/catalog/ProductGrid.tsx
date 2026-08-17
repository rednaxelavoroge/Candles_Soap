import { Tile } from "@/components/ui/Tile";
import { getCover } from "@/lib/content";
import type { Product } from "@/lib/schemas";

/**
 * Кладка изделий. Каждый кадр стоит в своих пропорциях: горизонтальный
 * остаётся горизонтальным, вертикальный — вертикальным, высота у плиток
 * разная. Заказчица просила именно так: «у меня есть и горизонтальные
 * и вертикальные, они должны вперемешку собираться».
 *
 * До этого пропорции задавались шаблоном из шести слотов, и снимок
 * подгонялся под слот обрезкой — вертикальный кадр в горизонтальном слоте
 * терял верх и низ. Получалась та же таблица, от которой она уходила.
 */
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="frame-columns columns-2 md:columns-3 lg:columns-4">
      {products.map((product, index) => (
        <li key={product.id}>
          <Tile
            href={`/catalog/${product.category}/${product.slug}`}
            title={product.title}
            image={getCover(product)}
            article={product.article}
            priority={index < 3}
            natural
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          />
        </li>
      ))}
    </ul>
  );
}
