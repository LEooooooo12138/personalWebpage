import { validateSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await validateSession();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user });
}
