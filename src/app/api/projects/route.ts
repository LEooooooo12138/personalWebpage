import * as staticData from "@/lib/data-static";
import { NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "en";
  try {
    if (isProd) {
      return NextResponse.json(staticData.getProjectsWithSkills(lang));
    }
    const { getProjectsWithSkills } = await import("@/lib/projects-db");
    return NextResponse.json(getProjectsWithSkills(lang));
  } catch (err) {
    console.error("Failed to fetch projects:", err);
    return NextResponse.json(
      { error: "Failed to fetch projects data" },
      { status: 500 },
    );
  }
}
