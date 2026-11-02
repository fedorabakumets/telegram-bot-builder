/** @fileoverview Обновление сообщений и уникальных собеседников через общий сокет с восстановлением пропущенных изменений. */
import type { QueryClient } from '@tanstack/react-query';

/** Данные события, необходимые для выбора области обновления. */
interface ActivityEvent {
  /** Название события. */
  type: string;
  /** Проект события. */
  projectId: number;
  /** Бот события, если известен. */
  tokenId?: number;
}

/**
 * Выбирает все периоды сообщений и пользователей только в текущей области.
 * @param key - Ключ запроса.
 * @param projectId - Открытый проект.
 * @param tokenId - Выбранный бот или весь проект.
 * @returns Принадлежность запроса текущей области.
 */
export function isMessageActivityQuery(key: readonly unknown[], projectId: number, tokenId?: number | null): boolean {
  return (key[0] === 'messages-activity' || key[0] === 'users-activity' || key[0] === 'activity-leaders')
    && key[1] === projectId && (key[2] ?? null) === (tokenId ?? null);
}

/**
 * Объединяет всплески событий, повторяет запрос после восстановления связи и очищает подписки.
 * @param client - Клиент кэша.
 * @param projectId - Открытый проект.
 * @param tokenId - Выбранный бот.
 * @param subscribe - Подписка на события общего сокета.
 * @param onReconnect - Подписка на восстановление связи.
 * @returns Полная очистка подписок и отложенного обновления.
 */
export function subscribeMessageActivity(
  client: QueryClient, projectId: number, tokenId: number | null | undefined,
  subscribe: (listener: (event: ActivityEvent) => void) => () => void,
  onReconnect: (listener: () => void) => () => void,
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  /** Запрашивает серверные итоги, не прибавляя события повторно к счётчикам. */
  const refresh = () => {
    if (disposed) return;
    if (timer) clearTimeout(timer);
    timer = undefined;
    void client.invalidateQueries({ predicate: query => isMessageActivityQuery(query.queryKey, projectId, tokenId) });
  };
  const unsubscribe = subscribe(event => {
    if (event.projectId !== projectId || (tokenId != null && event.tokenId != null && event.tokenId !== tokenId)) return;
    /** Новые профили могут изменить отображаемое имя уже существующего лидера. */
    if (!['new-message', 'message-deleted', 'messages-cleared', 'new-user', 'user-updated', 'group-updated'].includes(event.type)) return;
    /** Неизвестный токен удаления безопасно обновляет выбранную область из сервера. */
    if (!timer) timer = setTimeout(refresh, 150);
  });
  const unsubscribeReconnect = onReconnect(refresh);
  return () => {
    disposed = true;
    if (timer) clearTimeout(timer);
    unsubscribe();
    unsubscribeReconnect();
  };
}
