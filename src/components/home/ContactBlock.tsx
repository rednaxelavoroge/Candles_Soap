import { Blots } from "@/components/ui/Blots";
import { getSite } from "@/lib/content";
import { getSiteName, getSocialLinks, telHref, whatsappHref } from "@/lib/contacts";
import Link from "next/link";

export function ContactBlock() {
  const { contacts } = getSite();
  const socials = getSocialLinks();
  const whatsapp = whatsappHref(
    `Здравствуйте! Пишу с сайта ${getSiteName()} — хочу уточнить по изделиям.`,
  );

  return (
    <section
      id="contacts"
      className="relative overflow-hidden border-t border-sand px-5 py-14 md:px-8 md:py-20"
      aria-labelledby="contacts-heading"
    >
      <Blots variant={3} />
      <p className="eyebrow relative">Контакты</p>
      <h2 id="contacts-heading" className="mt-2 max-w-3xl font-display text-3xl md:text-5xl">
        Повторю любую вещь в вашем цвете и аромате
      </h2>

      <div className="mt-8 flex flex-col gap-8 md:mt-10 md:flex-row md:items-end md:justify-between">
        <ul className="flex flex-col gap-4 md:flex-row md:gap-12">
          {socials.map((social) => (
            <li key={social.label}>
              <span className="eyebrow block">{social.label}</span>
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline mt-1 inline-block text-lg md:text-xl"
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
                className="link-underline mt-1 inline-block text-lg md:text-xl"
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
            className="inline-flex shrink-0 items-center justify-center border border-ink px-7 py-3.5 text-sm transition-colors duration-300 hover:bg-ink hover:text-surface"
          >
            Написать в WhatsApp
          </a>
        ) : null}
      </div>

      <Link href="/contacts" className="link-underline mt-8 inline-block text-sm">
        Оставить заявку
      </Link>
    </section>
  );
}
