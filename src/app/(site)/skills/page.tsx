import { Language } from "@/lib/i18n";
import { getServerLang } from "@/lib/server-lang";
import * as staticData from "@/lib/data-static";
import { SkillsPage } from "@/components/pages/skills-page";

const isProd = process.env.NODE_ENV === "production";

export default async function SkillsRoute() {
  const serverLang: Language = await getServerLang();
  if (isProd) {
    return <SkillsPage serverLang={serverLang} skillsData={staticData.getSkills(serverLang)} />;
  }
  const { getSkills } = await import("@/lib/skills-db");
  return <SkillsPage serverLang={serverLang} skillsData={getSkills(serverLang)} />;
}
