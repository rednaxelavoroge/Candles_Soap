import { Media } from "@/components/ui/Media";
import { getSite } from "@/lib/content";

/**
 * Первый экран: вертикальный портрет во всю высоту, имя и одна строка
 * позиционирования. Единственное изображение с priority на всём сайте.
 *
 * Подпись лежит на плашке сплошного цвета — тем же приёмом, что и названия
 * на плитках каталога. Градиентной растяжки здесь нет: по брифу теней и
 * градиентов в проекте не бывает, а плашка держит контраст ничуть не хуже.
 */
export function Hero() {
  const site = getSite();

  return (
    <section className="relative h-svh min-h-[560px] w-full overflow-hidden bg-sand">
      {/* Портрет вертикальный: на широком экране object-cover срезает его по
          высоте, и без привязки к верху кадр обрезается по глаза. */}
      <Media image={site.portrait} sizes="100vw" priority className="object-top" />

      <div className="absolute inset-0 flex flex-col justify-end">
        <div className="bg-surface/90 px-5 pt-6 pb-20 md:px-8 md:pt-8 md:pb-16">
          <h1 className="font-display text-5xl leading-[0.95] sm:text-6xl md:text-7xl lg:text-8xl">
            {site.owner}
          </h1>
          <p className="mt-4 max-w-md text-sm text-muted md:mt-5 md:text-base">{site.tagline}</p>
        </div>
      </div>

      {/* Индикатор лежит внутри плашки, поэтому цвет берёт обычный --ink. */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-5 flex justify-center md:bottom-6">
        <span className="flex flex-col items-center gap-2">
          <span className="text-[0.625rem] tracking-[0.2em] uppercase text-muted">Листайте</span>
          <span className="block h-8 w-px bg-clay" />
        </span>
      </div>
    </section>
  );
}
