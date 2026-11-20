/** @fileoverview Постраничная история запусков выбранного бота для терминала. */
import { useInfiniteQuery } from '@tanstack/react-query';
import type { BotLaunchHistory } from '@shared/schema';

/** Запись истории в формате ответа сервера. */
type TerminalLaunchRecord = Pick<BotLaunchHistory, 'id' | 'projectId' | 'tokenId' | 'status'> & {
  /** Время запуска в формате ISO или отсутствие даты в старой записи. */
  startedAt: string | null;
};

/** Число записей, добавляемых за один запрос. */
const PAGE_SIZE = 30;

/**
 * Загружает запуски только выбранного бота через существующий API истории.
 * @param tokenId - Идентификатор бота или отсутствие выбранного бота
 * @returns Записи, состояния запроса и управление пагинацией
 */
export function useTerminalLaunchHistory(tokenId: number | null | undefined) {
  const query = useInfiniteQuery({
    queryKey: ['launch-history', tokenId, 'terminal'],
    enabled: tokenId != null,
    initialPageParam: null as number | null,
    queryFn: async ({ pageParam, signal }) => {
      if (tokenId == null) throw new Error('Бот не выбран');
      /** Дополнительная запись показывает, доступна ли следующая страница. */
      const params = new URLSearchParams({ limit: String(PAGE_SIZE + 1) });
      if (pageParam !== null) params.set('beforeId', String(pageParam));
      const response = await fetch(`/api/tokens/${tokenId}/launch-history?${params}`, { signal });
      if (!response.ok) throw new Error('Не удалось загрузить историю запусков');
      const records: TerminalLaunchRecord[] = await response.json();
      const history = records.slice(0, PAGE_SIZE);
      return {
        history,
        nextId: records.length > PAGE_SIZE ? history.at(-1)?.id : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextId,
  });

  return {
    history: query.data?.pages.flatMap((page) => page.history) ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}
