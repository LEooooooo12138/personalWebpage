import { validateSession } from "@/lib/admin-auth";
import { updateSkill, deleteSkill } from "@/lib/skills-db";
import { NextResponse } from "next/server";

export async function PUT(request: Request, context: { params: Promise<{ name: string }> }) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await context.params;
  const body = await request.json().catch(() => ({}));
  updateSkill(decodeURIComponent(name), body.name || decodeURIComponent(name), body.categoryId, body.proficiency ?? null);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: { params: Promise<{ name: string }> }) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await context.params;
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId") || "";
  deleteSkill(decodeURIComponent(name), categoryId);
  return NextResponse.json({ ok: true });
}
