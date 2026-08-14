import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SmoothScroll } from "@/components/SmoothScroll";
import { getSite } from "@/lib/content";
import { cormorant, jost } from "@/lib/fonts";
import type { Metadata, Viewport } from "next";
import "./globals.css";

const site = getSite();

export const metadata: Metadata = {
  metadataBase: new URL("https://candles-soap.vercel.app"),
  title: {
    default: `${site.owner} — изделия ручной работы`,
    template: `%s — ${site.owner}`,
  },
  description: site.tagline,
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: site.owner,
    title: `${site.owner} — изделия ручной работы`,
    description: site.tagline,
  },
};

export const viewport: Viewport = {
  themeColor: "#F7F3ED",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${cormorant.variable} ${jost.variable}`}>
      <body>
        <SmoothScroll />
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
