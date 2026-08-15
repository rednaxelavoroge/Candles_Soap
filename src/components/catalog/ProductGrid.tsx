import { Tile } from "@/components/ui/Tile";
import { getCover } from "@/lib/content";
import type { Product } from "@/lib/schemas";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="frame-grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.id} className="contents">
          <Tile
            href={`/catalog/${product.category}/${product.slug}`}
            title={product.title}
            image={getCover(product)}
            article={product.article}
            priority={index < 2}
            className="aspect-[4/5]"
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          />
        </li>
      ))}
    </ul>
  );
}
