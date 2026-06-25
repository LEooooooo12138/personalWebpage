import { LanguageProvider } from "@/components/language-provider";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { CursorLoader } from "@/components/cursor-loader";
import { ConsoleSuppressor } from "@/components/console-suppressor";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ConsoleSuppressor />
      <div id="cursor" suppressHydrationWarning />
      <div id="cursor-dot" suppressHydrationWarning />
      <section className="aurora" />
      <SiteNav />
      <main>{children}</main>
      <SiteFooter />
      <CursorLoader />
    </LanguageProvider>
  );
}
