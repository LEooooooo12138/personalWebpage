import { validateSession } from "@/lib/admin-auth";
import { updateProject, deleteProject } from "@/lib/projects-db";
import { NextResponse } from "next/server";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const { zh_title, zh_summary, zh_video_hint, ...projectFields } = body;
  updateProject(id, { ...projectFields, zh_title, zh_summary, zh_video_hint });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  deleteProject(id);
  return NextResponse.json({ ok: true });
}
