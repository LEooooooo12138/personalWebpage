import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const lang = request.cookies.get("lang")?.value;
  const response = NextResponse.next();

  // Pass lang via header for potential server use
  if (lang === "zh") {
    response.headers.set("x-lang", "zh");
  }

  return response;
}

export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.ico).*)",
};
