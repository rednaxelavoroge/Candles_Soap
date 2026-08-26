import { Tile } from "@/components/ui/Tile";
import { getCover } from "@/lib/content";
import type { Product } from "@/lib/schemas";

/**
 * Раскладка изделий в каталоге: на смартфонах две колонки, дальше три.
 *
 * Было четыре, и на большом экране плитка выходила по 330 пикселей — изделие
 * в ней рассмотреть нельзя, а страница читалась пустоватой. Три колонки дают
 * те же 440 пикселей, что и в ленте на главной: фотография становится главной,
 * а не подписью к воздуху вокруг.
 */
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="px-4 md:px-8">
      <div className="columns-2 md:columns-3 gap-3.5 md:gap-6 [column-fill:_balance]">
        {products.map((product, index) => (
          <div key={product.id} className="mb-3.5 md:mb-6 break-inside-avoid">
            <Tile
              href={`/catalog/${product.category}/${product.slug}`}
              title={product.title}
              image={getCover(product)}
              article={product.article}
              priority={index < 4}
              sizes="(min-width: 768px) 33vw, 50vw"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
