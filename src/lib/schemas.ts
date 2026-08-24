import { z } from "zod";

/**
 * Схемы контента. Сейчас данные читаются из src/data/*.json, но компоненты
 * работают только с выводами этих схем — заменить источник на REST можно,
 * переписав один модуль src/lib/content.ts и не трогая ни одного компонента.
 */

export const imageSchema = z.object({
  src: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** base64-заглушка 16px, генерируется скриптом ingest. */
  blurDataURL: z.string().min(1),
  alt: z.string().min(1),
});

export const videoSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("file"),
    src: z.string().min(1),
    poster: imageSchema,
  }),
  z.object({
    kind: z.literal("youtube"),
    /** Идентификатор ролика, не полный URL: плеер грузится только по клику. */
    id: z.string().min(1),
    poster: imageSchema,
  }),
  z.object({
    kind: z.literal("vimeo"),
    id: z.string().min(1),
    poster: imageSchema,
  }),
]);

export const categorySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  cover: imageSchema.nullable(),
  order: z.number().int(),
});

export const tagSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  group: z.enum(["occasion", "recipient", "form"]),
  /**
   * Порядок раздела на странице категории. Задан по её прайсам: сначала идут
   * разделы в том порядке, в каком она перечисляет их сама, следом наши —
   * те, строк под которые в прайсе нет.
   */
  order: z.number().int().optional(),
});

export const specsSchema = z.object({
  size: z.string().optional(),
  scent: z.string().optional(),
  composition: z.string().optional(),
  burnTime: z.string().optional(),
  weight: z.string().optional(),
});

export const productSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  /** Артикул: по нему заказчица находит изделие, когда о нём спрашивают. */
  article: z.string().min(1),
  /** Ровно одна категория на товар. */
  category: z.string().min(1),
  /** Тегов сколько угодно — по ним и работает фильтрация в разделе. */
  tags: z.array(z.string()),
  images: z.array(imageSchema).min(1),
  video: videoSchema.nullable(),
  price: z.number().positive().nullable(),
  description: z.string().min(1),
  specs: specsSchema,
  /**
   * Три тона акварельных пятен вокруг кадра, снятые с самой обложки
   * командой `npm run tones`. У заказчицы в примерах цвет брызг подобран
   * под снимок: у зефира розовые, у тюльпанов зелёно-сиреневые.
   * Пока не проставлены — пятна берут песочные тона сайта.
   */
  tones: z.array(z.string()).length(3).optional(),
});

export const siteSchema = z.object({
  owner: z.string().min(1),
  /** Написание в шапке и подвале — латиницей, как на домене. */
  brand: z.string().min(1),
  domain: z.string().min(1),
  tagline: z.string().min(1),
  intro: z.string().min(1),
  portrait: imageSchema.nullable(),
  /**
   * Кадры с самой Анной для страницы «Обо мне». Это не каталог: изделие тут
   * в руках у мастера, а не на предметной съёмке.
   */
  gallery: z.array(imageSchema).optional(),
  /**
   * Лента на главной. Заказчица сама решает, что там стоит: своё название
   * («Хиты продаж», «К Новому году»), своя подпись и свой список изделий.
   * Пустой `ids` означает «выбери сама» — тогда лента собирается из каталога
   * по одному изделию на категорию. `enabled: false` убирает блок со страницы.
   */
  featured: z
    .object({
      enabled: z.boolean(),
      eyebrow: z.string(),
      title: z.string(),
      subtitle: z.string(),
      ids: z.array(z.string()),
    })
    .optional(),
  contacts: z.object({
    /** Номер для кнопки «Написать в WhatsApp» и звонков (Армения). */
    whatsapp: z.string().nullable(),
    phone: z.string().nullable(),
    /** Российский номер телефона. */
    phoneRussia: z.string().nullable().optional(),
    instagram: z.string().nullable(),
    facebook: z.string().nullable(),
    email: z.string().nullable(),
    city: z.string().nullable(),
  }),
});

/** Лента бэкстейджа: кадры и вертикальные ролики вперемешку. */
export const backstageItemSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("image"), image: imageSchema, caption: z.string() }),
  z.object({
    kind: z.literal("video"),
    src: z.string().min(1),
    poster: imageSchema,
    caption: z.string(),
  }),
]);

export type BackstageItem = z.infer<typeof backstageItemSchema>;
export type ContentImage = z.infer<typeof imageSchema>;
export type Video = z.infer<typeof videoSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Tag = z.infer<typeof tagSchema>;
export type Product = z.infer<typeof productSchema>;
export type Site = z.infer<typeof siteSchema>;
export type TagGroup = Tag["group"];
