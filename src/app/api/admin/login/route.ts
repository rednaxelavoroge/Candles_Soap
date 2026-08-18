import { checkAdminAuth, loginAdmin, logoutAdmin } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const isAuth = await checkAdminAuth();
  return NextResponse.json({ authenticated: isAuth });
}

export async function POST(req: Request) {
  try {
    const { password, action } = await req.json();

    if (action === "logout") {
      await logoutAdmin();
      return NextResponse.json({ ok: true });
    }

    if (!password) {
      return NextResponse.json({ error: "Пароль не указан" }, { status: 400 });
    }

    const success = await loginAdmin(password);
    if (!success) {
      return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
