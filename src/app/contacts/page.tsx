import { getSite } from "@/lib/content";
import { getSocialLinks, telHref, whatsappHref } from "@/lib/contacts";
import type { Metadata } from "next";

const DESCRIPTION = "WhatsApp, Instagram, Facebook и телефоны для заказа изделий ручной работы Анны Манасарян.";

export const metadata: Metadata = {
  title: "Контакты — AnnaManasaryan.Art",
  description: DESCRIPTION,
  openGraph: { title: "Контакты — AnnaManasaryan.Art", description: DESCRIPTION },
};

export default function ContactsPage() {
  const { contacts, owner } = getSite();
  const socials = getSocialLinks();
  const whatsappBase = whatsappHref();

  return (
    <div className="pt-24 md:pt-32">
      <header className="relative overflow-hidden px-5 pb-8 md:px-8 md:pb-12">
        <span className="eyebrow relative">Связаться с автором</span>
        <h1 className="relative mt-2 max-w-2xl font-display text-4xl leading-tight text-ink md:text-6xl">
          Напишите — отвечу лично
        </h1>
        <p className="relative mt-4 max-w-prose text-base leading-relaxed text-muted md:text-lg">
          Расскажите, какое изделие вас заинтересовало, к какому событию или сроку. Почти каждую вещь можно повторить в другом цвете, аромате и размере.
        </p>
      </header>

      <div className="mt-6 px-5 pb-20 md:mt-10 md:px-8">
        {whatsappBase ? (
          <a
            href={whatsappBase}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-full btn-brown px-9 py-4 text-xs font-semibold tracking-[0.2em] uppercase shadow-md"
          >
            <span>Написать в WhatsApp</span>
            <span>→</span>
          </a>
        ) : null}

        <div className="mt-12 max-w-2xl">
          <ul className="divide-y divide-sand border-y border-sand">
            {contacts.whatsapp ? (
              <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-5 gap-1 sm:gap-4">
                <span className="eyebrow">WhatsApp</span>
                <a
                  href={whatsappBase ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline text-base sm:text-lg md:text-xl font-medium text-ink whitespace-nowrap"
                >
                  {contacts.whatsapp} <span className="text-xs text-muted font-normal">(Армения)</span>
                </a>
              </li>
            ) : null}

            {contacts.phone ? (
              <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-5 gap-1 sm:gap-4">
                <span className="eyebrow">Телефон (Армения)</span>
                <a
                  href={telHref(contacts.phone)}
                  className="link-underline text-base sm:text-lg md:text-xl font-medium text-ink whitespace-nowrap"
                >
                  {contacts.phone}
                </a>
              </li>
            ) : null}

            {contacts.phoneRussia ? (
              <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-5 gap-1 sm:gap-4">
                <span className="eyebrow">Телефон (Россия)</span>
                <a
                  href={telHref(contacts.phoneRussia)}
                  className="link-underline text-base sm:text-lg md:text-xl font-medium text-ink whitespace-nowrap"
                >
                  {contacts.phoneRussia}
                </a>
              </li>
            ) : null}

            {contacts.email ? (
              <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-5 gap-1 sm:gap-4">
                <span className="eyebrow">Email</span>
                <a
                  href={`mailto:${contacts.email}`}
                  className="link-underline text-base sm:text-lg md:text-xl font-medium text-ink whitespace-nowrap"
                >
                  {contacts.email}
                </a>
              </li>
            ) : null}

            {contacts.instagram ? (
              <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-5 gap-1 sm:gap-4">
                <span className="eyebrow">Instagram</span>
                <a
                  href={`https://instagram.com/${contacts.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline text-base sm:text-lg md:text-xl font-medium text-ink"
                >
                  @{contacts.instagram}
                </a>
              </li>
            ) : null}
          </ul>

          <p className="mt-8 text-sm font-medium text-muted">С уважением, {owner}</p>
        </div>
      </div>
    </div>
  );
}
