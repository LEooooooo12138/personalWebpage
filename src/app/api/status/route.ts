import { fallbackLang, Language, messages } from "@/lib/i18n";
import { LiveStatus } from "@/types/portfolio";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang");
  const locale: Language = lang === "zh" ? "zh" : fallbackLang;
  const t = messages[locale].apiStatus;

  const now = new Date();
  const minute = now.getUTCMinutes();
  const hour = now.getHours();

  const availability = hour >= 9 && hour <= 21 ? t.availabilityOpen : t.availabilityLater;
  const responseTemplate = t.responseTemplate.replace("{hours}", `${2 + (minute % 6)}`);

  const status: LiveStatus = {
    availability,
    currentFocus: t.focusItems[minute % t.focusItems.length],
    responseTime: responseTemplate,
    location: t.locationPool[minute % t.locationPool.length],
    timestamp: now.toISOString(),
  };

  return NextResponse.json(status);
}
