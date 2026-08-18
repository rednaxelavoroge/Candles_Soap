import { Blots } from "@/components/ui/Blots";
import { getHeroSlides, getSite } from "@/lib/content";
import Image from "next/image";
import Link from "next/link";

export function Hero() {
  const site = getSite();
  const slides = site.portrait ? [site.portrait, ...getHeroSlides()] : getHeroSlides();

  return (
    <section className="relative flex min-h-svh w-full flex-col justify-between overflow-hidden bg-bg">
      {/* Фоновые акварельные кляксы в стиле Azalea */}
      <Blots variant={0} className="scale-110 opacity-85" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-1 flex-col justify-center gap-12 px-5 pt-32 pb-16 md:flex-row md:items-center md:gap-20 md:px-8 md:pt-40 md:pb-24">
        {/* Текстовая колонка слева */}
        <div className="flex flex-col items-start md:flex-1">
          <span className="text-xs font-semibold tracking-[0.28em] text-accent uppercase">
            {site.brand} • Atelier
          </span>
          <h1 className="mt-4 font-display text-5xl leading-[0.92] text-ink sm:text-6xl md:text-7xl lg:text-8xl tracking-tight">
            {site.owner}
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted md:text-lg">
            {site.tagline}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-5">
            <a
              href="#catalog"
              className="inline-flex items-center gap-3 rounded-full border border-ink bg-ink px-9 py-4 text-xs font-semibold tracking-[0.2em] text-white uppercase transition-all duration-300 hover:bg-transparent hover:text-ink hover:shadow-lg"
            >
              <span>Смотреть каталог</span>
              <span>↓</span>
            </a>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-full border border-sand bg-surface/90 px-8 py-4 text-xs font-semibold tracking-[0.2em] text-ink uppercase backdrop-blur-sm transition-all duration-300 hover:border-ink hover:bg-surface hover:shadow-md"
            >
              О мастере
            </Link>
          </div>
        </div>

        {/* Рамка с портретом / слайдами справа */}
        <div className="relative flex justify-center md:shrink-0">
          <div className="relative z-10 rounded-2xl bg-surface p-4 shadow-[0_12px_48px_rgba(0,0,0,0.06)] border border-sand/40 transition-transform duration-500 hover:scale-[1.01] md:p-6">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-sand md:h-[62vh] md:w-auto md:aspect-[4/5]">
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
      </div>

      {/* Индикатор скролла */}
      <div
        aria-hidden="true"
        className="relative z-10 flex justify-center pb-8 text-muted md:pb-10"
      >
        <a href="#catalog" className="group flex flex-col items-center gap-2 text-muted transition-colors hover:text-ink">
          <span className="text-[0.625rem] font-semibold tracking-[0.3em] uppercase">Листайте вниз</span>
          <span className="block h-8 w-px bg-clay transition-transform duration-300 group-hover:scale-y-125" />
        </a>
      </div>
    </section>
  );
}
