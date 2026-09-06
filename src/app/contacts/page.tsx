import { getSite, getText } from "@/lib/content";
import { toDigits } from "@/lib/contacts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Контакты",
  description: getText("seo.contacts"),
  openGraph: { title: "Контакты", description: getText("seo.contacts") },
};

/**
 * По образцу фотосайта annamanasaryan.com: оба номера — WhatsApp (Армения и Россия),
 * оба открывают чат в wa.me. Почта и Instagram остаются от сайта свечей.
 */
export default function ContactsPage() {
  const { contacts } = getSite();
  const lead = getText("contacts.lead") || "Напишите в WhatsApp — так быстрее всего обсудить заказ или детали изделия.";

  return (
    <article className="px-5 pt-28 pb-24 md:px-8">
      <h1 className="font-display text-4xl md:text-6xl text-ink">Контакты</h1>
      <p className="mt-5 max-w-xl text-sm text-muted md:text-base">
        {lead}
      </p>
      <ul className="mt-14 space-y-8 text-lg">
        {contacts.phone || contacts.whatsapp ? (
          <li>
            <p className="eyebrow">WhatsApp / Армения</p>
            <a
              href={`https://wa.me/${toDigits(contacts.phone || contacts.whatsapp)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline mt-2 inline-block font-medium text-ink"
            >
              {contacts.phone || contacts.whatsapp}
            </a>
          </li>
        ) : null}

        {contacts.phoneRussia ? (
          <li>
            <p className="eyebrow">WhatsApp / Россия</p>
            <a
              href={`https://wa.me/${toDigits(contacts.phoneRussia)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline mt-2 inline-block font-medium text-ink"
            >
              {contacts.phoneRussia}
            </a>
          </li>
        ) : null}

        {contacts.email ? (
          <li>
            <p className="eyebrow">Почта</p>
            <a
              href={`mailto:${contacts.email}`}
              className="link-underline mt-2 inline-block font-medium text-ink"
            >
              {contacts.email}
            </a>
          </li>
        ) : null}

        {contacts.instagram ? (
          <li>
            <p className="eyebrow">Instagram</p>
            <a
              href={`https://instagram.com/${contacts.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline mt-2 inline-block font-medium text-ink"
            >
              @{contacts.instagram}
            </a>
          </li>
        ) : null}

        {contacts.facebook ? (
          <li>
            <p className="eyebrow">Facebook</p>
            <a
              href={contacts.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline mt-2 inline-block font-medium text-ink"
            >
              Facebook
            </a>
          </li>
        ) : null}
      </ul>
    </article>
  );
}
