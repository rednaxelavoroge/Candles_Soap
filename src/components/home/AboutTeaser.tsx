import { Blots } from "@/components/ui/Blots";
import { Media } from "@/components/ui/Media";
import { getHeroSlides, getSite } from "@/lib/content";
import Link from "next/link";

export function AboutTeaser() {
  const site = getSite();

  return (
    <section
      id="about"
      className="relative overflow-hidden border-t border-sand/50 bg-bg py-20 md:py-28"
      aria-labelledby="about-heading"
    >
      <Blots variant={2} className="opacity-70" />
      <div className="relative z-10 mx-auto grid max-w-[1500px] gap-12 px-5 md:grid-cols-2 md:items-center md:gap-20 md:px-8">
        <div className="relative flex justify-center">
          <div className="relative w-full max-w-lg rounded-2xl bg-surface p-4 shadow-[0_12px_48px_rgba(0,0,0,0.05)] border border-sand/40 transition-transform duration-500 hover:scale-[1.01] md:p-6">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-sand md:aspect-[3/4]">
              <Media
                image={site.portrait ?? getHeroSlides()[1]}
                sizes="(min-width: 768px) 45vw, 90vw"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start">
          <span className="eyebrow">О мастере</span>
          <h2 id="about-heading" className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl md:text-5xl lg:text-6xl">
            {site.owner}
          </h2>
          <p className="mt-6 max-w-prose text-base leading-relaxed text-muted md:text-lg">
            {site.intro}
          </p>
          <div className="mt-9 flex items-center gap-6">
            <Link
              href="/about"
              className="inline-flex items-center gap-2.5 rounded-full border border-ink bg-ink px-8 py-3.5 text-xs font-semibold tracking-[0.2em] text-white uppercase transition-all duration-300 hover:bg-transparent hover:text-ink hover:shadow-lg"
            >
              <span>Подробнее обо мне</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
