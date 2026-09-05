import { Media } from "@/components/ui/Media";
import { getHeroSlides, getSite, getText } from "@/lib/content";
import Link from "next/link";

export function AboutTeaser() {
  const site = getSite();
  const eyebrow = getText("home.about.eyebrow");
  const button = getText("home.about.button");

  return (
    <section
      id="about"
      className="relative overflow-hidden border-t border-sand/50 bg-bg py-20 md:py-28"
      aria-labelledby="about-heading"
    >
      <div className="relative z-10 mx-auto grid max-w-[1500px] gap-12 px-5 md:grid-cols-2 md:items-center md:gap-20 md:px-8">
        <div className="relative flex justify-center">
          <div className="relative aspect-[4/5] w-full max-w-lg overflow-hidden rounded-2xl md:rounded-3xl bg-sand shadow-[0_12px_40px_rgba(62,43,32,0.08)] transition-transform duration-500 hover:scale-[1.01] md:aspect-[3/4]">
            <Media
              image={site.portrait ?? getHeroSlides()[1]}
              sizes="(min-width: 768px) 45vw, 90vw"
            />
          </div>
        </div>

        <div className="flex flex-col items-start">
          {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          <h2 id="about-heading" className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl md:text-5xl lg:text-6xl">
            {site.owner}
          </h2>
          <p className="mt-6 max-w-prose text-base leading-relaxed text-muted md:text-lg">
            {site.intro}
          </p>
          {button ? (
            <div className="mt-9 flex items-center gap-6">
              <Link
                href="/about"
                className="inline-flex items-center gap-2.5 rounded-full btn-brown px-8 py-3.5 text-xs font-semibold tracking-[0.04em] shadow-md"
              >
                <span>{button}</span>
                <span>→</span>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
