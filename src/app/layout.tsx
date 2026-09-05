import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SmoothScroll } from "@/components/SmoothScroll";
import { HydrationGuard } from "@/components/ui/HydrationGuard";
import { VideoFocus } from "@/components/ui/VideoFocus";
import { getSite, getText } from "@/lib/content";
import { comfortaa } from "@/lib/fonts";
import type { Metadata, Viewport } from "next";
import "./globals.css";

const site = getSite();
const homeTitle = [site.owner, getText("seo.homeTitle")].filter(Boolean).join(" — ");

/**
 * Абсолютный адрес сайта для og:image и canonical. Пока боевой домен не
 * подключён, брать его из site.json нельзя: превью в мессенджерах ведёт на
 * несуществующий хост, картинка не грузится и остаётся голый текст.
 *
 * VERCEL_PROJECT_PRODUCTION_URL Vercel подставляет сам — сейчас это
 * candles-soap.vercel.app, а после привязки annamanasaryan.art станет им же.
 */
function resolveBaseUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return new URL(`https://${vercel}`);

  return new URL(site.domain);
}

export const metadata: Metadata = {
  metadataBase: resolveBaseUrl(),
  title: {
    default: homeTitle,
    template: `%s — ${site.brand}`,
  },
  description: site.tagline,
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: site.brand,
    title: homeTitle,
    description: site.tagline,
  },
};

export const viewport: Viewport = {
  themeColor: "#F7F3ED",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Класс `js` дописывает скрипт ниже — до того, как React разберётся с
    // разметкой. Предупреждение о расхождении здесь ожидаемо и не значит ошибки.
    <html lang="ru" className={comfortaa.variable} suppressHydrationWarning>
      <body>
        {/*
          Половины секций выезжают из-за краёв, а значит стартуют невидимыми.
          Если скрипты не отработают — как это случалось в Яндекс Старте и в
          Яндексе с Алисой, — показывать было бы нечего.

          Эта строка выполняется первой на странице и ставит на <html>
          атрибут `data-js`. Пока его нет, стиль в globals.css силой
          возвращает половины на место: страница читается целиком, просто
          без движения.

          Атрибут, а не класс: className корня — свойство, которым
          распоряжается React, и при гидратации он возвращал его к тому, что
          было на сервере, унося метку с собой. Незнакомые ему атрибуты React
          не трогает.

          Сразу за строкой — сторож. Метка, поставленная сразу, снимает
          страховку ещё до того, как выяснится, доехал ли основной код: в
          Яндекс Браузере он иногда не доезжал, и оставался пустой экран.
          Сторож ждёт отметки от HydrationGuard и снимает метку, если её нет
          четыре секунды. Время в скрытой вкладке не считается: браузер там
          придерживает работу, и живая страница выглядела бы мёртвой.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'document.documentElement.setAttribute("data-js","1");' +
              '(function(){var w=0,t=setInterval(function(){' +
              'if(window.__siteHydrated){clearInterval(t);return}' +
              'if(document.visibilityState==="hidden")return;' +
              'if((w+=250)>=4000){clearInterval(t);' +
              'document.documentElement.removeAttribute("data-js")}' +
              '},250)})();',
          }}
        />
        <HydrationGuard />
        <SmoothScroll />
        <VideoFocus />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-surface focus:px-4 focus:py-2 focus:text-sm"
        >
          Перейти к содержимому
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
