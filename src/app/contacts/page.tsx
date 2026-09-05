import { getSite, getText } from "@/lib/content";
import { generalEnquiry, getSocialLinks, telHref, whatsappHref, whatsappWith } from "@/lib/contacts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Контакты",
  description: getText("seo.contacts"),
  openGraph: { title: "Контакты", description: getText("seo.contacts") },
};

export default function ContactsPage() {
  const { contacts, owner } = getSite();
  const whatsappBase = whatsappHref();
  const whatsappWithText = whatsappWith(generalEnquiry());
  const facebook = getSocialLinks().find((link) => link.label === "Facebook");
  const eyebrow = getText("contacts.eyebrow");
  const title = getText("contacts.title");
  const lead = getText("contacts.lead");
  const signature = getText("contacts.signature", { имя: owner });
  const whatsappButton = getText("common.whatsappButton");

  return (
    <div className="pt-24 md:pt-32">
      <header className="relative overflow-hidden px-5 pb-8 md:px-8 md:pb-12">
        {eyebrow ? <span className="eyebrow relative">{eyebrow}</span> : null}
        <h1 className="relative mt-2 max-w-2xl font-display text-4xl leading-tight text-ink md:text-6xl">
          {title || "Контакты"}
        </h1>
        {lead ? (
          <p className="relative mt-4 max-w-prose text-base leading-relaxed text-muted md:text-lg">
            {lead}
          </p>
        ) : null}
      </header>

      <div className="mt-6 px-5 pb-20 md:mt-10 md:px-8">
        {whatsappWithText && whatsappButton ? (
          <a
            href={whatsappWithText}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-full btn-brown px-9 py-4 text-xs font-semibold tracking-[0.04em] shadow-md"
          >
            <span>{whatsappButton}</span>
            <span>→</span>
          </a>
        ) : null}

        <div className="mt-12 max-w-2xl">
          <ul className="divide-y divide-sand border-y border-sand">
            {contacts.whatsapp ? (() => {
              const d = (contacts.whatsapp || "").replace(/\D/g, "");
              const country = d.startsWith("374") ? "(Армения)" : d.startsWith("7") ? "(Россия)" : "";
              return (
                <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-5 gap-1 sm:gap-4">
                  <span className="eyebrow">WhatsApp</span>
                  <a
                    href={whatsappBase ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline text-base sm:text-lg md:text-xl font-medium text-ink whitespace-nowrap"
                  >
                    {contacts.whatsapp} {country ? <span className="text-xs text-muted font-normal">{country}</span> : null}
                  </a>
                </li>
              );
            })() : null}

            {contacts.phone ? (
              <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-5 gap-1 sm:gap-4">
                <span className="eyebrow">{getText("contacts.labelPhoneArmenia")}</span>
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
                <span className="eyebrow">{getText("contacts.labelPhoneRussia")}</span>
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

            {facebook ? (
              <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-5 gap-1 sm:gap-4">
                <span className="eyebrow">Facebook</span>
                <a
                  href={facebook.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline text-base sm:text-lg md:text-xl font-medium text-ink"
                >
                  {facebook.value}
                </a>
              </li>
            ) : null}

            {/* Поле «Город» из панели раньше сохранялось, но на сайте не показывалось. */}
            {contacts.city ? (
              <li className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-5 gap-1 sm:gap-4">
                <span className="eyebrow">Город</span>
                <span className="text-base sm:text-lg md:text-xl font-medium text-ink">{contacts.city}</span>
              </li>
            ) : null}
          </ul>

          {signature.trim() ? (
            <p className="mt-8 text-sm font-medium text-muted">{signature}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
