import { Tile } from "@/components/ui/Tile";
import { getCover } from "@/lib/content";
import type { Product } from "@/lib/schemas";

/**
 * Раскладка изделий в каталоге.
 * Использует адаптивные колонки, благодаря чему каждый снимок сохраняет свои
 * естественные пропорции (горизонтальные и вертикальные гармонично чередуются без обрезки).
 */
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="px-5 md:px-8">
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-5 md:gap-6 [column-fill:_balance]">
        {products.map((product, index) => (
          <div key={product.id} className="mb-5 md:mb-6 break-inside-avoid">
            <Tile
              href={`/catalog/${product.category}/${product.slug}`}
              title={product.title}
              image={getCover(product)}
              article={product.article}
              priority={index < 4}
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
