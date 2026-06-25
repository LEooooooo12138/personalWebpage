import { getProjectsWithSkills } from "@/lib/portfolio-data";
import { getClaps } from "@/lib/claps-blob";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "en";
  try {
    const projects = getProjectsWithSkills(lang);

    // Merge persisted clap counts from Blob / SQLite
    const withClaps = await Promise.all(
      projects.map(async (p) => {
        const claps = await getClaps(p.id);
        return { ...p, claps };
      }),
    );

    return NextResponse.json(withClaps);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch projects data" },
      { status: 500 },
    );
  }
}
