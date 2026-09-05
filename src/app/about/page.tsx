import { Media } from "@/components/ui/Media";
import { getHeroSlides, getSite, getText } from "@/lib/content";
import { aboutEnquiry, whatsappWith } from "@/lib/contacts";
import type { Metadata } from "next";
import Link from "next/link";

// Название сайта дописывает шаблон из layout.tsx — здесь только имя страницы.
export const metadata: Metadata = {
  title: "Обо мне",
  description: getText("seo.about"),
  openGraph: { title: "Обо мне", description: getText("seo.about") },
};

export default function AboutPage() {
  const site = getSite();
  const whatsapp = whatsappWith(aboutEnquiry());
  const eyebrow = getText("about.eyebrow");
  const philosophyEyebrow = getText("about.philosophyEyebrow");
  const philosophyTitle = getText("about.philosophyTitle");
  const extra = getText("about.extra");
  const whatsappButton = getText("about.whatsappButton");
  const catalogButton = getText("about.catalogButton");

  return (
    <div className="pt-24 md:pt-32">
      <header className="relative overflow-hidden px-5 pb-8 md:px-8 md:pb-12">
        {eyebrow ? <span className="eyebrow relative">{eyebrow}</span> : null}
        <h1 className="relative mt-2 max-w-3xl font-display text-4xl leading-tight text-ink md:text-6xl">
          {site.owner}
        </h1>
      </header>

      <div className="mt-6 grid gap-10 px-5 md:mt-10 md:grid-cols-2 md:gap-16 md:px-8">
        <div className="relative flex justify-center">
          <div className="relative aspect-[4/5] w-full max-w-lg overflow-hidden rounded-2xl md:rounded-3xl bg-sand shadow-[0_12px_40px_rgba(62,43,32,0.08)] transition-transform duration-500 hover:scale-[1.01] md:aspect-[3/4]">
            <Media
              image={site.portrait ?? getHeroSlides()[1]}
              sizes="(min-width: 768px) 45vw, 90vw"
              priority
            />
          </div>
        </div>

        <div className="flex flex-col justify-center">
          {philosophyEyebrow ? <span className="eyebrow">{philosophyEyebrow}</span> : null}
          {philosophyTitle ? (
            <h2 className="mt-2 font-display text-2xl leading-snug text-ink md:text-3xl lg:text-4xl">
              {philosophyTitle}
            </h2>
          ) : null}
          <p className="mt-6 max-w-prose text-base leading-relaxed text-muted md:text-lg">
            {site.intro}
          </p>

          {extra ? (
            <p className="mt-4 max-w-prose text-base leading-relaxed text-muted">{extra}</p>
          ) : null}

          {(whatsapp && whatsappButton) || catalogButton ? (
            <div className="mt-10 flex flex-wrap items-center gap-4">
              {whatsapp && whatsappButton ? (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 rounded-full btn-brown px-8 py-3.5 text-xs font-semibold tracking-[0.04em] shadow-md"
                >
                  <span>{whatsappButton}</span>
                  <span>→</span>
                </a>
              ) : null}
              {catalogButton ? (
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-2 rounded-full btn-brown-outline px-7 py-3.5 text-xs font-semibold tracking-[0.03em]"
                >
                  {catalogButton}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {site.gallery && site.gallery.length > 0 ? (
        // Кадры с самой Анной. Кладкой, а не ровной сеткой: снимки вертикальные
        // и горизонтальные вперемешку, и подгонять их под одну форму значит
        // обрезать то, ради чего кадр снят.
        <section className="mt-20 px-5 md:mt-28 md:px-8">
          <span className="eyebrow">В мастерской и на съёмке</span>
          <div className="mt-6 columns-2 gap-3.5 md:columns-3 md:gap-6 [column-fill:_balance]">
            {site.gallery.map((image, index) => (
              <div
                key={image.src}
                className="mb-3.5 break-inside-avoid overflow-hidden rounded-2xl md:mb-6"
              >
                <div className="relative w-full" style={{ aspectRatio: `${image.width} / ${image.height}` }}>
                  <Media
                    image={image}
                    sizes="(min-width: 768px) 33vw, 50vw"
                    priority={index === 0}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
