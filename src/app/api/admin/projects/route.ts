import { validateSession } from "@/lib/admin-auth";
import { listProjectsAdmin, createProject } from "@/lib/projects-db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(50, Math.max(10, parseInt(searchParams.get("pageSize") || "20")));

  return NextResponse.json(listProjectsAdmin(page, pageSize));
}

export async function POST(request: Request) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  createProject(body);
  return NextResponse.json({ ok: true }, { status: 201 });
}
