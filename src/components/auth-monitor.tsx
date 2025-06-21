"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

export const AuthMonitor = ({ children }: { children: React.ReactNode }) => {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // Публичные страницы, которые не требуют аутентификации
  const publicPaths = ["/sign-in", "/sign-up", "/error"];
  const isPublicPage = publicPaths.some(path => pathname.startsWith(path));

  useEffect(() => {
    // Только для защищённых страниц: если пользователь не аутентифицирован, очищаем кэш и перенаправляем
    if (status === "unauthenticated" && !isPublicPage) {
      // Очищаем все кэши
      queryClient.clear();
      queryClient.removeQueries();
      
      // Очищаем локальные хранилища
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      // Перенаправляем на страницу входа
      router.push('/sign-in');
    }
  }, [status, router, queryClient, isPublicPage]);

  // Для публичных страниц всегда показываем контент
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Для защищённых страниц: показываем содержимое только если пользователь аутентифицирован или идёт загрузка
  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}; 