/**
 * @fileoverview Запрос синхронизации группы и распознавание потери доступа бота.
 */

/** Состояние последней проверки доступа к групповому чату. */
export type GroupSyncStatus = 'checking' | 'available' | 'kicked' | 'error';

/** Сохранённое состояние и обновлённые данные группы. */
export interface GroupAccessData {
  /** Состояние последней проверки. */
  status: GroupSyncStatus | 'unknown';
  /** Время проверки на сервере. */
  checkedAt?: string | null;
  /** Новое название после успешной проверки. */
  name?: string;
  /** Аватарка после успешной проверки. */
  avatarUrl?: string | null;
}

/**
 * Запрашивает название и аватарку, отличая исключение бота от прочих ошибок.
 * @param projectId - Идентификатор проекта
 * @param groupId - Идентификатор группового чата
 * @param tokenId - Идентификатор выбранного токена
 * @returns Результат проверки и обновлённые данные группы
 */
export async function requestGroupSyncDetails(
  projectId: number,
  groupId: string,
  tokenId?: number | null,
): Promise<GroupAccessData> {
  try {
    const query = tokenId != null ? `?tokenId=${tokenId}` : '';
    const response = await fetch(
      `/api/projects/${projectId}/groups/${encodeURIComponent(groupId)}/sync${query}`,
      { method: 'POST', credentials: 'include', signal: AbortSignal.timeout(15_000) },
    );
    const body = await response.json();
    if (response.ok) return { status: 'available', checkedAt: body.accessCheckedAt,
      name: body.group?.name, avatarUrl: body.group?.avatarUrl };
    const error = typeof body.error === 'string' ? body.error : '';
    return { status: /\bbot was kicked\b/i.test(error) ? 'kicked' : 'error', checkedAt: body.accessCheckedAt };
  } catch {
    return { status: 'error' };
  }
}

/**
 * Возвращает только состояние для совместимости вызывающих функций.
 * @param projectId - Проект
 * @param groupId - Чат
 * @param tokenId - Бот
 * @returns Результат проверки
 */
export async function requestGroupSync(projectId: number, groupId: string, tokenId?: number | null) {
  return (await requestGroupSyncDetails(projectId, groupId, tokenId)).status;
}
