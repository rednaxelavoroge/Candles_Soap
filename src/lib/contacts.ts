import { getSite, getText } from "@/lib/content";

/** wa.me принимает только цифры, поэтому из отображаемого номера чистим всё лишнее. */
export function toDigits(value?: string | null): string {
  return (value || "").replace(/\D/g, "");
}

/**
 * Ссылка на WhatsApp с предзаполненным текстом (на армянский номер).
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

/** Соцсети в порядке приоритета. */
export function getSocialLinks(): SocialLink[] {
  const { contacts } = getSite();
  const links: SocialLink[] = [];

  const whatsapp = whatsappHref();
  if (whatsapp && contacts.whatsapp) {
    const digits = toDigits(contacts.whatsapp);
    const country = digits.startsWith("374") ? " (Армения)" : digits.startsWith("7") ? " (Россия)" : "";
    links.push({ label: "WhatsApp", href: whatsapp, value: `${contacts.whatsapp}${country}` });
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
 * Сам текст заказчица правит в панели («Сообщения в WhatsApp»).
 */
export function productEnquiry(title: string): string {
  return getText("whatsapp.product", { сайт: getSiteName(), изделие: title });
}

/** Текст для кнопок WhatsApp с главной и со страницы контактов. */
export function generalEnquiry(): string {
  return getText("whatsapp.general", { сайт: getSiteName() });
}

/** Текст для кнопки WhatsApp со страницы «Обо мне». */
export function aboutEnquiry(): string {
  return getText("whatsapp.about", { сайт: getSiteName() });
}

/**
 * Ссылка на WhatsApp с текстом; пустой текст в панели значит «без текста»,
 * а не «подставь свой».
 */
export function whatsappWith(message: string): string | null {
  return whatsappHref(message.trim() ? message : undefined);
}
