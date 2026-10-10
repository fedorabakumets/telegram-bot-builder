/**
 * @fileoverview Очистка локального изменения юзербота, уже сохранённого через MCP.
 * @module client/components/editor/bot/card/use-userbot-pending-sync
 */
import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PendingChange } from './use-env-pending-changes';

/** Минимальные серверные данные для сверки изменений */
interface SavedUserbotToken {
  /** Идентификатор токена */
  id: number;
  /** Сохранённое состояние юзербота */
  userbotEnabled: number | null;
}

/**
 * Удаляет только изменение режима, уже совпадающее с сервером.
 * @param changes - Локальная очередь
 * @param enabled - Сохранённый флаг режима
 * @returns Исходная очередь или копия без совпавшего изменения
 */
export function reconcileUserbotPending(changes: Map<string, PendingChange>, enabled: number | null) {
  const pending = changes.get('USERBOT_ENABLED');
  if (!pending || pending.type !== 'system' || pending.action !== 'update') return changes;
  const values = enabled === 1 ? ['true', '1'] : ['false', '0'];
  if (!values.includes(pending.value)) return changes;
  const next = new Map(changes);
  next.delete('USERBOT_ENABLED');
  return next;
}

/**
 * Наблюдает кэш токенов, обновляемый событиями WebSocket, и сверяет очередь.
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @param changes - Текущая локальная очередь
 * @param setChanges - Обновление очереди без удаления других изменений
 * @returns Ничего
 */
export function useUserbotPendingSync(
  projectId: number, tokenId: number, changes: Map<string, PendingChange>,
  setChanges: Dispatch<SetStateAction<Map<string, PendingChange>>>,
): void {
  const { data } = useQuery<SavedUserbotToken[]>({
    queryKey: [`/api/projects/${projectId}/tokens`], enabled: false,
  });
  const token = data?.find(item => item.id === tokenId);
  useEffect(() => {
    if (!token) return;
    setChanges(current => reconcileUserbotPending(current, token.userbotEnabled));
  }, [token, changes, setChanges]);
}
