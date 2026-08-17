import { Blots } from "@/components/ui/Blots";
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
        <Blots variant={2} className="opacity-60" />
        <span className="eyebrow relative">Автор и мастер</span>
        <h1 className="relative mt-2 max-w-3xl font-display text-4xl leading-tight text-ink md:text-6xl">
          {site.owner}
        </h1>
      </header>

      <div className="mt-6 grid gap-10 px-5 md:mt-10 md:grid-cols-2 md:gap-16 md:px-8">
        <div className="relative flex justify-center">
          <div className="relative w-full max-w-lg rounded-xl bg-surface p-3 shadow-sm md:p-5">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-sand md:aspect-[3/4]">
              <Media
                image={site.portrait ?? getHeroSlides()[1]}
                sizes="(min-width: 768px) 45vw, 90vw"
                priority
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <p className="max-w-prose text-base leading-relaxed text-ink md:text-lg">
            {site.intro}
          </p>

          <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted md:text-base">
            Вдохновляясь природными формами, цветами и фактурами, я подбираю натуральные воски, ароматические композиции и качественные минеральные составы. Каждое изделие уникально и создаётся в единственном экземпляре или лимитированной серией.
          </p>

          <dl className="mt-8 divide-y divide-sand border-y border-sand">
            <div className="flex justify-between gap-6 py-3.5 text-sm">
              <dt className="text-muted">Направления</dt>
              <dd className="font-medium text-ink">
                {categories.map((category) => category.title).join(" · ")}
              </dd>
            </div>
            <div className="flex justify-between gap-6 py-3.5 text-sm">
              <dt className="text-muted">В каталоге сейчас</dt>
              <dd className="font-medium text-ink">
                {total} {pluralItems(total)}
              </dd>
            </div>
            <div className="flex justify-between gap-6 py-3.5 text-sm">
              <dt className="text-muted">Формат заказа</dt>
              <dd className="font-medium text-ink">
                Индивидуальный подбор цвета, аромата и формы
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-ink bg-ink px-8 py-4 text-sm font-medium tracking-wide text-white transition-all duration-300 hover:bg-transparent hover:text-ink shadow-sm"
              >
                <span>Написать в WhatsApp</span>
                <span>→</span>
              </a>
            ) : null}
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 border border-sand bg-surface px-6 py-4 text-sm tracking-wide text-ink transition-all duration-300 hover:border-ink"
            >
              Смотреть каталог
            </Link>
          </div>

          {socials.length > 0 ? (
            <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline font-medium text-muted hover:text-ink"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
