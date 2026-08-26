import { Media } from "@/components/ui/Media";
import type { ContentImage } from "@/lib/schemas";
import Link from "next/link";

type TileProps = {
  href: string;
  title: string;
  image: ContentImage | null;
  sizes: string;
  priority?: boolean;
  /** Код изделия (например, СВ-05). */
  article?: string;
  persistentTitle?: boolean;
  className?: string;
  natural?: boolean;
};

/**
 * Премиальная плитка изделия.
 * В спокойном состоянии — чистая фотография без каких-либо затемнений или плашек.
 * При наведении на десктопе или касании на мобильном плавно проявляется
 * мягкое затемнение в тёплых тонах с названием изделия, номером и кнопкой «Смотреть».
 * Сохраняет естественные пропорции кадра (горизонтальные не обрезаются).
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
  const overlayClass = persistentTitle
    ? "opacity-100"
    : "opacity-0 group-hover:opacity-100 group-active:opacity-100 group-focus-visible:opacity-100";

  // Вычисляем настоящее соотношение сторон кадра, чтобы горизонтальные и вертикальные фото отображались без обрезки
  const aspectRatio = image?.width && image?.height
    ? `${image.width} / ${image.height}`
    : "4 / 5";

  return (
    <Link
      href={href}
      style={{ aspectRatio }}
      className={`group relative block w-full overflow-hidden rounded-xl md:rounded-2xl bg-sand/30 shadow-[0_2px_10px_rgba(62,43,32,0.04)] transition-all duration-500 hover:shadow-[0_8px_24px_rgba(62,43,32,0.08)] hover:-translate-y-0.5 ${className ?? ""}`}
    >
      <div className="tile-zoom absolute inset-0">
        <Media image={image} sizes={sizes} priority={priority} />
      </div>

      {/* Мягкое затемнение в теплом шоколадном тоне: только по наведению / касанию */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center bg-btn-brown/70 p-3 sm:p-5 text-center backdrop-blur-[3px] transition-opacity duration-300 ease-out ${overlayClass}`}
      >
        <span className="block font-display text-xs sm:text-base font-normal leading-snug text-white drop-shadow-sm">
          {title}
        </span>

        {article ? (
          <>
            <span aria-hidden="true" className="my-1.5 sm:my-2.5 block h-px w-6 sm:w-8 bg-white/40" />
            <span className="block text-[0.625rem] sm:text-xs font-semibold tracking-[0.04em] text-white/90">
              {article}
            </span>
          </>
        ) : null}

        <span className="mt-2 sm:mt-3.5 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 sm:px-3.5 py-0.5 sm:py-1 text-[0.5625rem] sm:text-[0.6875rem] font-medium tracking-[0.02em] text-white backdrop-blur-sm">
          <span>Смотреть</span>
          <span>→</span>
        </span>
      </div>
    </Link>
  );
}
