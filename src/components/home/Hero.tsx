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
      <Blots variant={0} className="scale-110 opacity-80" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-1 flex-col justify-center items-center gap-6 px-5 pt-24 pb-10 md:flex-row md:items-center md:gap-16 md:px-8 md:pt-32 md:pb-16">
        
        {/* Рамка с портретом Анны со свечой: видна сразу на первом экране и на телефоне, и на ПК */}
        <div className="relative flex justify-center shrink-0">
          <div className="relative z-10 rounded-2xl bg-surface p-2.5 sm:p-3.5 shadow-[0_10px_36px_rgba(62,43,32,0.08)] border border-sand/60 transition-transform duration-500 hover:scale-[1.01] md:p-5">
            <div className="relative h-[220px] w-[170px] sm:h-[280px] sm:w-[210px] md:h-[58vh] md:w-[380px] overflow-hidden rounded-xl bg-sand">
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
                    sizes="(min-width: 768px) 400px, 220px"
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

        {/* Текстовая колонка */}
        <div className="flex flex-col items-center text-center md:items-start md:text-left md:flex-1">
          <span className="text-xs font-semibold tracking-[0.28em] text-accent uppercase">
            {site.brand}
          </span>
          <h1 className="mt-2.5 font-display text-3xl leading-[0.95] text-ink sm:text-5xl md:text-6xl lg:text-7xl tracking-tight">
            {site.owner}
          </h1>
          <p className="mt-3 max-w-lg text-xs leading-relaxed text-muted sm:text-sm md:text-base lg:text-lg">
            {site.tagline}
          </p>

          <div className="mt-6 flex flex-wrap justify-center md:justify-start items-center gap-3.5">
            <a
              href="#catalog"
              className="inline-flex items-center gap-2.5 rounded-full btn-brown px-7 py-3 text-xs font-semibold tracking-[0.18em] uppercase shadow-md"
            >
              <span>Смотреть каталог</span>
              <span>↓</span>
            </a>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-full btn-brown-outline px-6 py-3 text-xs font-semibold tracking-[0.18em] uppercase"
            >
              О мастере
            </Link>
          </div>
        </div>
      </div>

      {/* Индикатор скролла */}
      <div
        aria-hidden="true"
        className="relative z-10 flex justify-center pb-4 text-muted md:pb-6"
      >
        <a href="#catalog" className="group flex flex-col items-center gap-1.5 text-muted transition-colors hover:text-ink">
          <span className="text-[0.5625rem] font-semibold tracking-[0.25em] uppercase">Листайте вниз</span>
          <span className="block h-5 w-px bg-clay transition-transform duration-300 group-hover:scale-y-125" />
        </a>
      </div>
    </section>
  );
}
