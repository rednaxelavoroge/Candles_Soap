import { Media } from "@/components/ui/Media";
import { getSite } from "@/lib/content";
import Link from "next/link";

export function AboutTeaser() {
  const site = getSite();

  return (
    <section id="about" className="border-t border-sand py-14 md:py-20" aria-labelledby="about-heading">
      <div className="grid gap-8 px-5 md:grid-cols-2 md:items-center md:gap-14 md:px-8">
        <div className="relative aspect-[4/5] w-full bg-sand md:aspect-[3/4]">
          <Media image={site.portrait} sizes="(min-width: 768px) 45vw, 90vw" />
        </div>

        <div>
          <p className="eyebrow">Обо мне</p>
          <h2 id="about-heading" className="mt-2 font-display text-3xl md:text-5xl">
            {site.owner}
          </h2>
          <p className="mt-5 max-w-prose text-sm leading-relaxed text-muted md:text-base">
            {site.intro}
          </p>
          <Link href="/catalog" className="link-underline mt-7 inline-block text-sm">
            Смотреть каталог
          </Link>
        </div>
      </div>
    </section>
  );
}
