import { getProfile } from "@/lib/portfolio-data";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json(getProfile());
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
