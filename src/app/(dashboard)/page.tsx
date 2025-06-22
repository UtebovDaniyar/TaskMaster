"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useLastWorkspace } from "@/hooks/use-last-workspace";
import { PageLoader } from "@/components/page-loader";

export default function Home() {
  const router = useRouter();
  const { status } = useSession();
  const { data: workspaces, isLoading: workspacesLoading } = useGetWorkspaces();
  const { lastWorkspaceId, isLoaded } = useLastWorkspace();

  // Редирект неаутентифицированных пользователей
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in");
    }
  }, [status, router]);

  // Редирект после загрузки данных
  useEffect(() => {
    if (status !== "authenticated" || workspacesLoading || !isLoaded) {
      return;
    }

    if (!workspaces?.documents || workspaces.documents.length === 0) {
      router.replace("/workspaces/create");
      return;
    }

    // Проверяем, существует ли сохраненный workspace в списке доступных
    const lastWorkspaceExists = lastWorkspaceId && 
      workspaces.documents.some(workspace => workspace.id === lastWorkspaceId);

    if (lastWorkspaceExists) {
      router.replace(`/workspaces/${lastWorkspaceId}`);
    } else {
      // Если сохраненный workspace не найден, используем первый доступный
      const firstWorkspaceId = workspaces.documents[0].id;
      router.replace(`/workspaces/${firstWorkspaceId}`);
    }
  }, [workspaces, lastWorkspaceId, isLoaded, router, status, workspacesLoading]);

  // Показываем loader во время определения куда редиректить
  if (status === "loading" || workspacesLoading || !isLoaded) {
    return <PageLoader />;
  }

  return <PageLoader />;
}
