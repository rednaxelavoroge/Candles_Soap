import { HeroFigure } from "@/components/home/HeroFigure";
import { Media } from "@/components/ui/Media";
import { getFilledCategories, getProducts, getSite } from "@/lib/content";
import { getSocialLinks, whatsappHref } from "@/lib/contacts";
import { pluralItems } from "@/lib/plural";
import type { Metadata } from "next";
import Link from "next/link";

const DESCRIPTION =
  "Анна Манасарян делает свечи, мыло и предметы для дома вручную, малыми партиями.";

export const metadata: Metadata = {
  title: "Обо мне",
  description: DESCRIPTION,
  openGraph: { title: "Обо мне", description: DESCRIPTION },
};

export default function AboutPage() {
  const site = getSite();
  const categories = getFilledCategories();
  const total = getProducts().length;
  const socials = getSocialLinks();
  const whatsapp = whatsappHref(
    `Здравствуйте! Пишу с сайта ${site.domain.replace(/^https?:\/\//, "")}.`,
  );

  return (
    <div className="pt-24 md:pt-32">
      <header className="px-5 md:px-8">
        <p className="eyebrow">Обо мне</p>
        <h1 className="mt-2 max-w-3xl font-display text-4xl leading-tight md:text-6xl">
          {site.owner}
        </h1>
      </header>

      <div className="mt-10 grid gap-10 px-5 md:mt-14 md:grid-cols-2 md:gap-14 md:px-8">
        <div className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden bg-ink">
          {site.portrait ? (
            <Media image={site.portrait} sizes="(min-width: 768px) 45vw, 90vw" priority />
          ) : (
            <HeroFigure className="h-[82%] w-auto" />
          )}
        </div>

        <div className="md:pt-4">
          <p className="max-w-prose text-base leading-relaxed md:text-lg">{site.intro}</p>

          <dl className="mt-10 border-t border-sand">
            <div className="flex gap-6 border-b border-sand py-4">
              <dt className="w-44 shrink-0 text-sm text-muted">Направления</dt>
              <dd className="text-sm">
                {categories.map((category) => category.title).join(" · ")}
              </dd>
            </div>
            <div className="flex gap-6 border-b border-sand py-4">
              <dt className="w-44 shrink-0 text-sm text-muted">Сейчас в каталоге</dt>
              <dd className="text-sm">
                {total} {pluralItems(total)}
              </dd>
            </div>
            <div className="flex gap-6 border-b border-sand py-4">
              <dt className="w-44 shrink-0 text-sm text-muted">Как заказать</dt>
              <dd className="text-sm">
                Написать в WhatsApp или оставить заявку — отвечаю лично
              </dd>
            </div>
          </dl>

          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center border border-ink px-8 py-4 text-sm transition-colors duration-300 hover:bg-ink hover:text-surface"
              >
                Написать в WhatsApp
              </a>
            ) : null}
            <Link href="/catalog" className="link-underline text-sm">
              Смотреть каталог
            </Link>
          </div>

          {socials.length > 0 ? (
            <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <section
        className="mt-16 border-t border-sand px-5 py-14 md:mt-24 md:px-8 md:py-20"
        aria-labelledby="how-heading"
      >
        <p className="eyebrow">Как это работает</p>
        <h2 id="how-heading" className="mt-2 max-w-3xl font-display text-3xl md:text-5xl">
          Малые партии, поэтому почти всё можно повторить под вас
        </h2>
        <p className="mt-6 max-w-prose text-sm leading-relaxed text-muted md:text-base">
          Выберите вещь в каталоге и напишите, что хочется изменить: цвет, аромат, размер,
          надпись на подарочной бирке. Я скажу, что из этого выполнимо и сколько займёт времени.
        </p>
      </section>
    </div>
  );
}
