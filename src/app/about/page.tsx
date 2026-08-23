import { Media } from "@/components/ui/Media";
import { getFilledCategories, getProducts, getHeroSlides, getSite } from "@/lib/content";
import { getSocialLinks, whatsappHref } from "@/lib/contacts";
import { pluralItems } from "@/lib/plural";
import type { Metadata } from "next";
import Link from "next/link";

const DESCRIPTION =
  "Анна Манасарян создаёт свечи, декоративное мыло и предметы интерьера вручную, малыми авторскими партиями.";

export const metadata: Metadata = {
  title: "Обо мне — AnnaManasaryan.Art",
  description: DESCRIPTION,
  openGraph: { title: "Обо мне — AnnaManasaryan.Art", description: DESCRIPTION },
};

export default function AboutPage() {
  const site = getSite();
  const categories = getFilledCategories();
  const total = getProducts().length;
  const socials = getSocialLinks();
  const whatsapp = whatsappHref(
    `Здравствуйте, Анна! Пишу с сайта ${site.domain.replace(/^https?:\/\//, "")} — хочу уточнить по изделиям.`,
  );

  return (
    <div className="pt-24 md:pt-32">
      <header className="relative overflow-hidden px-5 pb-8 md:px-8 md:pb-12">
        <span className="eyebrow relative">Автор и мастер</span>
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
          <span className="eyebrow">Философия мастерской</span>
          <h2 className="mt-2 font-display text-2xl leading-snug text-ink md:text-3xl lg:text-4xl">
            Вещи, которые наполняют дом теплом и уютом
          </h2>
          <p className="mt-6 max-w-prose text-base leading-relaxed text-muted md:text-lg">
            {site.intro}
          </p>

          <p className="mt-4 max-w-prose text-base leading-relaxed text-muted">
            Каждое изделие — результат ручного труда и внимания к деталям: от выбора натурального соевого воска и фитилей до подбора благородных ароматов и бархатистой фактуры скульптурного гипса.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 rounded-full btn-brown px-8 py-3.5 text-xs font-semibold tracking-[0.2em] uppercase shadow-md"
              >
                <span>Связаться в WhatsApp</span>
                <span>→</span>
              </a>
            ) : null}
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 rounded-full btn-brown-outline px-7 py-3.5 text-xs font-semibold tracking-[0.18em] uppercase"
            >
              Перейти в каталог
            </Link>
          </div>
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
