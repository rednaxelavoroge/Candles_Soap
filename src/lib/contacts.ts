import { getSite } from "@/lib/content";

/** wa.me принимает только цифры, поэтому из отображаемого номера чистим всё лишнее. */
function toDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Ссылка на WhatsApp с предзаполненным текстом. Второй номер сюда не попадает:
 * заказчица просила показывать его как обычный телефон.
 */
export function whatsappHref(message?: string): string | null {
  const { contacts } = getSite();
  if (!contacts.whatsapp) return null;

  const base = `https://wa.me/${toDigits(contacts.whatsapp)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function telHref(value: string): string {
  return `tel:+${toDigits(value)}`;
}

export type SocialLink = { label: string; href: string; value: string };

/** Соцсети в порядке приоритета. Пустые каналы просто не попадают в список. */
export function getSocialLinks(): SocialLink[] {
  const { contacts } = getSite();
  const links: SocialLink[] = [];

  const whatsapp = whatsappHref();
  if (whatsapp && contacts.whatsapp) {
    links.push({ label: "WhatsApp", href: whatsapp, value: contacts.whatsapp });
  }
  if (contacts.instagram) {
    links.push({
      label: "Instagram",
      href: `https://instagram.com/${contacts.instagram}`,
      value: `@${contacts.instagram}`,
    });
  }
  if (contacts.facebook) {
    links.push({
      label: "Facebook",
      href: `https://facebook.com/${contacts.facebook}`,
      value: contacts.facebook,
    });
  }

  return links;
}

/** Домен без схемы — для читаемых упоминаний в тексте сообщений. */
export function getSiteName(): string {
  return getSite().domain.replace(/^https?:\/\//, "");
}

/**
 * Текст, который подставляется в WhatsApp при обращении из карточки товара.
 * Название не оборачиваем в кавычки: они почти всегда уже есть в самом
 * названии, и получалось «Свеча «Морская галька»».
 */
export function productEnquiry(title: string): string {
  return `Здравствуйте! Пишу с сайта ${getSiteName()}. Интересует: ${title}. Подскажите, пожалуйста, по наличию и срокам.`;
}
