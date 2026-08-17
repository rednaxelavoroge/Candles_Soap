import { Blots } from "@/components/ui/Blots";
import { getSite } from "@/lib/content";
import { getSiteName, getSocialLinks, telHref, whatsappHref } from "@/lib/contacts";
import Link from "next/link";

export function ContactBlock() {
  const { contacts } = getSite();
  const socials = getSocialLinks();
  const whatsapp = whatsappHref(
    `Здравствуйте! Пишу с сайта ${getSiteName()} — хочу уточнить по поводу изделий ручной работы.`,
  );

  return (
    <section
      id="contacts"
      className="relative overflow-hidden border-t border-sand bg-bg px-5 py-16 md:px-8 md:py-24"
      aria-labelledby="contacts-heading"
    >
      <Blots variant={3} className="opacity-50" />
      <div className="relative z-10 mx-auto max-w-[1500px]">
        <span className="eyebrow">Контакты и заказ</span>
        <h2 id="contacts-heading" className="mt-3 max-w-3xl font-display text-3xl leading-tight text-ink md:text-5xl lg:text-6xl">
          Повторю любую вещь в вашем цвете и аромате
        </h2>
        <p className="mt-4 max-w-2xl text-base text-muted md:text-lg">
          Напишите мне лично — обсудим детали заказа, подберём форму, цветовую гамму и ароматы.
        </p>

        <div className="mt-10 flex flex-col gap-8 md:mt-12 md:flex-row md:items-end md:justify-between">
          <ul className="flex flex-col gap-6 md:flex-row md:gap-14">
            {socials.map((social) => (
              <li key={social.label}>
                <span className="eyebrow block">{social.label}</span>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline mt-1 inline-block text-lg font-medium text-ink md:text-xl"
                >
                  {social.value}
                </a>
              </li>
            ))}
            {contacts.phone ? (
              <li>
                <span className="eyebrow block">Телефон</span>
                <a
                  href={telHref(contacts.phone)}
                  className="link-underline mt-1 inline-block text-lg font-medium text-ink md:text-xl"
                >
                  {contacts.phone}
                </a>
              </li>
            ) : null}
          </ul>

          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-3 rounded-md border border-ink bg-ink px-8 py-4 text-sm font-medium tracking-wide text-white transition-all duration-300 hover:bg-transparent hover:text-ink shadow-sm"
            >
              <span>Написать в WhatsApp</span>
              <span>→</span>
            </a>
          ) : null}
        </div>

        <div className="mt-10 flex items-center gap-6">
          <Link href="/contacts" className="link-underline text-sm font-medium text-muted hover:text-ink">
            Все контактные данные →
          </Link>
        </div>
      </div>
    </section>
  );
}
