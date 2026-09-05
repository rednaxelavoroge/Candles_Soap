import { getText } from "@/lib/content";

/** Пункты меню шапки и подвала; подписи заказчица правит в панели («Шапка и подвал сайта»). */
export function getNav() {
  return [
    { href: "/catalog", label: getText("nav.catalog") },
    { href: "/backstage", label: getText("nav.backstage") },
    { href: "/about", label: getText("nav.about") },
    { href: "/contacts", label: getText("nav.contacts") },
  ].filter((item) => item.label.trim() !== "");
}
