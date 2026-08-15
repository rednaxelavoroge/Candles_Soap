import { Blots } from "@/components/ui/Blots";
import { DragScroller } from "@/components/ui/DragScroller";
import { Tile } from "@/components/ui/Tile";
import { getCover, getFeaturedProducts } from "@/lib/content";

/** Полоса избранного: свайп на мобиле, перетаскивание мышью на десктопе. */
export function FeaturedStrip() {
  const products = getFeaturedProducts(8);
  if (products.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden border-t border-sand py-14 md:py-20"
      aria-labelledby="featured-heading"
    >
      <Blots variant={1} />
      <div className="relative mb-6 px-5 md:mb-9 md:px-8">
        <p className="eyebrow">Избранное</p>
        <h2 id="featured-heading" className="mt-2 font-display text-3xl md:text-5xl">
          Готово к отправке
        </h2>
      </div>

      <DragScroller className="relative px-5 md:px-8">
        <ul className="flex w-max gap-3 md:gap-5">
          {products.map((product) => (
            <li key={product.id} className="w-[68vw] max-w-[340px] shrink-0 sm:w-[46vw] md:w-[24vw]">
              <Tile
                href={`/catalog/${product.category}/${product.slug}`}
                title={product.title}
                image={getCover(product)}
                article={product.article}
                className="aspect-[4/5]"
                sizes="(min-width: 768px) 24vw, 68vw"
              />
            </li>
          ))}
        </ul>
      </DragScroller>
    </section>
  );
}
