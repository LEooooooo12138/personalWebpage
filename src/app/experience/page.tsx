import { Language } from "@/lib/i18n";
import { getServerLang } from "@/lib/server-lang";
import { ExperiencePage } from "@/components/pages/experience-page";

export default async function ExperienceRoute() {
  const serverLang: Language = await getServerLang();
  return <ExperiencePage serverLang={serverLang} />;
}
