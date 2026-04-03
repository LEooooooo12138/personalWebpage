import { baseProjects } from "@/lib/portfolio-data";
import { getRuntimeStore } from "@/lib/runtime-store";
import { Project } from "@/types/portfolio";
import { NextResponse } from "next/server";

export async function GET() {
  const store = getRuntimeStore();
  const projects: Project[] = baseProjects.map((project) => ({
    ...project,
    claps: store.projectClaps[project.id] ?? 0,
  }));

  return NextResponse.json(projects);
}
