import { Blots } from "@/components/ui/Blots";
import { getSite } from "@/lib/content";
import { getSocialLinks, telHref, whatsappHref } from "@/lib/contacts";
import type { Metadata } from "next";

const DESCRIPTION = "WhatsApp, Instagram, Facebook и телефон для заказа изделий ручной работы Анны Манасарян.";

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
        <Blots variant={3} className="opacity-50" />
        <span className="eyebrow relative">Связаться с автором</span>
        <h1 className="relative mt-2 max-w-2xl font-display text-4xl leading-tight text-ink md:text-6xl">
          Напишите — отвечу лично
        </h1>
        <p className="relative mt-4 max-w-prose text-base leading-relaxed text-muted md:text-lg">
          Расскажите, какое изделие вас заинтересовало, к какому событию или сроку. Почти каждую вещь можно повторить в другом цвете, аромате и размере.
        </p>
      </header>

      <div className="mt-8 px-5 pb-20 md:mt-12 md:px-8">
        {whatsappBase ? (
          <a
            href={whatsappBase}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-md border border-ink bg-ink px-8 py-4 text-sm font-medium tracking-wide text-white transition-all duration-300 hover:bg-transparent hover:text-ink shadow-sm"
          >
            <span>Написать в WhatsApp</span>
            <span>→</span>
          </a>
        ) : null}

        <div className="mt-12 max-w-2xl">
          <ul className="divide-y divide-sand border-y border-sand">
            {socials.map((social) => (
              <li key={social.label} className="flex justify-between items-center py-5">
                <span className="eyebrow">{social.label}</span>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline text-lg font-medium text-ink md:text-xl"
                >
                  {social.value}
                </a>
              </li>
            ))}

            {contacts.phone ? (
              <li className="flex justify-between items-center py-5">
                <span className="eyebrow">Телефон / Звонки</span>
                <a
                  href={telHref(contacts.phone)}
                  className="link-underline text-lg font-medium text-ink md:text-xl"
                >
                  {contacts.phone}
                </a>
              </li>
            ) : null}

            {contacts.email ? (
              <li className="flex justify-between items-center py-5">
                <span className="eyebrow">Электронная почта</span>
                <a
                  href={`mailto:${contacts.email}`}
                  className="link-underline text-lg font-medium text-ink md:text-xl"
                >
                  {contacts.email}
                </a>
              </li>
            ) : null}
          </ul>

          {contacts.city ? <p className="mt-6 text-sm text-muted">{contacts.city}</p> : null}
          <p className="mt-6 text-sm font-medium text-muted">С уважением, {owner}</p>
        </div>
      </div>
    </div>
  );
}
