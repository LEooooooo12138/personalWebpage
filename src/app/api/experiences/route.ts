import * as staticData from "@/lib/data-static";
import { narrativeEn, narrativeZh } from "@/lib/experience-narrative";
import { NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = (searchParams.get("lang") || "en") as "en" | "zh";

  try {
    let experiences: { id: string; year: string; title: string; description: string; note?: string }[];
    if (isProd) {
      experiences = staticData.getExperiences(lang);
    } else {
      const { getExperiencesWithNarratives } = await import("@/lib/experiences-db");
      experiences = getExperiencesWithNarratives(lang);
    }

    const narratives = lang === "zh" ? narrativeZh : narrativeEn;
    const narMap = new Map(narratives.map((n) => [n.year, n]));

    const result = experiences.map((exp) => {
      const nar = narMap.get(exp.year);
      return {
        ...exp,
        narrative: nar || null,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    // console.error("Failed to fetch experiences:", err);
    return NextResponse.json(
      { error: "Failed to fetch experiences data" },
      { status: 500 }
    );
  }
}
