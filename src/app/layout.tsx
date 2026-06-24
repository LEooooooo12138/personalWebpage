import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yuanle Yao | Personal Website",
  description: "Typography-driven portfolio with serif headings, golden accents, and thoughtful interactions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&family=Noto+Serif+SC:wght@400;600;700;900&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">
        {children}
      </body>
    </html>
  );
}
