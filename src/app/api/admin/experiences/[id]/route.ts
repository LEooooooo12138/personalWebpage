import { validateSession } from "@/lib/admin-auth";
import { updateExperience, deleteExperience } from "@/lib/experiences-db";
import { NextResponse } from "next/server";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const { zh_title, zh_description, zh_note, ...expFields } = body;
  updateExperience(id, { ...expFields, zh_title, zh_description, zh_note });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  deleteExperience(id);
  return NextResponse.json({ ok: true });
}
