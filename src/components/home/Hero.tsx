import { HeroFigure } from "@/components/home/HeroFigure";
import { Media } from "@/components/ui/Media";
import { getSite } from "@/lib/content";

/**
 * Первый экран. Пока фотографии хозяйки нет, показываем рисованный образ:
 * он не лежит подложкой под текстом, а стоит рядом, поэтому подпись читается
 * без плашек и затемнений. Как только в site.json появится portrait, экран
 * переключается на полноэкранный снимок.
 */
export function Hero() {
  const site = getSite();

  if (site.portrait) {
    return (
      <section className="relative h-svh min-h-[560px] w-full overflow-hidden bg-ink">
        <Media image={site.portrait} sizes="100vw" priority className="object-center" />
        <div className="absolute inset-0 flex flex-col justify-end px-5 pb-28 md:px-8 md:pb-24">
          <h1 className="font-display text-5xl leading-[0.95] text-surface sm:text-6xl md:text-7xl lg:text-8xl">
            {site.owner}
          </h1>
          <p className="mt-4 max-w-md text-sm text-surface md:mt-5 md:text-base">{site.tagline}</p>
        </div>
        <ScrollCue />
      </section>
    );
  }

  return (
    <section className="relative flex h-svh min-h-[560px] w-full flex-col overflow-hidden bg-ink">
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 pt-20 pb-28 md:flex-row md:items-end md:gap-10 md:px-8 md:pb-24">
        <HeroFigure className="h-[42vh] w-auto shrink-0 md:order-2 md:h-[70vh]" />

        <div className="w-full md:order-1 md:flex-1">
          <h1 className="font-display text-5xl leading-[0.95] text-surface sm:text-6xl md:text-7xl lg:text-8xl">
            {site.owner}
          </h1>
          <p className="mt-4 max-w-md text-sm text-surface/80 md:mt-5 md:text-base">
            {site.tagline}
          </p>
        </div>
      </div>

      <ScrollCue />
    </section>
  );
}

function ScrollCue() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 bottom-5 flex justify-center text-surface md:bottom-6"
    >
      <span className="flex flex-col items-center gap-2">
        <span className="text-[0.625rem] tracking-[0.2em] uppercase">Листайте</span>
        <span className="block h-8 w-px bg-current" />
      </span>
    </div>
  );
}
