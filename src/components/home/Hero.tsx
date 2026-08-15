import { Blots } from "@/components/ui/Blots";
import { getHeroSlides, getSite } from "@/lib/content";
import Image from "next/image";

/**
 * Первый экран. Фон бежевый: тёмного поля заказчица не хочет, поэтому кадры
 * стоят не подложкой, а в белой рамке — тем же приёмом, что сетки каталога.
 * Внутри рамки кадры сменяют друг друга с медленным наездом.
 *
 * Текст идёт цветом --ink прямо по фону: плашки и затемнения здесь не нужны.
 * Когда в site.json появится portrait, он встаёт первым кадром смены.
 */
export function Hero() {
  const site = getSite();
  const slides = site.portrait ? [site.portrait, ...getHeroSlides()] : getHeroSlides();

  return (
    <section className="relative flex min-h-svh w-full flex-col overflow-hidden bg-bg">
      <Blots />

      <div className="relative flex flex-1 flex-col justify-center gap-8 px-5 pt-28 pb-24 md:flex-row md:items-center md:gap-14 md:px-8 md:pt-32 md:pb-28">
        <div className="md:flex-1">
          <p className="eyebrow">{site.brand}</p>
          <h1 className="mt-3 font-display text-5xl leading-[0.95] sm:text-6xl md:text-7xl lg:text-8xl">
            {site.owner}
          </h1>
          <p className="mt-5 max-w-md text-sm text-muted md:text-base">{site.tagline}</p>
        </div>

        {/* Белая рамка вокруг кадра — тот же приём, что зазоры в сетках. */}
        <div className="bg-surface p-3 md:p-5 md:shrink-0">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-sand md:h-[62vh] md:w-auto md:aspect-[4/5]">
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
                  sizes="(min-width: 768px) 50vw, 100vw"
                  priority={index === 0}
                  placeholder="blur"
                  blurDataURL={image.blurDataURL}
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="relative flex justify-center pb-6 text-muted md:pb-8"
      >
        <span className="flex flex-col items-center gap-2">
          <span className="text-[0.625rem] tracking-[0.2em] uppercase">Листайте</span>
          <span className="block h-7 w-px bg-clay" />
        </span>
      </div>
    </section>
  );
}
