import { Media } from "@/components/ui/Media";
import type { ContentImage } from "@/lib/schemas";
import Link from "next/link";

type TileProps = {
  href: string;
  title: string;
  image: ContentImage | null;
  sizes: string;
  priority?: boolean;
  caption?: string;
  /**
   * Держать подпись видимой и на десктопе. Нужно витринным блокам, где название
   * направления — часть композиции, а не подсказка при наведении.
   */
  persistentTitle?: boolean;
  /** Пропорции и раскладка задаются снаружи: `aspect-square md:aspect-[3/4]`. */
  className?: string;
};

/**
 * Плитка каталога. При наведении изображение увеличивается внутри неизменной
 * рамки (overflow: hidden на обёртке), название проступает поверх на плашке
 * сплошного цвета — теней и градиентов в проекте нет.
 * На тач-устройствах (hover: none) название видно всегда, zoom выключен.
 */
export function Tile({
  href,
  title,
  image,
  sizes,
  priority,
  caption,
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
      <div className="absolute inset-0 transition-transform duration-[600ms] ease-out will-change-transform group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
        <Media image={image} sizes={sizes} priority={priority} />
      </div>

      <div
        className={`absolute inset-x-0 bottom-0 bg-surface/90 px-3 py-2.5 opacity-100 transition-opacity duration-500 md:px-5 md:py-4 ${revealOnHover}`}
      >
        <span className="block font-display text-base leading-tight md:text-xl">{title}</span>
        {caption ? <span className="mt-0.5 block text-xs text-muted">{caption}</span> : null}
      </div>
    </Link>
  );
}
