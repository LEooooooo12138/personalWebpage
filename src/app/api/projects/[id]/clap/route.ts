import { getProject, incrementClaps } from "@/lib/projects-db";
import { NextResponse } from "next/server";

type ClapPayload = {
  amount?: number;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const project = getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as ClapPayload;
  const amount = Math.max(1, Math.min(20, Number(body.amount ?? 1)));

  let claps = project.claps;
  for (let i = 0; i < amount; i++) {
    claps = incrementClaps(id);
  }

  return NextResponse.json({ id, claps });
}
