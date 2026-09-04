import { Tile } from "@/components/ui/Tile";
import { getCover } from "@/lib/content";
import type { Product } from "@/lib/schemas";

/**
 * Распределяет товары по колонкам (2 на смартфонах, 3 на десктопе):
 * - Строго сохраняет последовательность слева-направо (ряд за рядом: 1, 2, 3 в верхнем ряду).
 * - Соседние вертикальные фотографии встают рядом в соседние колонки одного ряда,
 *   благодаря чему тематические серии (например, новогодние свечи) не разлетаются по сайту.
 * - Горизонтальные фотографии органично балансируют высоту колонок без пустот.
 */
function distributeProducts(items: Product[], columnCount: number): Product[][] {
  const columns: Product[][] = Array.from({ length: columnCount }, () => []);
  const heights = Array(columnCount).fill(0);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const minHeight = Math.min(...heights);

    // Выбираем колонку слева-направо, высота которой близка к минимальной (допуск 0.3).
    // Это сохраняет естественный порядок чтения и объединяет соседние кадры в один ряд.
    let chosenCol = -1;
    for (let c = 0; c < columnCount; c++) {
      if (heights[c] <= minHeight + 0.3) {
        chosenCol = c;
        break;
      }
    }
    if (chosenCol === -1) {
      chosenCol = heights.indexOf(minHeight);
    }

    columns[chosenCol].push(item);

    const cover = getCover(item);
    const aspect = cover?.width && cover?.height ? cover.height / cover.width : 1.25;
    heights[chosenCol] += aspect;
  }

  return columns;
}

export function ProductGrid({ products }: { products: Product[] }) {
  const desktopColumns = distributeProducts(products, 3);
  const mobileColumns = distributeProducts(products, 2);

  return (
    <div className="px-4 md:px-8">
      {/* Десктоп и планшеты: 3 колонки, слева-направо */}
      <div className="hidden md:flex gap-6 items-start">
        {desktopColumns.map((column, colIdx) => (
          <div key={`desktop-col-${colIdx}`} className="flex-1 flex flex-col gap-6 min-w-0">
            {column.map((product, itemIdx) => (
              <Tile
                key={product.id}
                href={`/catalog/${product.category}/${product.slug}`}
                title={product.title}
                image={getCover(product)}
                article={product.article}
                priority={itemIdx < 2}
                sizes="(min-width: 768px) 33vw, 50vw"
              />
            ))}
          </div>
        ))}
      </div>

      {/* Смартфоны: 2 колонки, слева-направо */}
      <div className="flex md:hidden gap-3.5 items-start">
        {mobileColumns.map((column, colIdx) => (
          <div key={`mobile-col-${colIdx}`} className="flex-1 flex flex-col gap-3.5 min-w-0">
            {column.map((product, itemIdx) => (
              <Tile
                key={product.id}
                href={`/catalog/${product.category}/${product.slug}`}
                title={product.title}
                image={getCover(product)}
                article={product.article}
                priority={itemIdx < 2}
                sizes="50vw"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
