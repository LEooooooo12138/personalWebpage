import { validateSession } from "@/lib/admin-auth";
import { getLanguages, updateLanguages } from "@/lib/skills-db";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ data: getLanguages() });
}

export async function PUT(request: Request) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  updateLanguages(body);
  return NextResponse.json({ ok: true });
}
