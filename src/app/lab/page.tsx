import { Language } from "@/lib/i18n";
import { getServerLang } from "@/lib/server-lang";
import { LabPage } from "@/components/pages/lab-page";

export default async function LabRoute() {
  const serverLang: Language = await getServerLang();
  return <LabPage serverLang={serverLang} />;
}
