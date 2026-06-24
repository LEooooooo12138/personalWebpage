import { Language } from "@/lib/i18n";
import { getServerLang } from "@/lib/server-lang";
import { getSkills } from "@/lib/skills-db";
import { SkillsPage } from "@/components/pages/skills-page";

export default async function SkillsRoute() {
  const serverLang: Language = await getServerLang();
  const skillsData = getSkills(serverLang);
  return <SkillsPage serverLang={serverLang} skillsData={skillsData} />;
}
