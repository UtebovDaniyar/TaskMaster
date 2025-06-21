"use client";

import { useEffect, useState } from "react";

const LAST_WORKSPACE_KEY = "jira-clone-last-workspace";

export const useLastWorkspace = () => {
  const [lastWorkspaceId, setLastWorkspaceId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Загружаем сохраненный workspace при монтировании
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LAST_WORKSPACE_KEY);
      setLastWorkspaceId(saved);
      setIsLoaded(true);
    }
  }, []);

  // Функция для сохранения последнего workspace
  const setLastWorkspace = (workspaceId: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LAST_WORKSPACE_KEY, workspaceId);
      setLastWorkspaceId(workspaceId);
    }
  };

  // Функция для очистки последнего workspace
  const clearLastWorkspace = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(LAST_WORKSPACE_KEY);
      setLastWorkspaceId(null);
    }
  };

  return {
    lastWorkspaceId,
    setLastWorkspace,
    clearLastWorkspace,
    isLoaded,
  };
}; 