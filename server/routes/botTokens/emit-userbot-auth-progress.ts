/**
 * @fileoverview Рассылка шагов авторизации юзербота открытым вкладкам проекта.
 * @module server/routes/botTokens/emit-userbot-auth-progress
 */
import { broadcastProjectEvent } from '../../terminal/broadcastProjectEvent';
import { parseUserbotAuthProgress, type UserbotAuthProgress } from '../../../shared/project-sync/userbot-auth-progress';

/**
 * Рассылает только шаг и телефон; сбой WS не отменяет успешный шаг Telegram.
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @param progress - Текущий шаг авторизации
 * @returns Ничего
 */
export async function emitUserbotAuthProgress(
  projectId: number, tokenId: number, progress: UserbotAuthProgress,
): Promise<void> {
  const data = parseUserbotAuthProgress(progress);
  if (!data) return;
  await broadcastProjectEvent(projectId, {
    type: 'userbot-auth-progress', projectId, tokenId,
    timestamp: new Date().toISOString(), data,
  }).catch(() => console.error('[userbot] Не удалось отправить шаг авторизации'));
}
