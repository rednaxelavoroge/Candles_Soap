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
 * Плитка каталога со скруглёнными краями и мягким затемнением на ховере.
 * При наведении плавно проявляется название изделия, артикул и кнопка «Подробнее».
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
  const band = "absolute inset-x-0 bottom-0 px-4 py-3 md:px-5 md:py-4";

  const plate = [
    "[@media(hover:hover)]:inset-0",
    "[@media(hover:hover)]:justify-center",
    "[@media(hover:hover)]:p-5",
    "[@media(hover:hover)]:opacity-0",
    "[@media(hover:hover)]:group-hover:opacity-100",
    "[@media(hover:hover)]:group-focus-visible:opacity-100",
  ].join(" ");

  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-xl bg-sand shadow-sm transition-all duration-300 hover:shadow-md ${className ?? "aspect-[3/4]"}`}
    >
      <div className="tile-zoom absolute inset-0">
        <Media image={image} sizes={sizes} priority={priority} />
      </div>

      <div
        className={`${band} flex flex-col items-center justify-end bg-ink/65 text-center backdrop-blur-[2px] transition-opacity duration-300 ${
          persistentTitle ? "" : plate
        }`}
      >
        <span className="block font-display text-base leading-tight text-white md:text-lg lg:text-xl">
          {title}
        </span>

        {article ? (
          <>
            <span aria-hidden="true" className="my-2 block h-px w-8 bg-white/40" />
            <span className="block text-[0.6875rem] font-medium tracking-[0.2em] text-white/90 uppercase">
              Артикул {article}
            </span>
          </>
        ) : null}

        <span className="mt-3 hidden text-xs font-medium tracking-wider text-sand uppercase group-hover:block">
          Подробнее →
        </span>
      </div>
    </Link>
  );
}
