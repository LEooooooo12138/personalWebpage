import { NextResponse } from "next/server";
import { getPageVisitCount, recordPageVisit } from "@/lib/visit-counter-db";

type VisitPayload = {
  page?: string;
  sessionId?: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = (searchParams.get("page") ?? "home").trim();

  try {
    const count = await getPageVisitCount(page);
    return NextResponse.json({ page, count });
  } catch {
    return NextResponse.json({ error: "Failed to read visit counter." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as VisitPayload;
  const page = (body.page ?? "home").trim();
  const sessionId = (body.sessionId ?? "").trim();

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
  }

  try {
    const result = await recordPageVisit(page, sessionId);
    return NextResponse.json({ page, count: result.count, incremented: result.incremented });
  } catch {
    return NextResponse.json({ error: "Failed to write visit counter." }, { status: 500 });
  }
}

