import { validateSession } from "@/lib/admin-auth";
import { getCategories, createCategory } from "@/lib/skills-db";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ data: getCategories() });
}

export async function POST(request: Request) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  createCategory(body.id, body.enTitle, body.zhTitle, body.enDesc || "", body.zhDesc || "");
  return NextResponse.json({ ok: true }, { status: 201 });
}
