"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLastWorkspace } from "@/hooks/use-last-workspace";

interface HomeRedirectProps {
  workspaces: Array<{ id: string; name: string }>;
}

export const HomeRedirect = ({ workspaces }: HomeRedirectProps) => {
  const router = useRouter();
  const { lastWorkspaceId, isLoaded } = useLastWorkspace();

  useEffect(() => {
    if (!isLoaded) return; // Ждем загрузки данных из localStorage

    if (workspaces.length === 0) {
      router.replace("/workspaces/create");
      return;
    }

    // Проверяем, существует ли сохраненный workspace в списке доступных
    const lastWorkspaceExists = lastWorkspaceId && 
      workspaces.some(workspace => workspace.id === lastWorkspaceId);

    if (lastWorkspaceExists) {
      router.replace(`/workspaces/${lastWorkspaceId}`);
    } else {
      // Если сохраненный workspace не найден, используем первый доступный
      const firstWorkspaceId = workspaces[0].id;
      router.replace(`/workspaces/${firstWorkspaceId}`);
    }
  }, [workspaces, lastWorkspaceId, isLoaded, router]);

  // Показываем loader во время определения куда редиректить
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  );
}; 