import fs from "fs";
import path from "path";

/**
 * Запись фотографии прямо в папку сайта — мимо репозитория.
 *
 * Панель стоит на том же хостинге, что и сайт, и её папка `admin-panel`
 * лежит ВНУТРИ папки домена, рядом с `catalog`. Значит фотографию можно
 * положить туда, куда её всё равно повезли бы окольным путём: коммит в
 * репозиторий → выкладка → FTP → та же самая папка. Пять минут ожидания и
 * одна выкладка превращаются в запись файла.
 *
 * Что это даёт:
 * - загрузка фотографии не стоит ни одного коммита и ни одной выкладки;
 * - кадр виден на сайте сразу, а не через несколько минут;
 * - репозиторий перестаёт расти (сейчас в нём 240 МБ каталога).
 *
 * Чего это стоит: новые фотографии не версионируются в git. Копию делает
 * `.github/workflows/backup-catalog.yml` — раз в неделю снимает весь каталог
 * с хостинга в приложения к служебному выпуску.
 *
 * Выкладка сайта заливает файлы БЕЗ `--delete` (в папке домена стоит чужой
 * WordPress, удалять там нельзя), поэтому записанные сюда кадры переживают
 * любую последующую выкладку. **Если когда-нибудь появится соблазн добавить
 * `--delete` — сначала прочитать это место: он снесёт все фотографии,
 * загруженные после 03.09.2026.**
 *
 * Когда папку сайта найти не удалось — в разработке, на Vercel, при любой
 * непонятной раскладке — всё работает по-старому, через коммит.
 */

/** Сколько держим найденный (или не найденный) ответ, мс. */
const CACHE_TTL = 60 * 1000;

/*
  Ответ помним вместе с тем, из чего он получен: и SITE_PUBLIC_DIR, и рабочая
  папка читаются на каждом обращении, а не один раз при загрузке модуля. Так
  переменную можно задать хостингу после старта, и так же её подменяет проверка.
*/
let cached: { key: string; dir: string | null; at: number } | null = null;

function cacheKey(): string {
  return `${process.env.SITE_PUBLIC_DIR ?? ""}\u0000${process.cwd()}`;
}

/**
 * Похоже ли на корень сайта.
 *
 * Проверка нужна не для красоты: без неё «папка выше» в разработке — это
 * чужая папка на машине разработчика, и панель писала бы кадры туда.
 */
function looksLikeSiteRoot(dir: string): boolean {
  return (
    fs.existsSync(path.join(dir, "index.html")) &&
    fs.statSync(path.join(dir, "catalog"), { throwIfNoEntry: false })?.isDirectory() === true
  );
}

function writable(dir: string): boolean {
  try {
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function detect(explicit: string | undefined): string | null {
  if (explicit) {
    const dir = path.resolve(explicit);
    return fs.existsSync(dir) && writable(dir) ? dir : null;
  }
  // Панель запускается из своей папки, а сайт лежит уровнем выше.
  const parent = path.resolve(process.cwd(), "..");
  if (looksLikeSiteRoot(parent) && writable(parent)) return parent;
  return null;
}

/** Папка сайта на хостинге или `null`, если панель стоит не рядом с ним. */
export function siteRoot(): string | null {
  const key = cacheKey();
  if (cached && cached.key === key && Date.now() - cached.at < CACHE_TTL) return cached.dir;
  let dir: string | null = null;
  try {
    dir = detect(process.env.SITE_PUBLIC_DIR || undefined);
  } catch (err) {
    console.error("Не удалось определить папку сайта:", err);
  }
  cached = { key, dir, at: Date.now() };
  return dir;
}

/**
 * Кладёт файл в папку сайта. Возвращает `false`, если сайта рядом нет или
 * запись не удалась — тогда вызывающая сторона везёт файл через репозиторий.
 */
export function writeToSite(publicRelativePath: string, buffer: Buffer): boolean {
  const root = siteRoot();
  if (!root) return false;

  const target = insideSite(root, publicRelativePath);
  if (!target) return false;

  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, buffer);
    return true;
  } catch (err) {
    console.error("Не удалось записать файл в папку сайта:", target, err);
    // Папка могла пропасть или потерять права — пусть следующий вызов поищет заново.
    cached = null;
    return false;
  }
}

/**
 * Убирает файл из папки сайта. Возвращает `true`, если после этого его там нет.
 *
 * Без этого удаление ролика было бы неполным: выкладка сайта идёт **без**
 * `--delete` (в папке домена лежит чужой WordPress), поэтому файл, убранный
 * из репозитория, остался бы на хостинге и продолжал открываться по прямой
 * ссылке. Панель стоит рядом с сайтом — значит убрать может сама и сразу.
 */
export function deleteFromSite(publicRelativePath: string): boolean {
  const root = siteRoot();
  if (!root) return false;

  const target = insideSite(root, publicRelativePath);
  if (!target) return false;

  try {
    fs.rmSync(target, { force: true });
    return true;
  } catch (err) {
    console.error("Не удалось убрать файл из папки сайта:", target, err);
    cached = null;
    return false;
  }
}

/** Путь внутри папки сайта или `null`, если он ведёт наружу. */
function insideSite(root: string, publicRelativePath: string): string | null {
  const target = path.resolve(root, publicRelativePath.replace(/^\/+/, ""));
  // Имя файла складывается из данных формы, поэтому за пределы папки сайта
  // не выпускаем — даже если в названии изделия окажется «../».
  if (target !== root && !target.startsWith(root + path.sep)) {
    console.error("Путь ведёт за пределы папки сайта, файл не тронут:", publicRelativePath);
    return null;
  }
  return target;
}
