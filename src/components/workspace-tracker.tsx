"use client";

import { useEffect } from "react";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useLastWorkspace } from "@/hooks/use-last-workspace";

export const WorkspaceTracker = () => {
  const workspaceId = useWorkspaceId();
  const { setLastWorkspace } = useLastWorkspace();

  useEffect(() => {
    if (workspaceId) {
      console.log("🔄 WorkspaceTracker: saving workspace", workspaceId);
      setLastWorkspace(workspaceId);
    } else {
      console.log("⚠️ WorkspaceTracker: no workspaceId found");
    }
  }, [workspaceId, setLastWorkspace]);

  return null; // Этот компонент не рендерит ничего
}; 