import { Media } from "@/components/ui/Media";
import { getSite } from "@/lib/content";

/**
 * Первый экран: вертикальный портрет во всю высоту, имя и одна строка
 * позиционирования. Единственное изображение с priority на всём сайте.
 * Пока портрета нет, текст идёт цветом --ink по песочному фону: белый по
 * светлой заливке не прошёл бы по контрасту.
 */
export function Hero() {
  const site = getSite();
  const onPhoto = site.portrait !== null;
  const textColor = onPhoto ? "text-surface" : "text-ink";

  return (
    <section className="relative h-svh min-h-[560px] w-full overflow-hidden bg-sand">
      <Media image={site.portrait} sizes="100vw" priority />

      {/* Нижний отступ разведён со скролл-индикатором, иначе на 375px они наезжают. */}
      <div className="absolute inset-0 flex flex-col justify-end px-5 pb-28 md:px-8 md:pb-24">
        <h1
          className={`font-display text-5xl leading-[0.95] sm:text-6xl md:text-7xl lg:text-8xl ${textColor}`}
        >
          {site.owner}
        </h1>
        <p className={`mt-4 max-w-md text-sm md:mt-5 md:text-base ${textColor}`}>{site.tagline}</p>
      </div>

      <div
        aria-hidden="true"
        className={`absolute inset-x-0 bottom-5 flex justify-center md:bottom-7 ${textColor}`}
      >
        <span className="flex flex-col items-center gap-2">
          <span className="text-[0.625rem] tracking-[0.2em] uppercase">Листайте</span>
          <span className="block h-8 w-px bg-current" />
        </span>
      </div>
    </section>
  );
}
