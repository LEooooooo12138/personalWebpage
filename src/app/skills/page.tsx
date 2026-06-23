import { Language } from "@/lib/i18n";
import { getServerLang } from "@/lib/server-lang";
import { SkillsPage } from "@/components/pages/skills-page";

export default async function SkillsRoute() {
  const serverLang: Language = await getServerLang();
  return <SkillsPage serverLang={serverLang} />;
}
