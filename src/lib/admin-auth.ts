import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Пароль панели живёт только в переменной окружения: на хостинге он задан
// в карточке приложения Node.js, на Vercel — в Environment Variables.
// Запасного значения в коде нет намеренно: репозиторий читают чужие глаза,
// а пароль от панели, лежащий в коде, — это отсутствие пароля.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const SESSION_COOKIE = "anna_admin_session";
/** Сколько панель помнит вход. Заказчица заходит с телефона, каждый день. */
const SESSION_DAYS = 30;

/**
 * Пропуск в панель — подписанный, а не постоянный.
 *
 * Раньше в куке лежала одна и та же строка, записанная тут же в коде, и
 * проверка сводилась к сравнению с ней. Это значило, что пароль можно было
 * обойти вовсе: кто видел эту строку — а видел её всякий, кто открывал
 * репозиторий, — тот ставил себе такую куку и заходил в панель.
 *
 * Теперь в куке лежит срок годности и подпись к нему. Подпись считается от
 * пароля, поэтому подделать её, не зная пароля, нельзя, а смена пароля сама
 * закрывает все прежние входы — отдельной кнопки «выйти везде» не нужно.
 * Ничего нового задавать в настройках хостинга не потребовалось.
 */
function sign(payload: string): string {
  return createHmac("sha256", ADMIN_PASSWORD || "").update(payload).digest("base64url");
}

function makeToken(): string {
  const until = String(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  return `${until}.${sign(until)}`;
}

/**
 * Сравнение, не выдающее ответ временем.
 *
 * Обычное `===` останавливается на первом несовпавшем знаке, и по тому,
 * насколько быстро пришёл отказ, подпись можно подобрать по одному знаку.
 * Разница исчезающе мала, но считать её незаметной — как раз то, на чём
 * такие проверки и ломают.
 */
function sameString(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function validToken(token: string | undefined): boolean {
  if (!token || !ADMIN_PASSWORD) return false;

  const split = token.lastIndexOf(".");
  if (split <= 0) return false;

  const until = token.slice(0, split);
  if (!sameString(token.slice(split + 1), sign(until))) return false;

  // Подпись сошлась — значит сроку можно верить, его тоже подписывали.
  const expires = Number(until);
  return Number.isFinite(expires) && expires > Date.now();
}

export async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  return validToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function loginAdmin(password: string): Promise<boolean> {
  if (!ADMIN_PASSWORD) {
    // Лучше не пустить никого, чем пустить всех. В логах хостинга будет видно,
    // почему вход перестал работать, — переменную забыли задать.
    console.error("ADMIN_PASSWORD не задан — вход в панель закрыт.");
    return false;
  }

  if (!sameString(password, ADMIN_PASSWORD)) return false;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, makeToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });
  return true;
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
