import { checkAdminAuth } from "@/lib/admin-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

/**
 * Инструкция для заказчицы — внутри панели, за тем же паролем.
 *
 * Почему здесь, а не отдельной страницей в интернете: заказчица в России,
 * и внешние площадки у неё не открываются. Панель открывается — значит и
 * инструкция должна лежать в ней. Заодно решается «чтобы чужой не открыл»:
 * без пароля страницы не видно.
 *
 * Шрифты и цвета берутся сайтовые, ничего внешнего не подгружается.
 */

export const metadata = {
  title: "Инструкция — панель Анны",
  robots: { index: false, follow: false },
};

/** Название кнопки — ровно как на экране панели. */
function Btn({ children }: { children: React.ReactNode }) {
  return (
    <span className="mx-0.5 inline rounded-full bg-sand px-1.5 py-0.5 text-[0.72rem] font-semibold tracking-wide text-ink">
      {children}
    </span>
  );
}

/** Подпись поля — ровно как на экране панели. */
function Field({ children }: { children: React.ReactNode }) {
  return (
    <span className="mx-0.5 inline rounded-md border border-sand px-1.5 py-0.5 text-[0.72rem] font-medium tracking-wide text-muted uppercase">
      {children}
    </span>
  );
}

function Note({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-sand bg-surface/60 px-4 py-3.5">
      <span className="text-[0.68rem] font-semibold tracking-[0.16em] text-accent uppercase">
        {label}
      </span>
      <p className="text-sm leading-relaxed text-ink">{children}</p>
    </div>
  );
}

