/**
 * Акварельные брызги вокруг кадра.
 *
 * Заказчица прислала примеры прямо картинками: фотография стоит в белой рамке,
 * а из-под неё во все стороны расходятся акварельные пятна с рваными мягкими
 * краями, и вокруг разлетаются капли — часть залитые, часть колечками с пустой
 * серединой. Цвет пятен подобран под сам снимок.
 *
 * Раньше кляксы у нас лежали мазками по углам секции — это другое: там фон
 * страницы, а ей нужно обрамление кадра.
 *
 * Мягкий рваный край даётся фильтром: турбулентный шум смещает контур пятна,
 * потом лёгкое размытие. Ровный овал так превращается в акварельное пятно,
 * и рисовать сотню узлов вручную не нужно.
 *
 * Когда придут готовые картинки от заказчицы, они встают на то же место
 * подложкой — разметка вокруг не меняется.
 */

/** Пятно: положение и размер в процентах от квадрата рисунка, плюс поворот. */
const SPLASHES: { cx: number; cy: number; rx: number; ry: number; rot: number; tone: 0 | 1 | 2 }[] =
  [
    { cx: 20, cy: 38, rx: 20, ry: 26, rot: -18, tone: 0 },
    { cx: 82, cy: 30, rx: 17, ry: 25, rot: 22, tone: 1 },
    { cx: 74, cy: 76, rx: 22, ry: 18, rot: -8, tone: 0 },
    { cx: 28, cy: 78, rx: 18, ry: 15, rot: 14, tone: 2 },
    { cx: 50, cy: 14, rx: 24, ry: 12, rot: 4, tone: 1 },
    { cx: 50, cy: 90, rx: 20, ry: 11, rot: -6, tone: 2 },
  ];

/** Капли вокруг: r — радиус, ring — толщина обводки, 0 значит залитая. */
const DROPS: { cx: number; cy: number; r: number; ring: number; tone: 0 | 1 | 2 }[] = [
  { cx: 8, cy: 22, r: 2.4, ring: 0, tone: 0 },
  { cx: 12, cy: 60, r: 3.2, ring: 1, tone: 1 },
  { cx: 5, cy: 74, r: 1.6, ring: 0, tone: 2 },
  { cx: 93, cy: 18, r: 2.8, ring: 1, tone: 0 },
  { cx: 96, cy: 52, r: 1.8, ring: 0, tone: 1 },
  { cx: 88, cy: 88, r: 3, ring: 1, tone: 2 },
  { cx: 34, cy: 6, r: 2, ring: 0, tone: 1 },
  { cx: 66, cy: 96, r: 2.6, ring: 1, tone: 0 },
];

export function Watercolor({
  tones = ["#EADFCE", "#DCC7B4", "#C9B296"],
  seed = 0,
  className = "",
}: {
  /** Три тона пятен. По умолчанию песочные — под бежевую гамму сайта. */
  tones?: [string, string, string] | string[];
  /** Меняет рисунок шума, чтобы соседние кадры не выглядели одинаково. */
  seed?: number;
  className?: string;
}) {
  const filterId = `wc-${seed}`;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <defs>
        <filter id={filterId} x="-25%" y="-25%" width="150%" height="150%">
          {/* Шум задаёт рваный край: без него пятно остаётся ровным овалом. */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.022 0.03"
            numOctaves={4}
            seed={seed + 7}
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="26" xChannelSelector="R" yChannelSelector="G" />
          {/* Лёгкое размытие поверх — акварель не даёт резкой кромки. */}
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>

      <g filter={`url(#${filterId})`}>
        {SPLASHES.map((s, i) => (
          <ellipse
            key={i}
            cx={s.cx}
            cy={s.cy}
            rx={s.rx}
            ry={s.ry}
            fill={tones[s.tone] ?? tones[0]}
            opacity={0.55}
            transform={`rotate(${s.rot} ${s.cx} ${s.cy})`}
          />
        ))}
      </g>

      {/* Капли идут поверх фильтра: их края должны остаться чистыми. */}
      {DROPS.map((d, i) =>
        d.ring ? (
          <circle
            key={i}
            cx={d.cx}
            cy={d.cy}
            r={d.r}
            fill="none"
            stroke={tones[d.tone] ?? tones[0]}
            strokeWidth={d.ring}
            opacity={0.75}
          />
        ) : (
          <circle
            key={i}
            cx={d.cx}
            cy={d.cy}
            r={d.r}
            fill={tones[d.tone] ?? tones[0]}
            opacity={0.75}
          />
        ),
      )}
    </svg>
  );
}
