import { Blots } from "@/components/ui/Blots";
import { Media } from "@/components/ui/Media";
import { getHeroSlides, getSite } from "@/lib/content";
import Link from "next/link";

export function AboutTeaser() {
  const site = getSite();

  return (
    <section
      id="about"
      className="relative overflow-hidden border-t border-sand bg-bg py-16 md:py-24"
      aria-labelledby="about-heading"
    >
      <Blots variant={2} className="opacity-60" />
      <div className="relative z-10 mx-auto grid max-w-[1500px] gap-10 px-5 md:grid-cols-2 md:items-center md:gap-16 md:px-8">
        <div className="relative flex justify-center">
          <div className="relative w-full max-w-lg rounded-xl bg-surface p-3 shadow-sm md:p-5">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-sand md:aspect-[3/4]">
              <Media
                image={site.portrait ?? getHeroSlides()[1]}
                sizes="(min-width: 768px) 45vw, 90vw"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start">
          <span className="eyebrow">О мастере</span>
          <h2 id="about-heading" className="mt-3 font-display text-3xl leading-tight text-ink md:text-5xl">
            {site.owner}
          </h2>
          <p className="mt-6 max-w-prose text-base leading-relaxed text-muted md:text-lg">
            {site.intro}
          </p>
          <div className="mt-8 flex items-center gap-6">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 border border-ink bg-ink px-7 py-3.5 text-sm tracking-wide text-white transition-all duration-300 hover:bg-transparent hover:text-ink"
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
