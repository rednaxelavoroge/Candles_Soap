import { getSite } from "@/lib/content";
import Image from "next/image";
import Link from "next/link";

export function Hero() {
  const site = getSite();
  const portrait = site.portrait;

  return (
    <section className="relative flex min-h-svh w-full flex-col justify-center overflow-hidden bg-bg">
      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-1 flex-col justify-center items-center gap-8 px-5 pt-24 pb-12 md:flex-row md:items-center md:gap-16 md:px-8 md:pt-32 md:pb-16">
        
        {/* Портрет Анны со свечой: чистый кадр с мягким скруглением без двойных белых рамок */}
        {portrait ? (
          <div className="relative flex justify-center shrink-0">
            <div className="relative h-[240px] w-[185px] sm:h-[300px] sm:w-[230px] md:h-[60vh] md:w-[400px] overflow-hidden rounded-2xl bg-sand shadow-[0_12px_36px_rgba(62,43,32,0.08)] transition-transform duration-500 hover:scale-[1.01]">
              <Image
                src={portrait.src}
                alt={portrait.alt}
                fill
                sizes="(min-width: 768px) 400px, 240px"
                priority
                placeholder="blur"
                blurDataURL={portrait.blurDataURL}
                className="object-cover"
              />
            </div>
          </div>
        ) : null}

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
    </section>
  );
}
