import { validateSession } from "@/lib/admin-auth";
import { getVisitStats } from "@/lib/visit-counter-db";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ data: getVisitStats() });
}
