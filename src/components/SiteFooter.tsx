import { getSite } from "@/lib/content";
import { getSocialLinks, telHref } from "@/lib/contacts";
import Link from "next/link";

const NAV = [
  { href: "/catalog", label: "Каталог" },
  { href: "/backstage", label: "Бэкстейдж" },
  { href: "/about", label: "О мастере" },
  { href: "/contacts", label: "Контакты" },
];

export function SiteFooter() {
  const site = getSite();
  const socials = getSocialLinks();
  const year = 2026;

  return (
    <footer className="border-t border-sand bg-surface/50 px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-[1400px] grid gap-10 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl md:text-3xl text-ink">{site.brand}</p>
          <p className="mt-2 max-w-xs text-xs text-muted leading-relaxed">{site.tagline}</p>
        </div>

        <nav aria-label="Навигация в подвале" className="flex flex-col gap-2.5 text-xs uppercase tracking-wider font-semibold">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="link-underline self-start text-muted hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-2 text-xs">
          <span className="font-semibold uppercase tracking-wider text-ink mb-1">Связь с мастером</span>
          {site.contacts.phone ? (
            <a href={telHref(site.contacts.phone)} className="text-muted hover:text-ink transition-colors whitespace-nowrap">
              🇦🇲 {site.contacts.phone} <span className="text-[0.7rem] text-accent font-medium">(WhatsApp)</span>
            </a>
          ) : null}
          {site.contacts.phoneRussia ? (
            <a href={telHref(site.contacts.phoneRussia)} className="text-muted hover:text-ink transition-colors whitespace-nowrap">
              🇷🇺 {site.contacts.phoneRussia}
            </a>
          ) : null}
          {site.contacts.email ? (
            <a href={`mailto:${site.contacts.email}`} className="text-muted hover:text-ink transition-colors whitespace-nowrap">
              ✉ {site.contacts.email}
            </a>
          ) : null}
          <div className="mt-2 flex gap-4">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline self-start text-btn-brown font-semibold"
              >
                {social.label} ↗
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] mt-12 border-t border-sand/60 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[0.7rem] text-muted">
        <p>© {year} {site.owner}. Все права защищены.</p>
        <p className="max-w-md">
          Все изделия являются авторскими работами. Копирование и использование фотоматериалов без разрешения автора запрещено.
        </p>
      </div>
    </footer>
  );
}
