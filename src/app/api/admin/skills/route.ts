import { validateSession } from "@/lib/admin-auth";
import { addSkill } from "@/lib/skills-db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  addSkill(body.categoryId, body.name, body.proficiency);
  return NextResponse.json({ ok: true }, { status: 201 });
}
