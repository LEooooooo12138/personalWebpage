import { validateSession } from "@/lib/admin-auth";
import { updateCategory, deleteCategory } from "@/lib/skills-db";
import { NextResponse } from "next/server";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  updateCategory(id, body.color, body.sortOrder ?? 0, body.enTitle, body.zhTitle, body.enDesc || "", body.zhDesc || "");
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  deleteCategory(id);
  return NextResponse.json({ ok: true });
}
