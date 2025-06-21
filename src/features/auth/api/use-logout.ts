import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";

export const useLogout = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      // Очищаем все клиентские данные ПЕРЕД вызовом signOut
      if (typeof window !== 'undefined') {
        // Очищаем все хранилища
        localStorage.clear();
        sessionStorage.clear();
        
        // Очищаем кэши React Query
        queryClient.clear();
        queryClient.removeQueries();
        
        // Удаляем все cookies (если есть кастомные)
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos) : c;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
        });
      }
      
      // Выполняем logout через NextAuth
      await signOut({
        redirect: false, // Отключаем автоматический redirect
        callbackUrl: "/sign-in"
      });
      
      // Принудительно перенаправляем после успешного logout
      if (typeof window !== 'undefined') {
        // Небольшая задержка для завершения всех операций
        setTimeout(() => {
          window.location.href = "/sign-in";
        }, 100);
      }
    },
    onSuccess: () => {
      toast.success("You have successfully signed out");
    },
    onError: (error: Error) => {
      console.error("Logout error:", error);
      toast.error("Error signing out");
      
      // В случае ошибки всё равно перенаправляем пользователя
      if (typeof window !== 'undefined') {
        window.location.href = "/sign-in";
      }
    },
  });

  return mutation;
};
