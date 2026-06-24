import { incrementClaps } from "@/lib/claps-blob";
import * as staticData from "@/lib/data-static";
import { NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";

async function getProjectData(id: string) {
  if (isProd) return staticData.getProject(id);
  const { getProject } = await import("@/lib/projects-db");
  return getProject(id);
}

type ClapPayload = {
  amount?: number;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const project = await getProjectData(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as ClapPayload;
  const amount = Math.max(1, Math.min(20, Number(body.amount ?? 1)));

  let claps = 0;
  for (let i = 0; i < amount; i++) {
    claps = await incrementClaps(id);
  }

  return NextResponse.json({ id, claps });
}
