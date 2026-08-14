import { getSite } from "@/lib/content";
import { getSocialLinks, telHref } from "@/lib/contacts";
import Link from "next/link";

const NAV = [
  { href: "/catalog", label: "Каталог" },
  { href: "/about", label: "Обо мне" },
  { href: "/contacts", label: "Контакты" },
];

export function SiteFooter() {
  const site = getSite();
  const socials = getSocialLinks();
  const year = 2026;

  return (
    <footer className="border-t border-sand px-5 py-10 md:px-8 md:py-14">
      <div className="grid gap-10 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl md:text-3xl">{site.brand}</p>
          <p className="mt-2 max-w-xs text-sm text-muted">{site.tagline}</p>
        </div>

        <nav aria-label="Навигация в подвале" className="flex flex-col gap-2 text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="link-underline self-start">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-2 text-sm">
          {socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline self-start"
            >
              {social.label}
            </a>
          ))}
          {site.contacts.phone ? (
            <a href={telHref(site.contacts.phone)} className="link-underline self-start">
              {site.contacts.phone}
            </a>
          ) : null}
        </div>
      </div>

      <p className="mt-10 text-xs text-muted">
        © {year} {site.owner}
      </p>
    </footer>
  );
}