function Chapter({
  id,
  num,
  title,
  children,
}: {
  id: string;
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-6 flex-col gap-4 border-t border-sand pt-8">
      <span className="text-[0.68rem] font-semibold tracking-[0.2em] text-accent uppercase">
        Глава {num}
      </span>
      <h2 className="-mt-2 font-display text-2xl leading-tight text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="flex list-none flex-col gap-3 p-0">
      {items.map((item, i) => (
        <li key={i} className="grid grid-cols-[1.75rem_1fr] items-baseline gap-1">
          <span className="font-display text-sm font-semibold text-accent tabular-nums">
            {i + 1}
          </span>
          <span className="text-[0.95rem] leading-relaxed text-ink">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="flex list-none flex-col gap-2.5 p-0">
      {items.map((item, i) => (
        <li key={i} className="grid grid-cols-[0.9rem_1fr] items-baseline gap-2.5">
          <span className="text-accent">—</span>
          <span className="text-[0.95rem] leading-relaxed text-ink">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Figure({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <figure className="m-0 flex flex-col gap-2">
      <div className="overflow-x-auto rounded-2xl border border-sand bg-surface p-3">
        <div className="min-w-[20rem]">{children}</div>
      </div>
      <figcaption className="text-sm text-muted">{caption}</figcaption>
    </figure>
  );
}

const CHAPTERS = [
  { id: "vhod", num: "01", title: "Как войти в панель" },
  { id: "gde", num: "02", title: "Что где лежит" },
  { id: "teksty", num: "03", title: "Любая надпись на сайте" },
  { id: "razdely", num: "04", title: "Разделы каталога: Свечи, Мыло и другие" },
  { id: "podrazdely", num: "05", title: "Подразделы каталога" },
  { id: "lenta", num: "06", title: "Избранное на главной странице" },
  { id: "poryadok", num: "07", title: "Порядок: что за чем стоит" },
  { id: "foto-video", num: "08", title: "Фотографии и видео в карточке" },
  { id: "portret", num: "09", title: "Ваше фото на главной" },
  { id: "backstage", num: "10", title: "Бэкстейдж" },
  { id: "kontakty", num: "11", title: "Контакты и WhatsApp" },
  { id: "sohranit", num: "12", title: "Что происходит после «Сохранить»" },
  { id: "otkat", num: "13", title: "Если удалили лишнее" },
  { id: "melochi", num: "14", title: "Мелочи, которые стоит знать" },
];

export default async function InstrukciyaPage() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto flex max-w-2xl flex-col gap-12 px-5 py-12 md:px-8 md:py-16">
        <header className="flex flex-col gap-3">
          <Link
            href="/admin"
            className="self-start rounded-full border border-sand bg-surface px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-sand/30"
          >
            ← Вернуться в панель
          </Link>
          <span className="mt-3 text-[0.7rem] font-semibold tracking-[0.22em] text-accent uppercase">
            Мастерская Анны Манасарян
          </span>
          <h1 className="font-display text-3xl leading-tight text-ink md:text-4xl">
            Как менять сайт самой
          </h1>
          <p className="text-base leading-relaxed text-muted">
            Каждая глава — одно дело, от начала до конца. Заранее знать ничего не нужно.
          </p>
        </header>

        <nav
          aria-label="Главы"
          className="flex flex-col overflow-hidden rounded-2xl border border-sand bg-surface"
        >
          {CHAPTERS.map((chapter) => (
            <a
              key={chapter.id}
              href={`#${chapter.id}`}
              className="grid grid-cols-[2.2rem_1fr] items-baseline gap-2 border-b border-sand/60 px-4 py-3 text-[0.95rem] text-ink transition-colors last:border-b-0 hover:bg-bg/60"
            >
              <span className="font-display text-xs font-semibold text-accent tabular-nums">
                {chapter.num}
              </span>
              <span>{chapter.title}</span>
            </a>
          ))}
        </nav>

        <Chapter id="vhod" num="01" title="Как войти в панель">
          <Steps
            items={[
              <>
                Откройте адрес{" "}
                <span className="font-medium break-all text-btn-brown">
                  admin.annamanasaryan.art
                </span>
              </>,
              <>
                Введите пароль в поле <Field>Пароль</Field>
              </>,
              <>
                Нажмите <Btn>ВОЙТИ В КАБИНЕТ →</Btn>
              </>,
            ]}
          />
          <p className="text-[0.95rem] leading-relaxed text-ink">
            Панель открывается и с компьютера, и с телефона. Адрес не меняется — его
            можно сохранить в закладки. Эта инструкция всегда лежит внутри панели:
            кнопка «Инструкция» наверху.
          </p>

          <Note label="Чтобы не искать каждый раз">
            На айфоне: откройте адрес в Safari, нажмите «Поделиться» внизу, выберите
            «На экран „Домой“». На андроиде: три точки в углу Chrome, «Добавить на
            главный экран». Панель встанет значком рядом с приложениями.
          </Note>

          <Note label="Если панель снова просит пароль">
            Так бывает, когда её долго не открывали. Введите пароль ещё раз — ничего
            не потерялось.
          </Note>
        </Chapter>

        <Chapter id="gde" num="02" title="Что где лежит">
          <p className="text-[0.95rem] leading-relaxed text-ink">
            Наверху панели восемь кнопок. Это восемь разных мест.
          </p>

          <Figure caption="Так выглядит верх панели. Коричневая — та, что открыта сейчас.">
            <svg viewBox="0 0 560 136" className="block h-auto w-full" role="img" aria-label="Ряд вкладок наверху панели">
              <rect x="0" y="8" width="120" height="30" rx="15" fill="var(--color-sand)" />
              <text x="60" y="27" textAnchor="middle" fontSize="10.5" fontWeight="600" letterSpacing="0.7" fill="var(--color-ink)">ИЗДЕЛИЯ</text>
              <rect x="130" y="8" width="180" height="30" rx="15" fill="var(--color-sand)" />
              <text x="220" y="27" textAnchor="middle" fontSize="10.5" fontWeight="600" letterSpacing="0.7" fill="var(--color-ink)">РАЗДЕЛЫ КАТАЛОГА</text>
              <rect x="320" y="8" width="150" height="30" rx="15" fill="var(--color-sand)" />
              <text x="395" y="27" textAnchor="middle" fontSize="10.5" fontWeight="600" letterSpacing="0.7" fill="var(--color-ink)">ПОДРАЗДЕЛЫ</text>

              <rect x="0" y="48" width="140" height="30" rx="15" fill="var(--color-sand)" />
              <text x="70" y="67" textAnchor="middle" fontSize="10.5" fontWeight="600" letterSpacing="0.7" fill="var(--color-ink)">ИЗБРАННОЕ</text>
              <rect x="150" y="48" width="170" height="30" rx="15" fill="var(--color-btn-brown)" />
              <text x="235" y="67" textAnchor="middle" fontSize="10.5" fontWeight="600" letterSpacing="0.7" fill="#ffffff">ТЕКСТЫ И ОБО МНЕ</text>
              <rect x="330" y="48" width="130" height="30" rx="15" fill="var(--color-sand)" />
              <text x="395" y="67" textAnchor="middle" fontSize="10.5" fontWeight="600" letterSpacing="0.7" fill="var(--color-ink)">БЭКСТЕЙДЖ</text>

              <rect x="0" y="88" width="105" height="30" rx="15" fill="var(--color-sand)" />
              <text x="52" y="107" textAnchor="middle" fontSize="10.5" fontWeight="600" letterSpacing="0.7" fill="var(--color-ink)">🎬 ВИДЕО</text>
              <rect x="115" y="88" width="105" height="30" rx="15" fill="var(--color-sand)" />
              <text x="167" y="107" textAnchor="middle" fontSize="10.5" fontWeight="600" letterSpacing="0.7" fill="var(--color-ink)">КОНТАКТЫ</text>
              <text x="300" y="107" fontSize="10" fill="var(--color-accent)">выбранная вкладка — коричневая</text>
            </svg>
          </Figure>

          <div className="flex flex-col gap-3">
            {[
              ["Изделия", "Все свечи, мыло, гипс. Здесь их добавляют, правят и удаляют, здесь же — фотографии, видео и похожие."],
              ["Разделы каталога", "Пять больших разделов: Свечи, Мыло, Гипсовые изделия, Декор, Аромасаше. Их названия, подзаголовки, описания, обложки и порядок."],
              ["Подразделы", "Темы внутри разделов: «Новый год», «Свадьба», «Морская тема». Завести новый, переименовать, удалить, переставить."],
              ["Избранное", "Полоса с карточками на главной: заголовок, подпись и то, какие изделия там стоят."],
              ["Тексты и обо мне", "Имя, название сайта, слоган, рассказ о себе, портрет — и ниже все надписи сайта: заголовки, подписи, кнопки на каждой странице."],
              ["Бэкстейдж", "Кадры и ролики из мастерской: добавить фото, добавить ролик из архива, переставить, удалить."],
              ["Видео", "Архив всех роликов: посмотреть, переименовать, загрузить новый с телефона."],
              ["Контакты", "Телефоны, WhatsApp, Instagram, Facebook, почта, город."],
            ].map(([name, what]) => (
              <div key={name} className="flex flex-col gap-0.5 border-b border-sand/50 pb-3 last:border-b-0 last:pb-0">
                <span className="text-[0.73rem] font-semibold tracking-[0.1em] text-ink uppercase">
                  {name}
                </span>
                <span className="text-[0.95rem] leading-relaxed text-muted">{what}</span>
              </div>
            ))}
          </div>
        </Chapter>

        <Chapter id="teksty" num="03" title="Любая надпись на сайте">
          <p className="text-[0.95rem] leading-relaxed text-ink">
            Каждый заголовок, подпись под ним, надпись на кнопке, строка в подвале и плашка
            в карточке изделия правятся в одном месте. Раньше часть этих слов была
            написана «намертво», и изменить их из панели было нельзя — теперь можно все.
          </p>
          <Steps
            items={[
              <>
                Откройте вкладку <Btn>Тексты и обо мне</Btn>.
              </>,
              <>
                Сверху — главные поля: <Field>Имя автора</Field>,{" "}
                <Field>Название сайта (в шапке и подвале)</Field>, <Field>Краткий слоган</Field>,{" "}
                <Field>История и философия</Field> и портрет. Под каждым полем написано,
                где это стоит на сайте.
              </>,
              <>
                Пролистайте ниже до заголовка <strong className="font-semibold">Все надписи сайта</strong>.
                Там строка поиска и список страниц: «Главная страница», «Шапка и подвал»,
                «Страница «Каталог»», «Карточка изделия», «Обо мне», «Контакты», «Бэкстейдж».
              </>,
              <>
                Увидели на сайте фразу, которую хотите поменять, — впишите одно её слово в
                строку поиска. Например, <strong className="font-semibold">повторю</strong> или{" "}
                <strong className="font-semibold">срок</strong>. Останется только это поле.
              </>,
              <>
                В поле стоит то, что на сайте сейчас. Сотрите и напишите своё.
              </>,
              <>
                Хотите, чтобы надписи не было вовсе — оставьте поле пустым. Под ним появится
                предупреждение «Поле пустое — на сайте этой надписи не будет». Это нормально:
                своё вместо стёртого сайт не подставит.
              </>,
              <>
                Передумали — нажмите <Btn>Вернуть исходный</Btn> справа над полем.
              </>,
              <>
                Внизу нажмите <Btn>Сохранить все тексты</Btn>. Одна кнопка сохраняет и
                главные поля, и все надписи разом.
              </>,
            ]}
          />
          <Note label="Что где">
            Изменённые поля подсвечены коричневой рамкой, а у страницы в списке стоит
            метка «изменено». Так видно, что вы уже переписали, а что стоит как было.
          </Note>
          <Note label="Подстановки в фигурных скобках">
            В некоторых полях встречаются слова в фигурных скобках: {"{имя}"}, {"{сайт}"},{" "}
            {"{изделие}"}. Их трогать не нужно — на сайте вместо них подставятся ваше имя,
            адрес сайта или название изделия. Можно переставить их в другое место фразы
            или убрать совсем.
          </Note>
          <Note label="Описания для поисковиков">
            Последняя группа в списке — «Описания для поисковиков». На самих страницах
            этих слов не видно, их читают Google и Яндекс и показывают под ссылкой на сайт.
            Менять не обязательно.
          </Note>
        </Chapter>

        <Chapter id="razdely" num="04" title="Разделы каталога: Свечи, Мыло и другие">
          <p className="text-[0.95rem] leading-relaxed text-ink">
            Вкладка <Btn>Разделы каталога</Btn>. Каждая строка — один большой раздел.
            У раздела есть название, подзаголовок, описание и обложка.
          </p>
          <h3 className="mt-2 font-display text-base font-semibold text-ink">Где что видно на сайте</h3>
          <Bullets
            items={[
              <>
                <Field>Краткий подзаголовок</Field> — строка под названием раздела на главной
                странице. Пустое поле — строки нет.
              </>,
              <>
                <Field>Подробное описание раздела</Field> — абзац под названием раздела в трёх
                местах: на главной, на странице «Каталог» и в шапке самого раздела. Раньше на
                странице «Каталог» стоял другой, придуманный текст, и поле из панели туда не
                попадало — исправлено, теперь везде ваш текст. Пустое поле — абзаца нет.
              </>,
              <>
                <Field>Обложка раздела</Field> — фотография раздела на главной и на странице
                «Каталог». В окне видно, какая стоит сейчас. <Btn>Choose File</Btn> выбирает
                новую, <Btn>Снять обложку</Btn> убирает совсем. До кнопки{" "}
                <Btn>Сохранить раздел</Btn> ничего не меняется.
              </>,
              <>
                <Field>Подпись обложки для поисковиков</Field> — на странице не видна, её читают
                Google и Яндекс. Пустая — подставится название раздела.
              </>,
            ]}
          />
          <h3 className="mt-2 font-display text-base font-semibold text-ink">Как поменять описание раздела</h3>
          <Steps
            items={[
              <>
                Вкладка <Btn>Разделы каталога</Btn>.
              </>,
              <>
                В строке нужного раздела нажмите <Btn>Редактировать</Btn>.
              </>,
              <>
                Впишите текст в <Field>Подробное описание раздела</Field> или сотрите его.
              </>,
              <>
                Нажмите <Btn>Сохранить раздел ✓</Btn>. Через несколько минут текст обновится на
                сайте — сразу и на главной, и в каталоге.
              </>,
            ]}
          />
          <h3 className="mt-2 font-display text-base font-semibold text-ink">Порядок и удаление</h3>
          <Bullets
            items={[
              <>
                Порядок строк — это порядок разделов на главной и на странице «Каталог».
                Стрелки ↑ ↓ слева от обложки или перетаскивание, сохраняется само.
              </>,
              <>
                Удалить можно только пустой раздел. Если в нём есть изделия, панель откажет и
                напишет, сколько их: сначала перенесите изделия в другой раздел (в карточке
                изделия поле <Field>Категория</Field>) или удалите их. Иначе сайт перестал бы
                собираться.
              </>,
            ]}
          />
        </Chapter>

        <Chapter id="lenta" num="06" title="Избранное на главной странице">
          <p className="text-[0.95rem] leading-relaxed text-ink">
            Это широкая полоса с карточками на главной. Раньше и название, и состав
            были вписаны намертво, теперь они ваши: и заголовок, и подпись, и то,
            какие изделия там стоят и в каком порядке.
          </p>

          <h3 className="mt-2 font-display text-base font-semibold text-ink">Где она в панели</h3>
          <Steps
            items={[
              <>
                Нажмите вкладку <Btn>ИЗБРАННОЕ</Btn> в верхней строке
              </>,
              <>
                В скобках рядом с названием вкладки — сколько изделий выбрано сейчас
              </>,
            ]}
          />

          <Figure caption="Тот же блок в панели: галочка сверху, три поля, список выбранного и поиск.">
            <svg viewBox="0 0 560 300" className="block h-auto w-full" role="img" aria-label="Блок «Лента избранного на главной» в панели">
              <rect x="0.5" y="0.5" width="559" height="299" rx="14" fill="none" stroke="var(--color-sand)" />
              <text x="18" y="26" fontSize="10.5" fontWeight="600" letterSpacing="1.2" fill="var(--color-muted)">ЛЕНТА ИЗБРАННОГО НА ГЛАВНОЙ</text>
              <rect x="424" y="16" width="12" height="12" rx="3" fill="var(--color-btn-brown)" />
              <path d="M427 22 l3 3 l5 -6" stroke="#ffffff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              <text x="443" y="26" fontSize="11" fill="var(--color-ink)">Показывать на сайте</text>

              <text x="18" y="54" fontSize="9" fontWeight="600" letterSpacing="0.9" fill="var(--color-muted)">НАДПИСЬ СВЕРХУ</text>
              <rect x="18" y="60" width="248" height="26" rx="10" fill="none" stroke="var(--color-sand)" />
              <text x="30" y="77" fontSize="11" fill="var(--color-ink)">Избранное мастерской</text>

              <text x="286" y="54" fontSize="9" fontWeight="600" letterSpacing="0.9" fill="var(--color-muted)">ЗАГОЛОВОК</text>
              <rect x="286" y="60" width="248" height="26" rx="10" fill="none" stroke="var(--color-sand)" />
              <text x="298" y="77" fontSize="11" fill="var(--color-ink)">Хиты продаж</text>

              <text x="18" y="108" fontSize="9" fontWeight="600" letterSpacing="0.9" fill="var(--color-muted)">ПОДПИСЬ ПОД ЗАГОЛОВКОМ</text>
              <rect x="18" y="114" width="516" height="26" rx="10" fill="none" stroke="var(--color-sand)" />
              <text x="30" y="131" fontSize="11" fill="var(--color-ink)">То, что заказывают чаще всего</text>

              <text x="18" y="162" fontSize="9" fontWeight="600" letterSpacing="0.9" fill="var(--color-muted)">ВЫБРАННЫЕ ИЗДЕЛИЯ (2)</text>

              <rect x="18" y="170" width="516" height="30" rx="10" fill="none" stroke="var(--color-sand)" />
              <text x="30" y="189" fontSize="10" fill="var(--color-muted)">1</text>
              <text x="46" y="189" fontSize="11" fill="var(--color-ink)">Букет тюльпанов · СВ-14</text>
              <text x="450" y="190" fontSize="13" fill="var(--color-muted)">↑</text>
              <text x="474" y="190" fontSize="13" fill="var(--color-muted)">↓</text>
              <text x="500" y="190" fontSize="12" fill="var(--color-muted)">✕</text>

              <rect x="18" y="206" width="516" height="30" rx="10" fill="none" stroke="var(--color-sand)" />
              <text x="30" y="225" fontSize="10" fill="var(--color-muted)">2</text>
              <text x="46" y="225" fontSize="11" fill="var(--color-ink)">Соты · СВ-02</text>
              <text x="450" y="226" fontSize="13" fill="var(--color-muted)">↑</text>
              <text x="474" y="226" fontSize="13" fill="var(--color-muted)">↓</text>
              <text x="500" y="226" fontSize="12" fill="var(--color-muted)">✕</text>

              <rect x="18" y="252" width="516" height="28" rx="10" fill="none" stroke="var(--color-sand)" />
              <text x="30" y="270" fontSize="11" fill="var(--color-muted)">Найти изделие по названию или артикулу…</text>
            </svg>
          </Figure>

          <h3 className="mt-2 font-display text-base font-semibold text-ink">Что меняют поля</h3>
          <Bullets
            items={[
              <>
                <strong className="font-semibold">Показывать на сайте</strong> — галочка
                справа сверху. Снимете — вся лента пропадёт с главной. Поставите обратно —
                вернётся.
              </>,
              <>
                <Field>Надпись сверху</Field> — мелкая строчка над заголовком.
              </>,
              <>
                <Field>Заголовок</Field> — крупная надпись. «Хиты продаж», «К Новому году»,
                «К 8 Марта» — что нужно.
              </>,
              <>
                <Field>Подпись под заголовком</Field> — строчка помельче. Можно оставить
                пустой.
              </>,
            ]}
          />

          <h3 className="mt-2 font-display text-base font-semibold text-ink">Как набрать изделия</h3>
          <Steps
            items={[
              <>
                Найдите внизу блока поле <Field>Найти изделие по названию или артикулу</Field>
              </>,
              <>Начните печатать название — например, «соты». Ниже останется только оно.</>,
              <>Нажмите на найденное изделие — оно встанет в список выше.</>,
              <>Так же добавьте остальные, сколько захотите.</>,
              <>
                Нажмите <Btn>СОХРАНИТЬ ВСЕ ТЕКСТЫ →</Btn> в самом низу
              </>,
            ]}
          />

          <h3 className="mt-2 font-display text-base font-semibold text-ink">Порядок и удаление</h3>
          <Bullets
            items={[
              <>Изделия стоят на сайте в том порядке, в каком они в списке.</>,
              <>
                Стрелки <strong className="font-semibold">↑</strong> и{" "}
                <strong className="font-semibold">↓</strong> справа переставляют изделие
                выше или ниже.
              </>,
              <>
                Крестик <strong className="font-semibold">✕</strong> убирает изделие из
                ленты. Из каталога оно никуда не денется — пропадёт только из этой полосы.
              </>,
            ]}
          />

          <Note label="Если не выбрать ни одного">
            Лента не опустеет. Она соберётся сама — по одному изделию из каждого раздела
            каталога. Пустого места на главной не будет.
          </Note>

          <Note label="Главное не забыть">
            Пока не нажата <Btn>СОХРАНИТЬ ВСЕ ТЕКСТЫ →</Btn>, на сайте ничего не изменится.
            Эта кнопка сохраняет весь раздел сразу — и рассказ о себе, и ленту.
          </Note>
        </Chapter>

        <Chapter id="podrazdely" num="05" title="Подразделы каталога">
          <Note label="Новое: описание подраздела">
            На вкладке <Btn>Подразделы</Btn> у каждой строки есть кнопка <Btn>+ Описание</Btn>.
            Нажмите, впишите текст, нажмите <Btn>Сохранить описание</Btn>. Он встанет под
            названием на странице этого подраздела и на странице раздела, когда нажата
            только эта кнопка-фильтр. Пустое описание — абзаца нет.
          </Note>
          <h3 className="font-display text-base font-semibold text-ink">Как устроен каталог</h3>
          <p className="text-[0.95rem] leading-relaxed text-ink">
            В каталоге три уровня. Сначала <strong className="font-semibold">раздел</strong> —
            Свечи, Мыло, Гипс. Внутри раздела{" "}
            <strong className="font-semibold">подразделы</strong> — Морская тема, Девушкам,
            Новый год. А внутри подраздела уже сами изделия.
          </p>

          <Figure caption="Подраздел живёт внутри того раздела, где лежит помеченное изделие.">
            <svg viewBox="0 0 560 210" className="block h-auto w-full" role="img" aria-label="Три уровня каталога: раздел, подраздел, изделия">
              <rect x="0" y="14" width="150" height="34" rx="12" fill="var(--color-sand)" />
              <text x="75" y="36" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--color-ink)">Свечи</text>
              <text x="75" y="62" textAnchor="middle" fontSize="9.5" letterSpacing="1" fill="var(--color-accent)">РАЗДЕЛ</text>

              <path d="M150 31 h40" stroke="var(--color-sand)" strokeWidth="1.5" />

              <rect x="196" y="0" width="164" height="30" rx="11" fill="none" stroke="var(--color-sand)" />
              <text x="278" y="20" textAnchor="middle" fontSize="12" fill="var(--color-ink)">Морская тема</text>
              <rect x="196" y="40" width="164" height="30" rx="11" fill="none" stroke="var(--color-sand)" />
              <text x="278" y="60" textAnchor="middle" fontSize="12" fill="var(--color-ink)">Новый год</text>
              <rect x="196" y="80" width="164" height="30" rx="11" fill="none" stroke="var(--color-sand)" />
              <text x="278" y="100" textAnchor="middle" fontSize="12" fill="var(--color-ink)">Девушкам</text>
              <text x="278" y="128" textAnchor="middle" fontSize="9.5" letterSpacing="1" fill="var(--color-accent)">ПОДРАЗДЕЛЫ</text>

              <path d="M360 55 h36" stroke="var(--color-sand)" strokeWidth="1.5" />

              <rect x="400" y="20" width="46" height="46" rx="10" fill="var(--color-sand)" />
              <rect x="456" y="20" width="46" height="46" rx="10" fill="var(--color-sand)" />
              <rect x="512" y="20" width="46" height="46" rx="10" fill="var(--color-sand)" />
              <rect x="400" y="72" width="46" height="46" rx="10" fill="var(--color-sand)" />
              <rect x="456" y="72" width="46" height="46" rx="10" fill="var(--color-sand)" />
              <rect x="512" y="72" width="46" height="46" rx="10" fill="var(--color-sand)" />
              <text x="479" y="136" textAnchor="middle" fontSize="9.5" letterSpacing="1" fill="var(--color-accent)">ИЗДЕЛИЯ</text>

              <text x="0" y="172" fontSize="11.5" fill="var(--color-muted)">Подраздел — это метка на изделии. Он появляется в каталоге тогда,</text>
              <text x="0" y="190" fontSize="11.5" fill="var(--color-muted)">когда метку получает хотя бы одно изделие. Пустых не бывает.</text>
            </svg>
          </Figure>

          <p className="text-[0.95rem] leading-relaxed text-ink">
            Поэтому если пометить «Новым годом» и свечу, и мыло, подраздел появится и в
            Свечах, и в Мыле. Пометите только свечу — будет только в Свечах.
          </p>

          <h3 className="mt-2 font-display text-base font-semibold text-ink">
            Как завести новый подраздел
          </h3>
          <Steps
            items={[
              <>
                Нажмите вкладку <Btn>ПОДРАЗДЕЛЫ</Btn> в верхней строке
              </>,
              <>
                В самом верху, в поле «Новый подраздел», впишите название — например,
                «Свадьба»
              </>,
              <>
                Нажмите <Btn>+ СОЗДАТЬ ПОДРАЗДЕЛ</Btn>
              </>,
              <>Он тут же встанет в список ниже</>,
            ]}
          />
          <Note label="В каталоге он появится не сразу">
            Подраздел показывается там, где есть отмеченные им изделия. Пока ни одно
            не отмечено, на сайте его не видно — и это правильно: пустых разделов
            в каталоге не бывает.
          </Note>

          <h3 className="mt-2 font-display text-base font-semibold text-ink">
            Тот же подраздел можно завести прямо из карточки изделия
          </h3>
          <Steps
            items={[
              <>
                Вкладка <Btn>ИЗДЕЛИЯ</Btn>, найдите изделие через поиск наверху
              </>,
              <>
                Нажмите под ним <Btn>Редактировать</Btn>
              </>,
              <>Пролистайте окно до блока «Подразделы и темы»</>,
              <>Под кругляшками найдите поле «Нет нужного подраздела? Создайте свой»</>,
              <>Впишите название и нажмите <Btn>+ СОЗДАТЬ ПОДРАЗДЕЛ</Btn></>,
              <>Подраздел появится среди кругляшков — уже с галочкой</>,
              <>
                Нажмите внизу окна <Btn>СОХРАНИТЬ ИЗДЕЛИЕ ✓</Btn>
              </>,
            ]}
          />

          <Figure caption="Отмеченный подраздел — коричневый, с галочкой. Неотмеченный — светлый, с плюсом.">
            <svg viewBox="0 0 560 210" className="block h-auto w-full" role="img" aria-label="Блок подразделов в карточке изделия и поле создания нового">
              <rect x="0.5" y="0.5" width="559" height="209" rx="14" fill="none" stroke="var(--color-sand)" />
              <text x="18" y="26" fontSize="9.5" fontWeight="600" letterSpacing="1" fill="var(--color-muted)">ПОДРАЗДЕЛЫ И ТЕМЫ (ОТМЕТЬТЕ ПОДХОДЯЩИЕ)</text>

              <rect x="18" y="36" width="516" height="66" rx="12" fill="none" stroke="var(--color-sand)" />
              <rect x="30" y="48" width="104" height="24" rx="12" fill="none" stroke="var(--color-sand)" />
              <text x="82" y="64" textAnchor="middle" fontSize="11" fill="var(--color-ink)">+ Морская тема</text>
              <rect x="142" y="48" width="86" height="24" rx="12" fill="var(--color-btn-brown)" />
              <text x="185" y="64" textAnchor="middle" fontSize="11" fill="#ffffff">✓ Девушкам</text>
              <rect x="236" y="48" width="82" height="24" rx="12" fill="none" stroke="var(--color-sand)" />
              <text x="277" y="64" textAnchor="middle" fontSize="11" fill="var(--color-ink)">+ Мужчинам</text>
              <rect x="326" y="48" width="62" height="24" rx="12" fill="none" stroke="var(--color-sand)" />
              <text x="357" y="64" textAnchor="middle" fontSize="11" fill="var(--color-ink)">+ Детям</text>
              <rect x="30" y="78" width="86" height="16" rx="8" fill="none" stroke="var(--color-sand)" />
              <rect x="124" y="78" width="66" height="16" rx="8" fill="none" stroke="var(--color-sand)" />
              <rect x="198" y="78" width="94" height="16" rx="8" fill="none" stroke="var(--color-sand)" />
              <text x="304" y="90" fontSize="10" fill="var(--color-muted)">…и остальные, список прокручивается</text>

              <text x="18" y="128" fontSize="9.5" fontWeight="600" letterSpacing="1" fill="var(--color-muted)">НЕТ НУЖНОГО ПОДРАЗДЕЛА? СОЗДАЙТЕ СВОЙ</text>
              <rect x="18" y="138" width="330" height="30" rx="12" fill="none" stroke="var(--color-sand)" />
              <text x="32" y="157" fontSize="11.5" fill="var(--color-ink)">Свадьба</text>
              <rect x="358" y="138" width="176" height="30" rx="15" fill="var(--color-btn-brown)" />
              <text x="446" y="157" textAnchor="middle" fontSize="10.5" fontWeight="600" letterSpacing="0.8" fill="#ffffff">+ СОЗДАТЬ ПОДРАЗДЕЛ</text>
              <text x="18" y="190" fontSize="11" fill="var(--color-muted)">После нажатия «Свадьба» встанет к кругляшкам выше — сразу с галочкой.</text>
            </svg>
          </Figure>

          <h3 className="mt-2 font-display text-base font-semibold text-ink">
            Как добавить в подраздел другие изделия
          </h3>
          <Steps
            items={[
              <>
                Откройте другое изделие кнопкой <Btn>Редактировать</Btn>
              </>,
              <>В блоке «Подразделы и темы» нажмите на нужный кругляшок</>,
              <>Он станет коричневым, и перед названием появится галочка</>,
              <>
                Нажмите <Btn>СОХРАНИТЬ ИЗДЕЛИЕ ✓</Btn>
              </>,
            ]}
          />
          <p className="text-[0.95rem] leading-relaxed text-ink">
            Одно изделие может стоять сразу в нескольких подразделах — отметьте столько
            кругляшков, сколько подходит.
          </p>

          <h3 className="mt-2 font-display text-base font-semibold text-ink">
            Как убрать изделие из подраздела
          </h3>
          <Steps
            items={[
              <>
                Откройте изделие кнопкой <Btn>Редактировать</Btn>
              </>,
              <>Нажмите на отмеченный кругляшок ещё раз — галочка снимется</>,
              <>
                Нажмите <Btn>СОХРАНИТЬ ИЗДЕЛИЕ ✓</Btn>
              </>,
            ]}
          />

          <Note label="Как убрать подраздел совсем">
            Снимите его у всех изделий. Как только метки не осталось ни у одного,
            подраздел исчезнет из каталога сам — показывать в нём нечего.
          </Note>

          <Note label="Про название">
            Пишите так, как хотите видеть на сайте: по-русски, с большой буквы. Адрес
            страницы латиницей система сделает сама. Если такой подраздел уже есть, второй
            не заведётся — система просто отметит существующий.
          </Note>
        </Chapter>

        <Chapter id="poryadok" num="07" title="Порядок: что за чем стоит">
          <p className="text-[0.95rem] leading-relaxed text-ink">
            <strong className="font-semibold">Возьмите карточку мышью и перетащите</strong>{" "}
            туда, где ей место. Пока тащите, будущее место подсвечивается рамкой.
            Отпустили — переставилось и сразу сохранилось, отдельной кнопки не нужно.
            Порядок в панели и есть порядок на сайте.
          </p>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-ink">
            <strong className="font-semibold">На телефоне — нажмите и подержите.</strong>{" "}
            Примерно треть секунды: карточка приподнимется, дальше ведите пальцем и
            отпустите там, где нужно. Пока держите меньше — палец листает страницу,
            как обычно, поэтому список никуда не убегает.
          </p>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-ink">
            Стрелки <Btn>↑</Btn> <Btn>↓</Btn> никуда не делись — если так привычнее.
          </p>
          <Bullets
            items={[
              <>
                <strong className="font-semibold">Подразделы.</strong> Вкладка{" "}
                <Btn>Подразделы</Btn>. Здесь же их можно переименовать и удалить.
                К декабрю поднимите «Новый год» наверх, в январе опустите обратно.
              </>,
              <>
                <strong className="font-semibold">Изделия внутри раздела.</strong> Вкладка{" "}
                <Btn>Изделия</Btn>: выберите один раздел в списке слева и очистите поиск —
                тогда карточки можно двигать. Пока выбрано «Все категории», перетаскивание
                выключено: «выше» без раздела означало бы неизвестно что.
              </>,
              <>
                <strong className="font-semibold">Кадры бэкстейджа.</strong> Вкладка{" "}
                <Btn>Бэкстейдж</Btn>, стрелки под каждым кадром. Номер в углу кадра —
                его место в ленте.
              </>,
              <>
                <strong className="font-semibold">Фотографии одного изделия.</strong>{" "}
                Внутри карточки: тащите снимок мышью или, на телефоне, удержанием
                пальца. Первый помечен словом «Обложка» — именно он показывается
                в каталоге.
              </>,
              <>
                <strong className="font-semibold">Ролики, похожие изделия и лента избранного.</strong>{" "}
                Тоже перетаскиваются: ролики и «Похожие» — внутри карточки изделия,
                лента — на вкладке <Btn>Избранное</Btn>.
              </>,
            ]}
          />
          <Note label="Про подразделы и ссылки">
            Переименование меняет только надпись. Адрес раздела остаётся прежним, поэтому
            ссылки, которые вы кому-то отправляли, продолжают работать.
          </Note>
        </Chapter>

        <Chapter id="foto-video" num="08" title="Фотографии и видео в карточке">
          <p className="text-[0.95rem] leading-relaxed text-ink">
            Всё это внизу окна <Field>Редактирование изделия</Field>.
          </p>
          <Bullets
            items={[
              <>
                <strong className="font-semibold">Убрать фотографию</strong> — крестик{" "}
                <Btn>✕</Btn> в углу снимка. Добавить — <Btn>Выбрать файлы</Btn>, можно
                сразу несколько. Записывается всё это кнопкой{" "}
                <Btn>Сохранить изделие</Btn>, до неё ничего не потеряно: закрыли окно
                через <Btn>Отмена</Btn> — всё осталось как было.
              </>,
              <>
                <strong className="font-semibold">Подпись для поисковиков.</strong> Под каждым
                снимком маленькое поле. На странице его не видно — этот текст читают Google и
                Яндекс и те, кому картинки не показываются. Пустое — подставится название
                изделия. Заполнять не обязательно.
              </>,
              <>
                Совсем без фотографий изделие сохранить нельзя — панель об этом скажет.
                Если изделие больше не нужно целиком, удаляйте его самого кнопкой{" "}
                <Btn>Удалить</Btn> на карточке.
              </>,
              <>
                <strong className="font-semibold">Видео.</strong> Блок{" "}
                <Field>🎬 Видео изделия</Field>. Нажмите{" "}
                <Btn>🎬 Выбрать из архива роликов</Btn> — там вся ваша съёмка процесса,
                которая уже загружена на сайт. Выбрали нужный — он прицепился к изделию.
              </>,
              <>
                <strong className="font-semibold">Роликов может быть несколько.</strong>{" "}
                Список не закрывается после выбора: нажали один ролик, нажали второй —
                оба встали в список под блоком. Порядок в списке — это порядок на
                странице изделия, меняется перетаскиванием.
              </>,
              <>
                <Btn>Убрать</Btn> отцепляет ролик от изделия. Сам ролик остаётся
                в списке и его можно прицепить к другому изделию.
              </>,
              <>
                Свой новый ролик с телефона — кнопка <Btn>➕ Загрузить свой ролик</Btn>.
                Файл берётся целиком, до 200 МБ, ничего заранее сжимать не нужно: панель
                покажет, что ролик готовится, и через пару минут он появится в архиве. Ссылка
                на YouTube или Vimeo нужна только для чужих или очень длинных роликов: вставьте
                её в поле ниже и нажмите <Btn>Добавить</Btn>. Если это не ссылка на видео,
                панель так и скажет и ничего не прицепит.
              </>,
            ]}
          />
          <h3 className="mt-2 font-display text-base font-semibold text-ink">
            Похожие изделия внизу страницы
          </h3>
          <p className="text-[0.95rem] leading-relaxed text-ink">
            Под изделием стоит небольшая полоса «Похожие». Пока в блоке{" "}
            <Field>🔗 Похожие изделия</Field> ничего не выбрано, сайт подбирает
            соседей сам — по общим темам внутри раздела. Выберете хоть одно —
            будет показывать только ваш список и в вашем порядке; стрелки и крестик
            работают там так же, как везде.
          </p>

          <Note label="Как видео ведёт себя на сайте">
            Ролик стоит обложкой и ждёт нажатия. Нажали — играет со звуком, один раз,
            и останавливается. Включили другой — первый сам встаёт на паузу, две музыки
            больше не накладываются.
          </Note>
        </Chapter>

        <Chapter id="portret" num="09" title="Ваше фото на главной">
          <p className="text-[0.95rem] leading-relaxed text-ink">
            Вкладка <Btn>Тексты и обо мне</Btn>, ниже слогана — <Field>Портретное фото автора</Field>.
            Рядом с полем видно, какое фото стоит на сайте прямо сейчас. Под ним —{" "}
            <Field>Подпись портрета для поисковиков</Field>: на странице не видна, читают Google и Яндекс.
          </p>
          <Note label="Фотографии внизу страницы «Обо мне»">
            Следующий блок — <Field>Фотографии на странице «Обо мне»</Field>. Это кладка снимков
            внизу страницы, под надписью «В мастерской и на съёмке». Сейчас блок пуст и на сайте
            его не видно — появится, когда добавите кадры из мастерской: <Btn>Choose File</Btn> (можно несколько сразу),
            крестик убирает, стрелки ← → переставляют, поле под снимком — подпись для поисковиков.
            Всё записывается той же кнопкой <Btn>Сохранить все тексты</Btn>. Убрали все снимки —
            блока на странице не будет.
          </Note>
          <Bullets
            items={[
              <>
                Выбранный снимок сразу показывается рядом, с подписью «Новое фото —
                ещё не сохранено».
              </>,
              <>
                Пока не нажата кнопка <Btn>Сохранить все тексты</Btn>, на сайте ничего
                не меняется.
              </>,
              <>
                Передумали — <Btn>Убрать выбранное фото, оставить прежнее</Btn>.
              </>,
            ]}
          />
          <Note label="Это фото стоит в двух местах">
            На первом экране главной страницы и на странице «Обо мне». Меняете здесь —
            меняется в обоих.
          </Note>
        </Chapter>

        <Chapter id="backstage" num="10" title="Бэкстейдж">
          <p className="text-[0.95rem] leading-relaxed text-ink">
            Вкладка <Btn>Бэкстейдж</Btn> — лента кадров и роликов из мастерской на странице
            «Бэкстейдж» сайта. Заголовок и абзац над лентой правятся в главе{" "}
            <a href="#teksty" className="link-underline font-semibold text-ink">«Любая надпись на сайте»</a>,
            группа «Страница «Бэкстейдж»».
          </p>
          <Bullets
            items={[
              <>
                <strong className="font-semibold">Добавить фото.</strong> Впишите{" "}
                <Field>Подпись к кадру</Field>, выберите файл, нажмите <Btn>Опубликовать</Btn>.
                Кадр встанет первым.
              </>,
              <>
                <strong className="font-semibold">Добавить ролик.</strong> Кнопка{" "}
                <Btn>🎬 Добавить ролик из архива</Btn> под формой. Откроется архив — нажмите на
                ролик, он встанет первым в ленте. Ролики, которые уже в ленте, отмечены и
                второй раз не добавятся. Новый ролик с телефона сначала загружается на вкладке{" "}
                <Btn>Видео</Btn>, потом появляется в этом архиве.
              </>,
              <>
                <strong className="font-semibold">Подпись</strong> под кадром в панели — для вас,
                на сайте она не показывается (в ленте только фотографии, без подписей — так
                задумано). Нажмите на подпись с карандашом ✎, чтобы переписать.
              </>,
              <>
                Порядок — перетаскиванием или стрелками, как везде. <Btn>Удалить</Btn> убирает
                кадр из ленты; файл ролика в архиве остаётся.
              </>,
            ]}
          />
        </Chapter>

        <Chapter id="kontakty" num="11" title="Контакты и WhatsApp">
          <p className="text-[0.95rem] leading-relaxed text-ink">
            Вкладка <Btn>Контакты</Btn>. Всё, что здесь вписано, показывается в подвале
            сайта, в блоке контактов на главной и на странице «Контакты».
          </p>
          <Bullets
            items={[
              <>
                <Field>Активный номер WhatsApp</Field> — на него ведут все кнопки «WhatsApp» и
                «Написать в WhatsApp». Кнопки <Btn>Номер Армении</Btn> и <Btn>Номер России</Btn>{" "}
                подставляют номер из полей ниже, чтобы не набирать руками. Ссылка «Проверить
                переход» открывает WhatsApp так, как увидит покупатель.
              </>,
              <>
                Телефоны, Instagram, Facebook, почта и город — по одному полю на каждое. Пустое
                поле — строки на сайте нет.
              </>,
              <>
                Текст, который покупатель увидит уже набранным в WhatsApp, правится в главе{" "}
                <a href="#teksty" className="link-underline font-semibold text-ink">«Любая надпись на сайте»</a>,
                группа «Сообщения в WhatsApp».
              </>,
              <>
                Кнопка <Btn>Сохранить контакты и номер WhatsApp →</Btn> внизу. Если панель не смогла сохранить,
                она скажет об этом прямо, а не промолчит.
              </>,
            ]}
          />
        </Chapter>

        <Chapter id="sohranit" num="12" title="Что происходит после «Сохранить»">
          <p className="text-[0.95rem] leading-relaxed text-ink">
            Правка сохраняется сразу, но сайт обновляется не мгновенно: он собирается
            заново целиком. Это занимает{" "}
            <strong className="font-semibold">от пяти до десяти минут</strong>.
          </p>
          <Bullets
            items={[
              <>Нажимать «Сохранить» второй и третий раз не нужно — от этого только дольше.</>,
              <>
                Когда время вышло, откройте сайт и обновите страницу. На телефоне —
                потяните её вниз.
              </>,
              <>
                На компьютере обновляйте с очисткой:{" "}
                <strong className="font-semibold">Ctrl + Shift + R</strong>, на Маке{" "}
                <strong className="font-semibold">Cmd + Shift + R</strong>. Иначе браузер
                покажет вчерашнюю страницу из своей памяти.
              </>,
            ]}
          />
          <Note label="Панель и сайт идут не в ногу — так и должно быть">
            Сама панель показывает изменение сразу: удалили кадр — он тут же пропал из
            списка, и после обновления страницы не вернётся. Сайт догоняет через
            несколько минут. Повторять удаление, пока сайт ещё старый, не нужно.
          </Note>
          <Note label="Если через полчаса ничего не изменилось">
            Напишите разработчику и скажите, что именно правили. Правка не пропала — она
            сохранена, просто застряла где-то по дороге на сайт.
          </Note>
        </Chapter>

        <Chapter id="otkat" num="13" title="Если удалили лишнее">
          <p className="text-[0.95rem] leading-relaxed text-ink">
            Вернуть можно всё и на любой день назад. Каждое ваше сохранение
            записывается отдельно и со временем — как страницы в тетради, которые
            не стираются. Ни одна правка ничего не затирает окончательно.
          </p>
          <Bullets
            items={[
              <>
                <strong className="font-semibold">Пока окно изделия открыто</strong> —
                достаточно нажать <Btn>Отмена</Btn>. Ничего сохранено не было.
              </>,
              <>
                <strong className="font-semibold">Уже сохранили и передумали</strong> —
                чаще всего проще сделать обратное действие руками: вернуть подраздел
                на место стрелками, заново отметить тему, загрузить фотографию.
              </>,
              <>
                <strong className="font-semibold">Удалили много и не помните что</strong> —
                напишите разработчику: «верните, как было вчера утром». Состояние
                сайта откатывается на нужный день целиком. Своей кнопки для этого в
                панели пока нет — слишком легко откатить лишнее, не заметив.
              </>,
            ]}
          />
          <Note label="Чем раньше скажете, тем проще">
            Откат возвращает всё разом, поэтому правки, сделанные после ошибки, тоже
            уедут. Если между ошибкой и обращением вы успели сделать много хорошего,
            восстанавливать придётся по частям.
          </Note>
        </Chapter>

        <Chapter id="melochi" num="14" title="Мелочи, которые стоит знать">
          <Bullets
            items={[
              <>
                Фотографии можно грузить любые, прямо с телефона: панель сама их сожмёт,
                качество не пострадает.
              </>,
              <>Цен на сайте нет нигде и не появится — так задумано.</>,
              <>
                Название и описание правятся свободно, сколько угодно раз: адрес
                страницы за ними не тянется, ссылки не ломаются. Адрес — отдельное поле{" "}
                <Field>Адрес страницы (в ссылке)</Field> рядом с артикулом, и трогать его
                стоит, только если он сам вам не нравится.
              </>,
              <>
                Артикулы: <strong className="font-semibold">СВ</strong> свечи,{" "}
                <strong className="font-semibold">МЛ</strong> мыло,{" "}
                <strong className="font-semibold">ГП</strong> гипс,{" "}
                <strong className="font-semibold">СШ</strong> саше,{" "}
                <strong className="font-semibold">ПС</strong> подсвечники,{" "}
                <strong className="font-semibold">ШК</strong> шкатулки,{" "}
                <strong className="font-semibold">ПД</strong> блюда,{" "}
                <strong className="font-semibold">ДК</strong> декор.
              </>,
              <>
                Описание видно на странице изделия. Состав, аромат, вес и время горения —
                отдельные поля: они появятся в карточке, только если вы их впишете.
              </>,
              <>
                Ломать панель, нажимая не туда, у вас не получится: вернуть можно любое
                действие — как именно, написано в главе{" "}
                <a href="#otkat" className="link-underline font-semibold text-ink">
                  «Если удалили лишнее»
                </a>
                .
              </>,
            ]}
          />
        </Chapter>

        <footer className="flex flex-col gap-2 border-t border-sand pt-7 text-sm text-muted">
          <p>
            Эта страница будет пополняться: появится новая возможность — появится и глава
            про неё.
          </p>
          <p>
            Если что-то повело себя не так, как здесь написано, — напишите разработчику и
            скажите, на каком шаге остановились.
          </p>
          <Link
            href="/admin"
            className="mt-2 self-start rounded-full border border-sand bg-surface px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-sand/30"
          >
            ← Вернуться в панель
          </Link>
        </footer>
      </div>
    </div>
  );
}
