import { getSite } from "@/lib/content";

/**
 * Показываем только те каналы связи, которые есть в данных: выдуманный номер
 * или пустая ссылка на прототипе хуже отсутствующей строки.
 */
export function ContactBlock() {
  const { contacts } = getSite();

  const channels = [
    contacts.whatsapp
      ? {
          label: "WhatsApp",
          value: contacts.whatsapp,
          href: `https://wa.me/${contacts.whatsapp.replace(/\D/g, "")}`,
        }
      : null,
    contacts.instagram
      ? {
          label: "Instagram",
          value: `@${contacts.instagram}`,
          href: `https://instagram.com/${contacts.instagram}`,
        }
      : null,
    contacts.email
      ? { label: "Почта", value: contacts.email, href: `mailto:${contacts.email}` }
      : null,
  ].filter((channel) => channel !== null);

  return (
    <section
      id="contacts"
      className="border-t border-sand px-5 py-14 md:px-8 md:py-20"
      aria-labelledby="contacts-heading"
    >
      <p className="eyebrow">Контакты</p>
      <h2 id="contacts-heading" className="mt-2 max-w-3xl font-display text-3xl md:text-5xl">
        Повторю любую вещь в вашем цвете и аромате
      </h2>

      {channels.length > 0 ? (
        <ul className="mt-8 flex flex-col gap-4 md:mt-10 md:flex-row md:gap-12">
          {channels.map((channel) => (
            <li key={channel.label}>
              <span className="eyebrow block">{channel.label}</span>
              <a href={channel.href} className="link-underline mt-1 inline-block text-lg md:text-xl">
                {channel.value}
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {contacts.city ? <p className="mt-8 text-sm text-muted">{contacts.city}</p> : null}
    </section>
  );
}
