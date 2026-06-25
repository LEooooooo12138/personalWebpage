import { cookies } from "next/headers";
import { Language } from "@/lib/i18n";
import { LanguageProvider } from "@/components/language-provider";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { CursorScript } from "@/components/cursor-script";
import { ConsoleSuppressor } from "@/components/console-suppressor";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("lang");
  const initialLang: Language = (langCookie?.value === "zh" ? "zh" : "en");

  return (
    <LanguageProvider initialLang={initialLang}>
      <ConsoleSuppressor />
      <div id="cursor" suppressHydrationWarning />
      <div id="cursor-dot" suppressHydrationWarning />
      <section className="aurora" />
      <SiteNav />
      <main>{children}</main>
      <SiteFooter />
      <CursorScript />
    </LanguageProvider>
  );
}
