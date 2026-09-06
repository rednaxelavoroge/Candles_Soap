import { getSite, getText } from "@/lib/content";
import { generalEnquiry, toDigits, whatsappWith } from "@/lib/contacts";
import Link from "next/link";

export function ContactBlock() {
  const { contacts } = getSite();
  const whatsapp = whatsappWith(generalEnquiry());
  const eyebrow = getText("home.contacts.eyebrow");
  const title = getText("home.contacts.title");
  const lead = getText("home.contacts.lead");
  const allLink = getText("home.contacts.allLink");
  const whatsappButton = getText("common.whatsappButton");

  return (
    <section
      id="contacts"
      className="relative overflow-hidden border-t border-sand/50 bg-bg px-5 py-20 md:px-8 md:py-28"
      aria-labelledby="contacts-heading"
    >
      <div className="relative z-10 mx-auto max-w-[1500px]">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        {title ? (
          <h2 id="contacts-heading" className="mt-3 max-w-3xl font-display text-3xl leading-tight text-ink md:text-5xl lg:text-6xl">
            {title}
          </h2>
        ) : null}
        {lead ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
            {lead}
          </p>
        ) : null}

        <div className="mt-12 flex flex-col gap-10 md:mt-14 md:flex-row md:items-end md:justify-between">
          <ul className="flex flex-col gap-6 md:flex-row md:gap-12">
            {contacts.phone ? (
              <li>
                <span className="eyebrow block">WhatsApp / Армения</span>
                <a
                  href={`https://wa.me/${toDigits(contacts.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline mt-1 inline-block text-lg font-medium text-ink md:text-xl"
                >
                  {contacts.phone}
                </a>
              </li>
            ) : null}

            {contacts.phoneRussia ? (
              <li>
                <span className="eyebrow block">WhatsApp / Россия</span>
                <a
                  href={`https://wa.me/${toDigits(contacts.phoneRussia)}`}
                  target="_blank"
                  rel="noopener noreferrer"
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

          {whatsapp && whatsappButton ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-3 rounded-full btn-brown px-9 py-4 text-xs font-semibold tracking-[0.04em] shadow-md"
            >
              <span>{whatsappButton}</span>
              <span>→</span>
            </a>
          ) : null}
        </div>

        {allLink ? (
          <div className="mt-12 flex items-center gap-6">
            <Link href="/contacts" className="link-underline text-sm font-medium text-muted hover:text-ink">
              {allLink} →
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
