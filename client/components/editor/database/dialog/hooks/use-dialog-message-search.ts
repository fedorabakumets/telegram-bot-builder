/** @fileoverview Поиск совпадений во всей сохранённой переписке с курсорной навигацией. */
import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { MessagePeriod } from '@shared/message-period';

/** Страница совпадений, возвращаемая поиском сообщений. */
interface SearchPage {
  /** Идентификаторы найденных сообщений. */
  messages: Array<{ /** Внутренний идентификатор сообщения. */ id: number }>;
  /** Курсор к более старым совпадениям. */
  next_cursor: string | null;
}

/**
 * Ищет сообщение выбранного чата и загружает дальнейшие совпадения по запросу.
 * @param projectId - Проект
 * @param tokenId - Бот выбранного диалога
 * @param chatId - Идентификатор собеседника или группы
 * @param chatType - Тип выбранного чата
 * @param query - Текст, с которым выбран собеседник из списка
 * @param period - Даты и время самих сообщений
 * @param allBots - Искать личную переписку человека со всеми ботами проекта
 * @returns Совпадение, состояние поиска и действия навигации
 */
export function useDialogMessageSearch(projectId: number, tokenId: number | null | undefined,
  chatId: string, chatType: string, query = '', period: MessagePeriod = {}, allBots = false) {
  const term = query.trim().slice(0, 200);
  /** Общая история доступна только личным чатам и не зависит от бота для ответа. */
  const unified = allBots && chatType === 'private';
  const scope = JSON.stringify([projectId, unified ? 'all' : tokenId, chatId, chatType, term, period.messageFrom, period.messageTo]);
  const [selection, setSelection] = useState({ scope, index: 0, dismissed: false });
  const current = selection.scope === scope ? selection : { scope, index: 0, dismissed: false };
  const visible = Boolean((term || period.messageFrom || period.messageTo) && (unified || tokenId) && chatId && !current.dismissed);
  const result = useInfiniteQuery({
    queryKey: ['dialog-message-search', scope], enabled: visible,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }): Promise<SearchPage> => {
      const params = new URLSearchParams({ chatId, chatType, query: term, limit: '30' });
      if (unified) params.set('allBots', 'true');
      else params.set('tokenId', String(tokenId));
      if (pageParam) params.set('cursor', pageParam);
      if (period.messageFrom) params.set('messageFrom', period.messageFrom);
      if (period.messageTo) params.set('messageTo', period.messageTo);
      const response = await fetch(`/api/projects/${projectId}/dialogs/messages/search?${params}`, { credentials: 'include', signal });
      if (!response.ok) throw new Error('Не удалось найти сообщения');
      return response.json();
    },
    getNextPageParam: page => page.next_cursor ?? undefined,
  });
  const hits = result.data?.pages.flatMap(page => page.messages) ?? [];
  const index = Math.min(current.index, Math.max(0, hits.length - 1));
  /** Показывает следующее, более старое совпадение, подгружая страницу при необходимости. */
  const next = async () => {
    if (result.isFetching) return;
    if (index + 1 < hits.length) setSelection({ ...current, index: index + 1 });
    else if (result.hasNextPage) {
      const loaded = await result.fetchNextPage();
      if (!loaded.isError && (loaded.data?.pages.flatMap(page => page.messages).length ?? 0) > hits.length) {
        setSelection({ ...current, index: index + 1 });
      }
    }
  };
  return { visible, term, period, index, count: hits.length, hasMore: result.hasNextPage,
    targetId: visible ? hits[index]?.id ?? null : null, loading: result.isLoading || result.isFetchingNextPage,
    failed: result.isError, retry: () => void result.refetch(), next,
    previous: () => setSelection({ ...current, index: Math.max(0, index - 1) }),
    close: () => setSelection({ ...current, dismissed: true }) };
}
