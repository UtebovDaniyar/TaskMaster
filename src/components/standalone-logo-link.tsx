"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLastWorkspace } from "@/hooks/use-last-workspace";

export const StandaloneLogoLink = () => {
  const router = useRouter();
  const { lastWorkspaceId } = useLastWorkspace();

  const handleClick = () => {
    // Если есть сохраненный workspace, переходим к нему, иначе на главную
    if (lastWorkspaceId) {
      router.push(`/workspaces/${lastWorkspaceId}`);
    } else {
      router.push("/");
    }
  };

  return (
    <div onClick={handleClick} className="cursor-pointer">
      <Image src="/logo.svg" alt="Logo" height={56} width={152} />
    </div>
  );
}; 