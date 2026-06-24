import { Language } from "@/lib/i18n";
import { getServerLang } from "@/lib/server-lang";
import { ProjectsPage } from "@/components/pages/projects-page";

export default async function ProjectsRoute() {
  const serverLang: Language = await getServerLang();
  return <ProjectsPage serverLang={serverLang} />;
}
