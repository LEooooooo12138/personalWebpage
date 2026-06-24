import { validateSession } from "@/lib/admin-auth";
import { getProfile, updateProfile } from "@/lib/profile-db";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ data: getProfile() });
}

export async function PUT(request: Request) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  updateProfile(body);
  return NextResponse.json({ data: getProfile() });
}
