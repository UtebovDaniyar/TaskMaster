import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";
import { getWorkspaces } from "@/features/workspaces/queries";
import { HomeRedirect } from "./home-redirect";

export default async function Home() {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  const workspaces = await getWorkspaces();
  
  // Возвращаем клиентский компонент для обработки редиректа
  return <HomeRedirect workspaces={workspaces.documents} />;
}
