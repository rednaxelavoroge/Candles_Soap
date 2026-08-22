import { getSite } from "@/lib/content";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Картинка считается на сборке и лежит готовым файлом. Без этого
// статическая выгрузка (STATIC_EXPORT=1) падает: Next считает маршрут
// серверным и не знает, что его можно посчитать заранее.
export const dynamic = "force-static";

/**
 * Картинка-превью для мессенджеров и соцсетей. Собирается на сборке:
 * слева имя и строка позиционирования, справа кадр свечи из каталога.
 *
 * Шрифты тянем в формате truetype — satori не понимает woff2, а Google
 * отдаёт ttf только клиентам со старым user-agent.
 */
export const alt = "AnnaManasaryan.Art — свечи, мыло и предметы для дома ручной работы";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LEGACY_UA = "Mozilla/5.0 (Windows NT 6.1)";

async function loadFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&subset=cyrillic`,
      { headers: { "user-agent": LEGACY_UA } },
    ).then((response) => response.text());

    const url = css.match(/src: url\((https:\/\/[^)]+)\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((response) => response.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const site = getSite();

  const [display, sans, photo] = await Promise.all([
    loadFont("Cormorant+Garamond", 400),
    loadFont("Jost", 300),
    readFile(join(process.cwd(), "public", "og", "candle.jpg")),
  ]);

  const photoSrc = `data:image/jpeg;base64,${photo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#2E2A26",
          fontFamily: "Jost",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 56px",
          }}
        >
          <div
            style={{
              fontSize: 24,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#A88763",
            }}
          >
            {site.brand}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: "Cormorant Garamond",
                fontSize: 88,
                lineHeight: 1,
                color: "#F7F3ED",
              }}
            >
              {site.owner}
            </div>
            <div style={{ marginTop: 24, fontSize: 30, lineHeight: 1.35, color: "#EADFCE" }}>
              Свечи, мыло и предметы для дома
            </div>
            <div style={{ marginTop: 6, fontSize: 30, lineHeight: 1.35, color: "#C9B296" }}>
              ручная работа, малые партии
            </div>
          </div>

          <div style={{ fontSize: 24, color: "#C9B296" }}>
            {site.domain.replace(/^https?:\/\//, "")}
          </div>
        </div>

        {/* Белая рамка между текстом и кадром — тот же приём, что в сетках. */}
        <div style={{ display: "flex", padding: 20, backgroundColor: "#F7F3ED" }}>
          <img src={photoSrc} width={520} height={590} style={{ objectFit: "cover" }} alt="" />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        ...(display ? [{ name: "Cormorant Garamond", data: display, weight: 400 as const, style: "normal" as const }] : []),
        ...(sans ? [{ name: "Jost", data: sans, weight: 300 as const, style: "normal" as const }] : []),
      ],
    },
  );
}

