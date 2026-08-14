import { EnquiryForm } from "@/components/contacts/EnquiryForm";
import { getSite } from "@/lib/content";
import { getSiteName, getSocialLinks, telHref, whatsappHref } from "@/lib/contacts";
import type { Metadata } from "next";

const DESCRIPTION = "WhatsApp, Instagram, Facebook и телефон для заказа изделий ручной работы.";

export const metadata: Metadata = {
  title: "Контакты",
  description: DESCRIPTION,
  openGraph: { title: "Контакты", description: DESCRIPTION },
};

export default function ContactsPage() {
  const { contacts, owner } = getSite();
  const socials = getSocialLinks();
  const whatsappBase = whatsappHref();

  return (
    <div className="pt-24 md:pt-32">
      <header className="px-5 md:px-8">
        <p className="eyebrow">Контакты</p>
        <h1 className="mt-2 max-w-2xl font-display text-4xl md:text-6xl">
          Напишите — отвечу лично
        </h1>
        <p className="mt-5 max-w-prose text-sm text-muted md:text-base">
          Расскажите, что нужно и к какому сроку. Почти любое изделие можно повторить
          в другом цвете, аромате и размере.
        </p>
      </header>

      <div className="mt-12 grid gap-12 px-5 pb-20 md:mt-16 md:grid-cols-2 md:gap-16 md:px-8">
        {whatsappBase ? (
          <EnquiryForm whatsappBase={whatsappBase} siteName={getSiteName()} />
        ) : null}

        <div className="md:pl-4">
          <ul className="border-t border-sand">
            {socials.map((social) => (
              <li key={social.label} className="border-b border-sand py-4">
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
              <li className="border-b border-sand py-4">
                <span className="eyebrow block">Телефон</span>
                <a
                  href={telHref(contacts.phone)}
                  className="link-underline mt-1 inline-block text-lg md:text-xl"
                >
                  {contacts.phone}
                </a>
              </li>
            ) : null}

            {contacts.email ? (
              <li className="border-b border-sand py-4">
                <span className="eyebrow block">Почта</span>
                <a
                  href={`mailto:${contacts.email}`}
                  className="link-underline mt-1 inline-block text-lg md:text-xl"
                >
                  {contacts.email}
                </a>
              </li>
            ) : null}
          </ul>

          {contacts.city ? <p className="mt-6 text-sm text-muted">{contacts.city}</p> : null}
          <p className="mt-6 text-sm text-muted">{owner}</p>
        </div>
      </div>
    </div>
  );
}
