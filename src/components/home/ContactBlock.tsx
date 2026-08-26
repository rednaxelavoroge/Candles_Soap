import { getSite } from "@/lib/content";
import { getSiteName, telHref, whatsappHref } from "@/lib/contacts";
import Link from "next/link";

export function ContactBlock() {
  const { contacts } = getSite();
  const whatsapp = whatsappHref(
    `Здравствуйте! Пишу с сайта ${getSiteName()} — хочу уточнить по поводу изделий ручной работы.`,
  );

  return (
    <section
      id="contacts"
      className="relative overflow-hidden border-t border-sand/50 bg-bg px-5 py-20 md:px-8 md:py-28"
      aria-labelledby="contacts-heading"
    >
      <div className="relative z-10 mx-auto max-w-[1500px]">
        <span className="eyebrow">Контакты и заказ</span>
        <h2 id="contacts-heading" className="mt-3 max-w-3xl font-display text-3xl leading-tight text-ink md:text-5xl lg:text-6xl">
          Повторю любую вещь в вашем цвете и аромате
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
          Напишите мне лично — обсудим детали заказа, подберём форму, цветовую гамму и ароматы.
        </p>

        <div className="mt-12 flex flex-col gap-10 md:mt-14 md:flex-row md:items-end md:justify-between">
          <ul className="flex flex-col gap-6 md:flex-row md:gap-12">
            {contacts.phone ? (
              <li>
                <span className="eyebrow block">Телефон (Армения)</span>
                <a
                  href={telHref(contacts.phone)}
                  className="link-underline mt-1 inline-block text-lg font-medium text-ink md:text-xl"
                >
                  {contacts.phone}
                </a>
              </li>
            ) : null}

            {contacts.phoneRussia ? (
              <li>
                <span className="eyebrow block">Телефон (Россия)</span>
                <a
                  href={telHref(contacts.phoneRussia)}
                  className="link-underline mt-1 inline-block text-lg font-medium text-ink md:text-xl"
                >
                  {contacts.phoneRussia}
                </a>
              </li>
            ) : null}

            {contacts.instagram ? (
              <li>
                <span className="eyebrow block">Instagram</span>
                <a
                  href={`https://instagram.com/${contacts.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline mt-1 inline-block text-lg font-medium text-ink md:text-xl"
                >
                  @{contacts.instagram}
                </a>
              </li>
            ) : null}
          </ul>

          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-3 rounded-full btn-brown px-9 py-4 text-xs font-semibold tracking-[0.04em] shadow-md"
            >
              <span>Написать в WhatsApp</span>
              <span>→</span>
            </a>
          ) : null}
        </div>

        <div className="mt-12 flex items-center gap-6">
          <Link href="/contacts" className="link-underline text-sm font-medium text-muted hover:text-ink">
            Все контактные данные →
          </Link>
        </div>
      </div>
    </section>
  );
}
