import { getProjectsWithSkills } from "@/lib/projects-db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "en";
  try {
    const projects = getProjectsWithSkills(lang);
    return NextResponse.json(projects);
  } catch (err) {
    console.error("Failed to fetch projects:", err);
    return NextResponse.json(
      { error: "Failed to fetch projects data" },
      { status: 500 },
    );
  }
}
