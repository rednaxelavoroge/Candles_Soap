import { getHeroSlides, getSite } from "@/lib/content";
import Image from "next/image";

/**
 * Первый экран: полноэкранная смена кадров каталога с медленным наездом.
 * Пока фотографии хозяйки нет, витриной работают её собственные изделия —
 * это сильнее любой иллюстрации. Когда в site.json появится portrait,
 * он встаёт первым кадром и смена начинается с него.
 *
 * Подпись лежит на полосе сплошного цвета: кадры разные, и белый текст
 * прямо по фотографии на каком-нибудь из них обязательно потеряется.
 * Градиентной растяжки здесь нет — по брифу их в проекте не бывает.
 */
export function Hero() {
  const site = getSite();
  const slides = site.portrait ? [site.portrait, ...getHeroSlides()] : getHeroSlides();

  return (
    <section className="relative h-svh min-h-[560px] w-full overflow-hidden bg-ink">
      {slides.map((image, index) => (
        <div
          key={image.src}
          className="hero-slide absolute inset-0"
          style={{ "--delay": `${index * 7}s` } as React.CSSProperties}
          aria-hidden={index > 0}
        >
          <Image
            src={image.src}
            alt={index === 0 ? image.alt : ""}
            fill
            sizes="100vw"
            priority={index === 0}
            placeholder="blur"
            blurDataURL={image.blurDataURL}
            className="object-cover"
          />
        </div>
      ))}

      <div className="absolute inset-x-0 bottom-0 bg-ink/80 px-5 pt-8 pb-24 md:px-8 md:pt-10 md:pb-20">
        <p className="eyebrow text-clay">{site.brand}</p>
        <h1 className="mt-3 font-display text-5xl leading-[0.95] text-surface sm:text-6xl md:text-7xl lg:text-8xl">
          {site.owner}
        </h1>
        <p className="mt-4 max-w-md text-sm text-sand md:mt-5 md:text-base">{site.tagline}</p>
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-6 flex justify-center text-surface md:bottom-7"
      >
        <span className="flex flex-col items-center gap-2">
          <span className="text-[0.625rem] tracking-[0.2em] uppercase">Листайте</span>
          <span className="block h-7 w-px bg-current" />
        </span>
      </div>
    </section>
  );
}
