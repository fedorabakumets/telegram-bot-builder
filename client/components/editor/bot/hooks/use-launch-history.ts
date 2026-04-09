/**
 * @fileoverview Хук для получения истории запусков бота
 * @module bot/hooks/use-launch-history
 */

import { useQuery } from "@tanstack/react-query";
import type { BotLaunchHistory } from "@shared/schema";

/**
 * Загружает историю запусков бота по ID токена
 * @param tokenId - ID токена бота (undefined — запрос не выполняется)
 * @returns Объект с историей запусков и флагом загрузки
 */
export function useLaunchHistory(tokenId: number | undefined) {
  const { data, isLoading } = useQuery<BotLaunchHistory[]>({
    queryKey: ["launch-history", tokenId],
    queryFn: async () => {
      const res = await fetch(`/api/tokens/${tokenId}/launch-history`);
      if (!res.ok) throw new Error("Ошибка загрузки истории запусков");
      return res.json();
    },
    enabled: tokenId !== undefined,
    staleTime: 30000,
  });

  return {
    /** Список записей истории запусков */
    history: data ?? [],
    /** Флаг загрузки данных */
    isLoading,
  };
}
