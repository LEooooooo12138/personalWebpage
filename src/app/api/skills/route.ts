import { getSkills } from "@/lib/skills-data";
import { NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "en";
  const withUsage = searchParams.get("usage") === "1";

  try {
    if (withUsage && !isProd) {
      // usage data needs DB join (project_skills, experience_skills)
      const { getSkillsWithUsage } = await import("@/lib/skills-db");
      return NextResponse.json(getSkillsWithUsage(lang), {
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
      });
    }
    return NextResponse.json(getSkills(lang), {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (err) {
    // console.error("Failed to fetch skills:", err);
    return NextResponse.json(
      { error: "Failed to fetch skills data" },
      { status: 500 }
    );
  }
}
