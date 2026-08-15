/**
 * Мягкие пятна на заднем плане — то, что заказчица назвала «кляксами».
 *
 * Рисунок снят с её референса (azalea.qodeinteractive.com/split-slider-showcase):
 * там это не гладкие пятна, а мазки кистью — плотное тело с рваным щетинистым
 * краем и редкие брызги вокруг. Лежат мазки за кадром, фотография в белой рамке
 * стоит поверх, и они выступают из-под неё по бокам. Раньше здесь были ровные
 * овалы: рисовали по описанию, живого референса никто не видел.
 *
 * Цвета остаются наши, песочные: в референсе мазки пыльно-розовые и
 * пыльно-голубые, но заказчица держится бежевой гаммы. Заливки плоские,
 * градиентов нет.
 *
 * Каждый мазок — отдельный SVG со своими пропорциями, поставленный в проценты
 * от секции. Раньше одна картинка растягивалась на всю секцию, и в широких
 * низких шапках каталога мазки сплющивало в колючие перья. Теперь пропорции
 * мазка не зависят от того, какой формы секция.
 */

/** Один ворс кисти: узкая полоса, сходящая на нет к обоим концам. */
const BRISTLE =
  "M0 0c7 46 10 132 6 214-2 46-4 92-6 132-3-40-6-86-8-132-4-82-1-168 8-214z";

/**
 * Мазок — пучок ворсов со сдвигом. Широкие ворсы сходятся в плотное тело,
 * узкие по краям ломают его контур. Одной сплошной фигурой мазок выглядит
 * вырезанным ножницами, одними тонкими ворсами — колючим пером; в референсе
 * есть и то и другое: масса с рваной кромкой.
 * Четвёрка значений — сдвиг поперёк, сдвиг вдоль, растяжение по длине
 * и ширина ворса.
 */
type Bristle = [number, number, number, number];

// Сдвиг вдоль у ворсов разный и заметный: когда они начинаются на одной
// высоте, у мазка получается ровная кромка поперёк — будто отрезали линейкой.
const DENSE: Bristle[] = [
  // тело
  [-6, 8, 0.94, 3.1],
  [10, -30, 1.04, 3.4],
  [26, 26, 0.9, 2.8],
  [40, 54, 0.8, 2.2],
  // кромка
  [-24, 34, 0.72, 0.9],
  [-16, -12, 0.86, 0.6],
  [54, 18, 0.66, 0.8],
  [62, 66, 0.48, 0.5],
];

const SPARSE: Bristle[] = [
  [0, 4, 0.9, 2.9],
  [16, -26, 0.98, 2.6],
  [30, 34, 0.78, 1.8],
  [-16, 46, 0.64, 0.7],
  [46, 12, 0.6, 0.6],
];

/** Брызги у конца мазка: без них край выглядит слишком чистым. */
const FLECKS: [number, number, number][] = [
  [4, 384, 4.5],
  [30, 400, 2.6],
  [-16, 410, 3.2],
  [44, 424, 2],
  [14, 430, 2.4],
];

function BrushStroke({
  fill,
  opacity,
  dense,
  flecks,
}: {
  fill: string;
  opacity: number;
  dense: boolean;
  flecks: boolean;
}) {
  return (
    <svg
      viewBox="0 0 140 448"
      preserveAspectRatio="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <g transform="translate(52 18)" fill={fill} opacity={opacity}>
        {(dense ? DENSE : SPARSE).map(([dx, dy, sy, sx], index) => (
          <path key={index} d={BRISTLE} transform={`translate(${dx} ${dy}) scale(${sx} ${sy})`} />
        ))}
        {flecks
          ? FLECKS.map(([cx, cy, r], index) => (
              <ellipse key={`f${index}`} cx={cx} cy={cy} rx={r} ry={r * 1.6} />
            ))
          : null}
      </g>
    </svg>
  );
}

/**
 * Кладка мазков. Размер задаётся высотой в процентах от секции, ширина
 * добирается пропорцией — мазок не сплющивается ни в какой форме секции.
 */
type Placement = {
  fill: string;
  opacity: number;
  dense: boolean;
  flecks: boolean;
  /** Положение и разворот; высота в % от высоты секции. */
  style: React.CSSProperties;
};

const SAND = "#EADFCE";
const CLAY = "#C9B296";

/**
 * Высота в процентах от секции даёт верный размер на высоких экранах, но в
 * низких шапках каталога мазок съёживался в мелкую чёрточку. Нижний предел
 * в пикселях держит его крупным, а лишнее уходит за край секции — ровно так
 * мазки и обрезаны в референсе.
 */
const COMPOSITION: Placement[] = [
  // Главное пятно: длинный мазок у правого края, сверху вниз.
  {
    fill: SAND,
    opacity: 0.85,
    dense: true,
    flecks: true,
    style: { top: "4%", right: "7%", height: "max(84%, 420px)", rotate: "6deg" },
  },
  // Слева внизу, почти поперёк — уравновешивает правый.
  {
    fill: SAND,
    opacity: 0.55,
    dense: false,
    flecks: false,
    style: { bottom: "-8%", left: "2%", height: "max(60%, 300px)", rotate: "-64deg" },
  },
  // Два коротких по диагонали, глина — почти на пределе видимости.
  // Держатся у краёв: в середине секции они спорили бы с заголовком.
  {
    fill: CLAY,
    opacity: 0.22,
    dense: false,
    flecks: true,
    style: { top: "2%", left: "7%", height: "max(38%, 220px)", rotate: "28deg" },
  },
  {
    fill: CLAY,
    opacity: 0.16,
    dense: false,
    flecks: false,
    style: { bottom: "4%", right: "31%", height: "max(34%, 200px)", rotate: "-16deg" },
  },
];

export function Blots({
  variant = 0,
  className = "",
}: {
  variant?: number;
  className?: string;
}) {
  // Вариант отражает кладку по горизонтали и вертикали, чтобы одна и та же
  // композиция не повторялась от секции к секции узнаваемым узором.
  // Отражение пропорций не меняет, поэтому мазки остаются мазками.
  const flipX = variant % 2 === 1;
  const flipY = variant % 4 >= 2;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})` }}
    >
      {COMPOSITION.map((blot, index) => (
        <div
          key={index}
          className="absolute"
          style={{ ...blot.style, aspectRatio: "140 / 448" }}
        >
          <BrushStroke
            fill={blot.fill}
            opacity={blot.opacity}
            dense={blot.dense}
            flecks={blot.flecks}
          />
        </div>
      ))}
    </div>
  );
}
