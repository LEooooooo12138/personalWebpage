import { getProjectsWithSkills } from "@/lib/projects-db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const projects = getProjectsWithSkills();
    return NextResponse.json(projects);
  } catch (err) {
    console.error("Failed to fetch projects:", err);
    return NextResponse.json(
      { error: "Failed to fetch projects data" },
      { status: 500 },
    );
  }
}
