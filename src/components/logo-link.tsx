"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLastWorkspace } from "@/hooks/use-last-workspace";

export const LogoLink = () => {
  const router = useRouter();
  const { lastWorkspaceId } = useLastWorkspace();

  const handleClick = () => {
    // Временная отладочная информация
    console.log("🏠 LogoLink clicked");
    console.log("📦 LastWorkspaceId from localStorage:", lastWorkspaceId);
    console.log("🔍 All localStorage items:", Object.keys(localStorage).filter(key => key.includes('jira')));
    
    // Если есть сохраненный workspace, переходим к нему, иначе на главную
    if (lastWorkspaceId) {
      console.log("✅ Redirecting to workspace:", lastWorkspaceId);
      router.push(`/workspaces/${lastWorkspaceId}`);
    } else {
      console.log("❌ No workspace found, redirecting to home");
      router.push("/");
    }
  };

  return (
    <div onClick={handleClick} className="cursor-pointer">
      <Image src="/logo.svg" alt="logo" width={164} height={48} />
    </div>
  );
}; 