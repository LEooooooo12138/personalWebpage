import type { Metadata } from "next";
import { LanguageProvider } from "@/components/language-provider";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yuanle Yao | Personal Website V3",
  description: "Dynamic full-stack portfolio with Bento UI, realtime interactions, and AI-native UX.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <section className="aurora" />
          <SiteNav />
          <main className="page-wrap">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}
