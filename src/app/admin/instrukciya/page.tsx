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
  { id: "lenta", num: "03", title: "Лента на главной странице" },
  { id: "podrazdely", num: "04", title: "Подразделы каталога" },
  { id: "poryadok", num: "05", title: "Порядок: что за чем стоит" },
  { id: "foto-video", num: "06", title: "Фотографии и видео в карточке" },
  { id: "sohranit", num: "07", title: "Что происходит после «Сохранить»" },
  { id: "otkat", num: "08", title: "Если удалили лишнее" },
  { id: "melochi", num: "09", title: "Мелочи, которые стоит знать" },
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
            Наверху панели пять кнопок. Это пять разных мест.
          </p>

          <Figure caption="Так выглядит верх панели. Коричневая — та, что открыта сейчас.">
            <svg viewBox="0 0 560 96" className="block h-auto w-full" role="img" aria-label="Ряд из пяти вкладок наверху панели">
              <rect x="0" y="8" width="120" height="30" rx="15" fill="var(--color-sand)" />
              <text x="60" y="27" textAnchor="middle" fontSize="10.5" fontWeight="600" letterSpacing="0.7" fill="var(--color-ink)">ИЗДЕЛИЯ (239)</text>
              <rect x="130" y="8" width="180" height="30" rx="15" fill="var(--color-sand)" />
              <text x="220" y="27" textAnchor="middle" fontSize="10.5" fontWeight="600" letterSpacing="0.7" fill="var(--color-ink)">РАЗДЕЛЫ КАТАЛОГА (5)</text>
              <rect x="320" y="8" width="170" height="30" rx="15" fill="var(--color-btn-brown)" />
              <text x="405" y="27" textAnchor="middle" fontSize="10.5" fontWeight="600" letterSpacing="0.7" fill="#ffffff">ТЕКСТЫ И ОБО МНЕ</text>
              <rect x="0" y="48" width="130" height="30" rx="15" fill="var(--color-sand)" />
              <text x="65" y="67" textAnchor="middle" fontSize="10.5" fontWeight="600" letterSpacing="0.7" fill="var(--color-ink)">БЭКСТЕЙДЖ (54)</text>
              <rect x="140" y="48" width="105" height="30" rx="15" fill="var(--color-sand)" />
              <text x="192" y="67" textAnchor="middle" fontSize="10.5" fontWeight="600" letterSpacing="0.7" fill="var(--color-ink)">КОНТАКТЫ</text>
              <text x="405" y="62" textAnchor="middle" fontSize="10" fill="var(--color-accent)">выбранная вкладка — коричневая</text>
            </svg>
          </Figure>

          <div className="flex flex-col gap-3">
            {[
              ["Изделия", "Все свечи, мыло, гипс. Здесь их добавляют, правят и удаляют. Здесь же заводятся подразделы."],
              ["Разделы каталога", "Пять больших разделов: Свечи, Мыло, Гипсовые изделия, Декор, Аромасаше. Их названия, описания и обложки."],
              ["Тексты и обо мне", "Имя, слоган, рассказ о себе, портрет. И лента на главной странице."],
              ["Бэкстейдж", "Кадры и ролики из мастерской."],
              ["Контакты", "Телефоны, WhatsApp, Instagram."],
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

        <Chapter id="lenta" num="03" title="Лента на главной странице">
          <p className="text-[0.95rem] leading-relaxed text-ink">
            Это широкая полоса с карточками на главной — сейчас она называется
            «Коллекция сезона». Раньше и название, и состав были вписаны намертво.
            Теперь они ваши.
          </p>

          <h3 className="mt-2 font-display text-base font-semibold text-ink">Где она в панели</h3>
          <Steps
            items={[
              <>
                Нажмите вкладку <Btn>ТЕКСТЫ И ОБО МНЕ</Btn>
              </>,
              <>Пролистайте вниз до блока «Лента избранного на главной»</>,
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

        <Chapter id="podrazdely" num="04" title="Подразделы каталога">
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
                Нажмите вкладку <Btn>ИЗДЕЛИЯ</Btn>
              </>,
              <>
                Найдите через поиск наверху изделие, которое должно попасть в новый
                подраздел
              </>,
              <>
                Нажмите под ним <Btn>Редактировать</Btn>
              </>,
              <>Пролистайте окно до блока «Подразделы и темы»</>,
              <>Под кругляшками найдите поле «Нет нужного подраздела? Создайте свой»</>,
              <>Впишите название — например, «Свадьба»</>,
              <>
                Нажмите <Btn>+ СОЗДАТЬ ПОДРАЗДЕЛ</Btn>
              </>,
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

        <Chapter id="poryadok" num="05" title="Порядок: что за чем стоит">
          <p className="text-[0.95rem] leading-relaxed text-ink">
            Везде, где важно, что идёт первым, у строк и карточек есть стрелки{" "}
            <Btn>↑</Btn> <Btn>↓</Btn>. Нажали — переставилось и сразу сохранилось,
            отдельной кнопки не нужно. Порядок в панели и есть порядок на сайте.
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
                у карточек появятся стрелки. Пока выбрано «Все категории», стрелок нет:
                «выше» без раздела означало бы неизвестно что.
              </>,
              <>
                <strong className="font-semibold">Кадры бэкстейджа.</strong> Вкладка{" "}
                <Btn>Бэкстейдж</Btn>, стрелки под каждым кадром. Номер в углу кадра —
                его место в ленте.
              </>,
              <>
                <strong className="font-semibold">Фотографии одного изделия.</strong>{" "}
                Внутри карточки, стрелки <Btn>←</Btn> <Btn>→</Btn> под каждым снимком.
                Первый помечен словом «Обложка» — именно он показывается в каталоге.
              </>,
            ]}
          />
          <Note label="Про подразделы и ссылки">
            Переименование меняет только надпись. Адрес раздела остаётся прежним, поэтому
            ссылки, которые вы кому-то отправляли, продолжают работать.
          </Note>
        </Chapter>

        <Chapter id="foto-video" num="06" title="Фотографии и видео в карточке">
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
                Совсем без фотографий изделие сохранить нельзя — панель об этом скажет.
                Если изделие больше не нужно целиком, удаляйте его самого кнопкой{" "}
                <Btn>Удалить</Btn> на карточке.
              </>,
              <>
                <strong className="font-semibold">Видео.</strong> Блок{" "}
                <Field>Видео изделия</Field>. Нажмите{" "}
                <Btn>Выбрать из моих роликов</Btn> — там вся ваша съёмка процесса,
                которая уже загружена на сайт. Выбрали нужный — он прицепился к изделию.
              </>,
              <>
                <Btn>Убрать видео</Btn> отцепляет ролик от изделия. Сам ролик остаётся
                в списке и его можно прицепить к другому изделию.
              </>,
              <>
                Свой новый ролик: короткий пройдёт через{" "}
                <Btn>Загрузить короткий ролик</Btn>. Снятый на телефон обычно слишком
                тяжёлый — такой лучше выложить на YouTube и вставить ссылку в поле ниже.
                Так он и у покупателей будет открываться быстрее.
              </>,
            ]}
          />
          <Note label="Как видео ведёт себя на сайте">
            Ролик стоит обложкой и ждёт нажатия. Нажали — играет со звуком, один раз,
            и останавливается. Включили другой — первый сам встаёт на паузу, две музыки
            больше не накладываются.
          </Note>
        </Chapter>

        <Chapter id="sohranit" num="07" title="Что происходит после «Сохранить»">
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
          <Note label="Если через полчаса ничего не изменилось">
            Напишите разработчику и скажите, что именно правили. Правка не пропала — она
            сохранена, просто застряла где-то по дороге на сайт.
          </Note>
        </Chapter>

        <Chapter id="otkat" num="08" title="Если удалили лишнее">
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

        <Chapter id="melochi" num="09" title="Мелочи, которые стоит знать">
          <Bullets
            items={[
              <>
                Фотографии можно грузить любые, прямо с телефона: панель сама их сожмёт,
                качество не пострадает.
              </>,
              <>Цен на сайте нет нигде и не появится — так задумано.</>,
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
