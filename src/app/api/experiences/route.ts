import { getExperiences } from "@/lib/portfolio-data";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "en";
  try {
    return NextResponse.json(getExperiences(lang));
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch experience data" },
      { status: 500 },
    );
  }
}
