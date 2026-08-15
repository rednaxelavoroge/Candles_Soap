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
 * только при наведении, на плашке сплошного цвета.
 *
 * На тач-устройствах наведения не существует, поэтому там подпись видна всегда,
 * а вместо неё работает отклик на нажатие.
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
  const revealOnHover = persistentTitle
    ? ""
    : "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-visible:opacity-100 [@media(hover:hover)]:group-hover:opacity-100";

  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden bg-sand ${className ?? "aspect-[3/4]"}`}
    >
      <div className="absolute inset-0 transition-transform duration-[600ms] ease-out will-change-transform group-hover:scale-[1.08] group-active:scale-[1.08] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
        <Media image={image} sizes={sizes} priority={priority} />
      </div>

      <div
        className={`absolute inset-x-0 bottom-0 bg-surface/85 px-4 py-3 opacity-100 transition-opacity duration-500 md:px-5 md:py-4 ${revealOnHover}`}
      >
        <span className="block font-display text-base leading-tight md:text-xl">{title}</span>
        {article ? (
          <span className="mt-1 block text-[0.6875rem] tracking-[0.14em] text-muted uppercase">
            Артикул {article}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
