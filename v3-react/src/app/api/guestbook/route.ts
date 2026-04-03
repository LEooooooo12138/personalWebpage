import { getRuntimeStore } from "@/lib/runtime-store";
import { NextResponse } from "next/server";

type GuestbookPayload = {
  author?: string;
  message?: string;
};

export async function GET() {
  const store = getRuntimeStore();
  const notes = [...store.guestNotes].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  return NextResponse.json(notes);
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

  const store = getRuntimeStore();
  const note = {
    id: crypto.randomUUID(),
    author: author || "Anonymous",
    message,
    createdAt: new Date().toISOString(),
  };
  store.guestNotes.push(note);

  return NextResponse.json(note, { status: 201 });
}
