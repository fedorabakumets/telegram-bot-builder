/** @fileoverview Создание и атомарное сохранение индивидуального секрета вебхука. */
import { resolveWebhookSecret } from './webhookSecretValue';
import { eq } from 'drizzle-orm';
import { botTokens } from '@shared/schema';
import { db } from '../database/db';


/** Сохраняет секрет под блокировкой строки до передачи параметров запуска исполнителю. */
export async function ensureWebhookSecret(tokenId: number): Promise<string> {
  return db.transaction(async (tx) => {
    const [token] = await tx.select({ secret: botTokens.webhookSecretToken })
      .from(botTokens).where(eq(botTokens.id, tokenId)).for('update');
    if (!token) throw new Error('Токен бота не найден');
    const secret = resolveWebhookSecret(token.secret);
    if (secret !== token.secret) await tx.update(botTokens).set({ webhookSecretToken: secret })
      .where(eq(botTokens.id, tokenId));
    return secret;
  });
}
