import { cookies } from "next/headers";
import { Language } from "./i18n";

/** Read the lang cookie on the server. Use in page server components. */
export async function getServerLang(): Promise<Language> {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("lang");
  return langCookie?.value === "zh" ? "zh" : "en";
}
