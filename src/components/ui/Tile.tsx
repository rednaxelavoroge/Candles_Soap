import { Media } from "@/components/ui/Media";
import type { ContentImage } from "@/lib/schemas";
import Link from "next/link";

type TileProps = {
  href: string;
  title: string;
  image: ContentImage | null;
  sizes: string;
  priority?: boolean;
  /** Код изделия (например, СВ-05). Выводится без слова «Артикул». */
  article?: string;
  /** Держать подпись видимой всегда (только для витринных блоков). */
  persistentTitle?: boolean;
  className?: string;
  natural?: boolean;
};

/**
 * Премиальная плитка изделия.
 * В спокойном состоянии — чистая фотография без каких-либо затемнений или плашек.
 * При наведении на десктопе или касании на мобильном плавно проявляется
 * мягкое затемнение с названием изделия, номером и кнопкой «Смотреть».
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
      className={`group relative block w-full overflow-hidden rounded-2xl bg-sand/30 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 ${className ?? ""}`}
    >
      <div className="tile-zoom absolute inset-0">
        <Media image={image} sizes={sizes} priority={priority} />
      </div>

      {/* Мягкое затемнение с названием и номером: только по наведению / касанию */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center bg-ink/60 p-5 text-center backdrop-blur-[3px] transition-opacity duration-300 ease-out ${overlayClass}`}
      >
        <span className="block font-display text-base font-normal leading-snug text-white sm:text-lg lg:text-xl drop-shadow-sm">
          {title}
        </span>

        {article ? (
          <>
            <span aria-hidden="true" className="my-2.5 block h-px w-8 bg-white/40" />
            <span className="block text-xs font-semibold tracking-[0.2em] text-white/90 uppercase">
              {article}
            </span>
          </>
        ) : null}

        <span className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 text-[0.6875rem] font-medium tracking-wider text-white uppercase backdrop-blur-sm">
          <span>Смотреть</span>
          <span>→</span>
        </span>
      </div>
    </Link>
  );
}
