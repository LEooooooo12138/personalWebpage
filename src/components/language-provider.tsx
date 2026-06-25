"use client";

import { fallbackLang, Language, messages } from "@/lib/i18n";
import {
  createContext,
  ReactNode,
  useContext,
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

export function LanguageProvider({
  children,
  initialLang = fallbackLang,
}: {
  children: ReactNode;
  initialLang?: Language;
}) {
  const [lang, setLangState] = useState<Language>(initialLang);

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
