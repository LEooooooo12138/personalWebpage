import { validateSession } from "@/lib/admin-auth";
import { deleteGuestbookNote } from "@/lib/guestbook-db";
import { NextResponse } from "next/server";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  deleteGuestbookNote(id);
  return NextResponse.json({ ok: true });
}
