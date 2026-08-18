/**
 * @fileoverview Помечает токен недействительным после 401 Telegram
 * @module server/bots/mark-bot-token-unauthorized
 */

import { storage } from '../storages/storage';
import { emitTokenUpdated } from '../terminal/emitTokenUpdated';

/**
 * Ставит isActive=0 и рассылает token-updated, если токен ещё считался живым
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 */
export async function markBotTokenUnauthorized(
  projectId: number,
  tokenId: number,
): Promise<void> {
  const before = await storage.getBotToken(tokenId);
  if (!before || before.projectId !== projectId) return;
  if (before.isActive === 0) return;
  await storage.updateBotToken(tokenId, { isActive: 0 });
  void emitTokenUpdated({
    projectId,
    tokenId,
    before,
    source: 'api',
  }).catch((err) => console.error('[markBotTokenUnauthorized] emitTokenUpdated:', err));
}
