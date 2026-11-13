/** @fileoverview Создание и атомарное сохранение индивидуального секрета вебхука. */
import { resolveWebhookSecret } from './webhookSecretValue';
import { eq } from 'drizzle-orm';
import { botTokens } from '@shared/schema';
import { db } from '../database/db';
import { emitTokenUpdated } from '../terminal/emitTokenUpdated';


/** Сохраняет секрет под блокировкой строки до передачи параметров запуска исполнителю. */
export async function ensureWebhookSecret(tokenId: number): Promise<string> {
  const saved = await db.transaction(async (tx) => {
    const [token] = await tx.select({ secret: botTokens.webhookSecretToken, projectId: botTokens.projectId })
      .from(botTokens).where(eq(botTokens.id, tokenId)).for('update');
    if (!token) throw new Error('Токен бота не найден');
    const secret = resolveWebhookSecret(token.secret);
    if (secret !== token.secret) await tx.update(botTokens).set({ webhookSecretToken: secret })
      .where(eq(botTokens.id, tokenId));
    return { secret, projectId: token.projectId, generated: secret !== token.secret };
  });
  /** Рассылка выполняется после commit, без удержания блокировки строки токена. */
  if (saved.generated) void emitTokenUpdated({
    projectId: saved.projectId, tokenId, changedFields: ['hasWebhookSecret'], source: 'api',
  }).catch(() => console.error('[webhookSecret] Не удалось уведомить о создании секрета'));
  return saved.secret;
}
