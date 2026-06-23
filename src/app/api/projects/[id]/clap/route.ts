import { baseProjects } from "@/lib/portfolio-data";
import { getRuntimeStore } from "@/lib/runtime-store";
import { NextResponse } from "next/server";

type ClapPayload = {
  amount?: number;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const project = baseProjects.find((item) => item.id === id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as ClapPayload;
  const amount = Math.max(1, Math.min(20, Number(body.amount ?? 1)));
  const store = getRuntimeStore();
  store.projectClaps[id] = (store.projectClaps[id] ?? 0) + amount;

  return NextResponse.json({
    id,
    claps: store.projectClaps[id],
  });
}
