import { cookies } from "next/headers";

// Пароль панели живёт только в переменной окружения: на хостинге он задан
// в карточке приложения Node.js, на Vercel — в Environment Variables.
// Запасного значения в коде нет намеренно: репозиторий читают чужие глаза,
// а пароль от панели, лежащий в коде, — это отсутствие пароля.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_COOKIE = "anna_admin_session";
const SESSION_SECRET = "anna_atelier_secret_token_2026";

export async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  return session?.value === SESSION_SECRET;
}

export async function loginAdmin(password: string): Promise<boolean> {
  if (!ADMIN_PASSWORD) {
    // Лучше не пустить никого, чем пустить всех. В логах хостинга будет видно,
    // почему вход перестал работать, — переменную забыли задать.
    console.error("ADMIN_PASSWORD не задан — вход в панель закрыт.");
    return false;
  }

  if (password === ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, SESSION_SECRET, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 дней
      path: "/",
    });
    return true;
  }
  return false;
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
