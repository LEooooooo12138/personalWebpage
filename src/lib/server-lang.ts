import { Language } from "./i18n";

/** Returns default language. Client-side LanguageProvider handles cookie-based switching. */
export async function getServerLang(): Promise<Language> {
  return "en";
}
