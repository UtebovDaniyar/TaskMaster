"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import { AuthMonitor } from "./auth-monitor";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: (failureCount, error) => {
          // Не повторяем запрос при 401 ошибке (неавторизован)
          if ((error as { status?: number })?.status === 401) return false;
          return failureCount < 3;
        },
      },
      mutations: {
        retry: 1,
      },
    },
  }));

  return (
    <SessionProvider 
      // Обновляем сессию каждые 15 минут
      refetchInterval={15 * 60}
      // Обновляем при фокусе на окне
      refetchOnWindowFocus={true}
    >
      <QueryClientProvider client={queryClient}>
        <AuthMonitor>
          {children}
        </AuthMonitor>
      </QueryClientProvider>
    </SessionProvider>
  );
} 