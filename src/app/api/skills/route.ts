import * as staticData from "@/lib/data-static";
import { NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "en";
  const withUsage = searchParams.get("usage") === "1";

  try {
    if (isProd) {
      return NextResponse.json(staticData.getSkills(lang), {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      });
    }
    const { getSkills, getSkillsWithUsage } = await import("@/lib/skills-db");
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
