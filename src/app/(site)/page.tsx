import { Language } from "@/lib/i18n";
import { getServerLang } from "@/lib/server-lang";
import { HomePage } from "@/components/pages/home-page";

export default async function Home() {
  const serverLang: Language = await getServerLang();
  return <HomePage serverLang={serverLang} />;
}
