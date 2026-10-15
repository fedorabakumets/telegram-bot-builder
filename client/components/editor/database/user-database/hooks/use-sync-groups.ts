/**
 * @fileoverview Однократная синхронизация групп и ручная проверка доступа бота.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { UserBotData } from '@shared/schema';
import type { GroupSyncStatus, GroupAccessData } from './group-sync-request';
import { checkGroupAccess, groupAccessKey } from './group-access-cache';

/** Данные проверки доступа для карточек групп. */
interface GroupSyncResult {
  /** Последние состояния по идентификаторам чатов текущего бота. */
  statuses: Record<string, GroupSyncStatus>;
  /** Принудительная проверка после возвращения бота в чат. */
  checkAccess: (groupId: string) => Promise<void>;
}

/**
 * Синхронизирует каждую группу один раз за открытие списка, включая ошибки.
 * Повторные рендеры и обновления диалогов не запускают запрос заново.
 * @param projectId - Идентификатор проекта
 * @param selectedTokenId - Идентификатор выбранного токена
 * @param dialogs - Загруженные диалоги
 * @returns Состояния групп и функция ручной проверки
 */
export function useSyncGroups(
  projectId: number,
  selectedTokenId?: number | null,
  dialogs?: UserBotData[],
): GroupSyncResult {
  const queryClient = useQueryClient();
  const scope = `${projectId}:${selectedTokenId ?? 'all'}:`;
  /** Все начатые автоматические проверки, включая завершившиеся ошибкой. */
  const attemptedRef = useRef(new Set<string>());
  /** Запросы в полёте защищают от одновременных повторных проверок. */
  const pendingRef = useRef(new Set<string>());
  const [states, setStates] = useState<Record<string, GroupSyncStatus>>({});

  /**
   * Проверяет группу, сохраняя результат в области выбранного проекта и бота.
   * @param groupId - Идентификатор чата
   * @param refresh - Обновлять список сразу после успешной ручной проверки
   * @returns Завершение проверки и обновления списка
   */
  const checkAccess = useCallback(async (groupId: string, refresh = true): Promise<void> => {
    const key = `${scope}${groupId}`;
    if (pendingRef.current.has(key)) return;
    attemptedRef.current.add(key);
    pendingRef.current.add(key);
    setStates((previous) => ({ ...previous, [key]: 'checking' }));
    try {
      const { status } = await checkGroupAccess(queryClient, projectId, selectedTokenId, groupId);
      if (status !== 'unknown') setStates((previous) => ({ ...previous, [key]: status }));
      if (refresh) {
        await queryClient.refetchQueries({ queryKey: ['infinite-users', projectId] });
      }
    } finally {
      pendingRef.current.delete(key);
    }
  }, [scope, projectId, selectedTokenId, queryClient]);

  useEffect(() => {
    const checks: Promise<void>[] = [];
    for (const dialog of dialogs ?? []) {
      const meta = dialog as UserBotData & {
        /** Флаг группового диалога из ответа сервера. */
        isGroup?: boolean;
        /** Сохранённый результат проверки доступа. */
        accessStatus?: GroupAccessData['status'];
        /** Время серверной проверки. */
        accessCheckedAt?: string | null;
      };
      if (!dialog.userId) continue;
      const groupId = String(dialog.userId);
      const cacheKey = groupAccessKey(projectId, selectedTokenId, groupId);
      const cached = queryClient.getQueryData<GroupAccessData>(cacheKey);
      if (cached?.status !== 'checking' && meta.accessStatus && meta.accessStatus !== 'unknown'
        && cached?.status !== meta.accessStatus) {
        queryClient.setQueryData(cacheKey, { ...cached,
          status: meta.accessStatus, checkedAt: meta.accessCheckedAt });
      }
      if (!meta.isGroup) continue;
      if ((cached && cached.status !== 'unknown') || (meta.accessStatus && meta.accessStatus !== 'unknown')) {
        continue;
      }
      if (!attemptedRef.current.has(`${scope}${groupId}`)) {
        checks.push(checkAccess(groupId, false));
      }
    }
    if (checks.length > 0) {
      /** Один общий рефетч после пакета проверок предотвращает лавину запросов списка. */
      void Promise.allSettled(checks).then(() =>
        queryClient.refetchQueries({ queryKey: ['infinite-users', projectId] }),
      );
    }
  }, [dialogs, scope, checkAccess, queryClient, projectId]);

  const statuses: Record<string, GroupSyncStatus> = {};
  for (const [key, status] of Object.entries(states)) {
    if (key.startsWith(scope)) statuses[key.slice(scope.length)] = status;
  }
  return { statuses, checkAccess };
}
