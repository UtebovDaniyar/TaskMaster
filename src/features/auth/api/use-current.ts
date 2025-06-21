import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

export const useCurrent = () => {
  const query = useQuery({
    queryKey: ["current"],
    queryFn: async () => {
      const response = await client.api.user.current.$get();

      if (!response.ok) {
        return null;
      }

      const { data } = await response.json();

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 минут
    retry: (failureCount, error) => {
      // Не повторяем запрос при 401 ошибке (неавторизован)
      if ((error as { status?: number })?.status === 401) return false;
      return failureCount < 3;
    },
  });

  return query;
};
