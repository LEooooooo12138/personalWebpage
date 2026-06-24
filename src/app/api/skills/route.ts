import { getSkills, getSkillsWithUsage } from "@/lib/skills-db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "en";
  const withUsage = searchParams.get("usage") === "1";

  try {
    const data = withUsage ? getSkillsWithUsage(lang) : getSkills(lang);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("Failed to fetch skills:", err);
    return NextResponse.json(
      { error: "Failed to fetch skills data" },
      { status: 500 }
    );
  }
}
