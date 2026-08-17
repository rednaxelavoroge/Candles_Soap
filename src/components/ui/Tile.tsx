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
  /**
   * Держать собственные пропорции снимка вместо заданных снаружи. Нужно
   * кладке каталога: горизонтальный кадр должен остаться горизонтальным,
   * а не обрезаться под общий размер плитки.
   */
  natural?: boolean;
};

/**
 * Плитка каталога. В покое это чистая фотография — сетка должна читаться
 * галереей, а не витриной магазина.
 *
 * При наведении кадр темнеет и на нём проступают название и артикул — так
 * заказчица описала это словами: «наводишь пальчиком или мышкой, он сразу
 * темнеет, название и артикул, потому что часто люди не хотят открывать,
 * увидели и название выписали». До этого здесь была белая плашка, снятая
 * с azalea; её просьба точнее — оставляем затемнение.
 *
 * Затемнение берётся тоном --ink с прозрачностью, а не чистым чёрным:
 * чёрного заказчица не хочет нигде.
 *
 * На тач-устройствах наведения нет, поэтому там подпись держится всегда —
 * иначе в сетке не понять, что где. Тем же режимом живут витринные плитки.
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
  natural = false,
}: TileProps) {
  const naturalRatio =
    natural && image ? { aspectRatio: `${image.width} / ${image.height}` } : undefined;
  // Полоса по нижнему краю: тач-устройства и витринные плитки, где подпись
  // видна всегда. Затемнять там весь кадр нельзя — фотографии в сетке
  // потемнели бы разом и навсегда.
  const band = "absolute inset-x-0 bottom-0 px-4 py-3 md:px-5 md:py-4";

  // Затемнение во весь кадр — только там, где есть наведение.
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
      style={naturalRatio}
      className={`group relative block overflow-hidden rounded-md bg-sand ${
        natural ? "" : (className ?? "aspect-[3/4]")
      }`}
    >
      <div className="tile-zoom absolute inset-0">
        <Media image={image} sizes={sizes} priority={priority} />
      </div>

      <div
        className={`${band} flex flex-col items-center justify-end bg-ink/55 text-center transition-opacity duration-[400ms] ease-[ease] ${
          persistentTitle ? "" : plate
        }`}
      >
        <span className="block font-display text-base leading-tight text-white md:text-xl">
          {title}
        </span>

        {article ? (
          <>
            <span aria-hidden="true" className="mt-2 block h-px w-8 bg-white/50" />
            <span className="mt-2 block text-[0.6875rem] tracking-[0.2em] text-white/80 uppercase">
              Артикул {article}
            </span>
          </>
        ) : null}
      </div>
    </Link>
  );
}
