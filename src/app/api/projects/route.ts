import { getProjectsWithSkills } from "@/lib/portfolio-data";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "en";
  try {
    return NextResponse.json(getProjectsWithSkills(lang));
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch projects data" },
      { status: 500 },
    );
  }
}
