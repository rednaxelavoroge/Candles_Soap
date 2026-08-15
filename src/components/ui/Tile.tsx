import { Media } from "@/components/ui/Media";
import type { ContentImage } from "@/lib/schemas";
import Link from "next/link";

type TileProps = {
  href: string;
  title: string;
  image: ContentImage | null;
  sizes: string;
  priority?: boolean;
  /** Артикул изделия. В разделах он идёт под названием на той же плашке. */
  article?: string;
  /**
   * Держать подпись видимой и на десктопе. Нужно витринным блокам, где название
   * направления — часть композиции, а не подсказка при наведении.
   */
  persistentTitle?: boolean;
  /** Пропорции и раскладка задаются снаружи: `aspect-square md:aspect-[3/4]`. */
  className?: string;
};

/**
 * Плитка каталога. В покое это чистая фотография в белой рамке — сетка должна
 * читаться галереей, а не витриной магазина. Название и артикул проступают
 * только при наведении.
 *
 * Плашка снята с референса заказчицы (azalea.qodeinteractive.com/portfolio-gallery):
 * там она белая с прозрачностью 0.9, кроет плитку целиком, текст выключен по
 * центру по обеим осям, проявляется opacity 0 → 1 за 0.4s. Раньше у нас была
 * узкая полоса по нижнему краю с текстом влево — рисовали по словесному
 * описанию, вслепую.
 *
 * На тач-устройствах наведения не существует. Плашка во весь кадр там была бы
 * приклеена намертво и забелила бы всю сетку, поэтому на них остаётся полоса
 * по нижнему краю. Тем же режимом живут витринные плитки с persistentTitle.
 */
export function Tile({
  href,
  title,
  image,
  sizes,
  priority,
  article,
  persistentTitle = false,
  className,
}: TileProps) {
  // Полоса по нижнему краю: тач-устройства и витринные блоки, где подпись
  // видна всегда. Наведение здесь ничего не переключает.
  const band = "absolute inset-x-0 bottom-0 px-4 py-3 md:px-5 md:py-4";

  // Плашка во весь кадр — только там, где наведение существует.
  const plate = [
    "[@media(hover:hover)]:inset-0",
    "[@media(hover:hover)]:flex",
    "[@media(hover:hover)]:flex-col",
    "[@media(hover:hover)]:items-center",
    "[@media(hover:hover)]:justify-center",
    "[@media(hover:hover)]:p-5",
    "[@media(hover:hover)]:opacity-0",
    "[@media(hover:hover)]:group-hover:opacity-100",
    "[@media(hover:hover)]:group-focus-visible:opacity-100",
  ].join(" ");

  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden bg-sand ${className ?? "aspect-[3/4]"}`}
    >
      <div className="tile-zoom absolute inset-0">
        <Media image={image} sizes={sizes} priority={priority} />
      </div>

      <div
        className={`${band} bg-surface/90 text-center transition-opacity duration-[400ms] ease-[ease] ${
          persistentTitle ? "" : plate
        }`}
      >
        <span className="block font-display text-base leading-tight md:text-xl">{title}</span>

        {article ? (
          <>
            {/* Короткая черта между названием и артикулом — как разделитель
                в референсе, только в нашей глине вместо его розового. */}
            <span aria-hidden="true" className="mx-auto mt-2 block h-px w-8 bg-clay" />
            <span className="mt-2 block text-[0.6875rem] tracking-[0.2em] text-muted uppercase">
              Артикул {article}
            </span>
          </>
        ) : null}
      </div>
    </Link>
  );
}
