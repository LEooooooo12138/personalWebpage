"use client";

import { fallbackLang, Language, messages } from "@/lib/i18n";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type LanguageContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  m: (typeof messages)[Language];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function setLangCookie(lang: Language) {
  document.cookie = `lang=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

function readLangCookie(): Language {
  if (typeof document === "undefined") return fallbackLang;
  const match = document.cookie.match(/(?:^|;\s*)lang=([^;]*)/);
  return match?.[1] === "zh" ? "zh" : "en";
}

export function LanguageProvider({
  children,
  initialLang = fallbackLang,
}: {
  children: ReactNode;
  initialLang?: Language;
}) {
  const [lang, setLangState] = useState<Language>(initialLang);

  // Sync with cookie on mount — server always sends "en", client corrects
  useEffect(() => {
    const cookieLang = readLangCookie();
    if (cookieLang !== lang) {
      setLangState(cookieLang);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    setLangCookie(newLang);
    document.documentElement.lang = newLang;
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      toggleLang: () => setLang(lang === "en" ? "zh" : "en"),
      m: messages[lang],
    }),
    [lang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
