import { getSite } from "@/lib/content";
import Link from "next/link";

export function SiteFooter() {
  const site = getSite();
  const year = 2026;

  return (
    <footer className="border-t border-sand px-5 py-10 md:px-8 md:py-14">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-2xl md:text-3xl">{site.owner}</p>
          <p className="mt-2 max-w-md text-sm text-muted">{site.tagline}</p>
        </div>
        <nav aria-label="Навигация в подвале" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/catalog" className="link-underline">
            Каталог
          </Link>
          <Link href="/#about" className="link-underline">
            Обо мне
          </Link>
          <Link href="/#contacts" className="link-underline">
            Контакты
          </Link>
        </nav>
      </div>
      <p className="mt-10 text-xs text-muted">© {year} {site.owner}</p>
    </footer>
  );
}
