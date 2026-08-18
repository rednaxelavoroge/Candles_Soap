import { checkAdminAuth } from "@/lib/admin-auth";
import { saveJsonData } from "@/lib/data-storage";
import { getSite } from "@/lib/content";
import { NextResponse } from "next/server";

export async function GET() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ site: getSite() });
}

export async function POST(req: Request) {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const current = getSite();
    const updated = {
      ...current,
      ...body,
      contacts: {
        ...current.contacts,
        ...(body.contacts || {}),
      },
    };

    await saveJsonData("src/data/site.json", updated);
    return NextResponse.json({ ok: true, site: updated });
  } catch {
    return NextResponse.json({ error: "Ошибка сохранения настроек" }, { status: 500 });
  }
}
