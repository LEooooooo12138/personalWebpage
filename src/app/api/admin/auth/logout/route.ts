import { clearSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
