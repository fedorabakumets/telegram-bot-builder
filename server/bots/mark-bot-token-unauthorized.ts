/**
 * @fileoverview Помечает токен недействительным после 401 Telegram
 * @module server/bots/mark-bot-token-unauthorized
 */

import { storage } from '../storages/storage';
import { emitTokenUpdated } from '../terminal/emitTokenUpdated';
import { db } from '../database/db';
import { botTokens } from '@shared/schema';
import { and, eq, isNull, or, ne } from 'drizzle-orm';

/**
 * Ставит isActive=0 и рассылает token-updated, если токен ещё считался живым
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param expectedToken - Секрет, который Telegram отклонил; защищает заменённый токен
 */
export async function markBotTokenUnauthorized(
  projectId: number,
  tokenId: number,
  expectedToken: string,
): Promise<void> {
  const before = await storage.getBotToken(tokenId);
  if (!before || before.projectId !== projectId) return;
  if (before.token !== expectedToken) return;
  const [updated] = await db.update(botTokens)
    .set({ isActive: 0, authorizationError: 'unauthorized', updatedAt: new Date() })
    .where(and(eq(botTokens.id, tokenId), eq(botTokens.projectId, projectId),
      eq(botTokens.token, expectedToken),
      or(isNull(botTokens.authorizationError), ne(botTokens.authorizationError, 'unauthorized'))))
    .returning({ id: botTokens.id });
  if (!updated) return;
  void emitTokenUpdated({
    projectId,
    tokenId,
    before,
    source: 'api',
  }).catch(() => console.error('[markBotTokenUnauthorized] Не удалось уведомить об изменении токена'));
}
