import { insertGuestbookNote, listGuestbookNotes } from "@/lib/guestbook-db";
import { NextResponse } from "next/server";

type GuestbookPayload = {
  author?: string;
  message?: string;
};

export async function GET() {
  try {
    const notes = listGuestbookNotes();
    return NextResponse.json(notes);
  } catch {
    return NextResponse.json(
      { error: "Failed to load guestbook notes." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as GuestbookPayload;
  const author = (body.author ?? "Anonymous").trim().slice(0, 24);
  const message = (body.message ?? "").trim().slice(0, 160);

  if (!message) {
    return NextResponse.json(
      { error: "Message must not be empty." },
      { status: 400 },
    );
  }

  const note = {
    id: crypto.randomUUID(),
    author: author || "Anonymous",
    message,
    createdAt: new Date().toISOString(),
  };
  try {
    insertGuestbookNote(note);
    return NextResponse.json(note, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to save guestbook note." },
      { status: 500 },
    );
  }
}
