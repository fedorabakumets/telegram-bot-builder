/**
 * @fileoverview Запрос синхронизации группы и распознавание потери доступа бота.
 */

/** Состояние последней проверки доступа к групповому чату. */
export type GroupSyncStatus = 'checking' | 'available' | 'kicked' | 'error';

/**
 * Запрашивает название и аватарку, отличая исключение бота от прочих ошибок.
 * @param projectId - Идентификатор проекта
 * @param groupId - Идентификатор группового чата
 * @param tokenId - Идентификатор выбранного токена
 * @returns Результат проверки доступа
 */
export async function requestGroupSync(
  projectId: number,
  groupId: string,
  tokenId?: number | null,
): Promise<GroupSyncStatus> {
  try {
    const query = tokenId != null ? `?tokenId=${tokenId}` : '';
    const response = await fetch(
      `/api/projects/${projectId}/groups/${encodeURIComponent(groupId)}/sync${query}`,
      { method: 'POST', credentials: 'include', signal: AbortSignal.timeout(15_000) },
    );
    if (response.ok) return 'available';
    const body = await response.json();
    const error = typeof body.error === 'string' ? body.error : '';
    return /\bbot was kicked\b/i.test(error) ? 'kicked' : 'error';
  } catch {
    return 'error';
  }
}
