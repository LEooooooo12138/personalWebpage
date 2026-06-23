"use client";

import { useEffect, useState } from "react";
import { Language, messages } from "@/lib/i18n";
import { useLanguage } from "@/components/language-provider";

/**
 * 在页面组件中统一处理 i18n 水合逻辑：
 * - 首次渲染使用 serverLang（避免水合闪烁）
 * - 客户端挂载后切换到 Context 中的语言
 */
export function useHydratedLanguage(serverLang: Language) {
  const { m: ctxM, lang: ctxLang } = useLanguage();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return {
    mounted,
    lang: mounted ? ctxLang : serverLang,
    m: mounted ? ctxM : messages[serverLang],
  };
}
