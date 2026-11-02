/** @fileoverview Транзакционная запись серверного сообщения, новой аналитики и совместимых старых счётчиков. */
import { and, eq, lt, sql } from 'drizzle-orm';
import { botMessages, type BotMessage } from '../../../shared/schema/tables/bot-messages';
import type { StorageBotMessageInput } from '../../storages/storageTypes';
import type { db } from '../db';
import { nodeMessageAnalyticsEvent } from './node-message-event';
import { safeAuthPayloads } from '../../utils/safe-auth-payloads';
/**
 * Сохраняет диалог и аналитический факт без частичного состояния при ошибке SQL.
 * @param database - Подключение Drizzle, используемое хранилищем.
 * @param input - Данные подтверждённой отправки или входящего сообщения.
 * @returns Сохранённая запись истории.
 */
export async function createMessageWithAnalytics(database: typeof db, input: StorageBotMessageInput): Promise<BotMessage> {
  const safeInput = safeAuthPayloads(input);
  return database.transaction(async tx => {
    const [message] = await tx.insert(botMessages).values(safeInput).returning();
    const payload = nodeMessageAnalyticsEvent(message, input.chatType);
    let counted = true;
    if (payload) {
      const result = await tx.execute(sql`SELECT record_analytics_event_v2(${JSON.stringify(payload)}::jsonb) result`);
      counted = (result.rows[0]?.result as { inserted?: boolean })?.inserted !== false;
    }
    if (!counted && message.telegramMessageId) {
      const [existing] = await tx.select().from(botMessages).where(and(eq(botMessages.projectId, message.projectId),
        eq(botMessages.tokenId, message.tokenId), eq(botMessages.telegramMessageId, message.telegramMessageId),
        eq(botMessages.userId, message.userId), eq(botMessages.messageType, message.messageType), lt(botMessages.id, message.id))).limit(1);
      if (existing) { await tx.delete(botMessages).where(eq(botMessages.id, message.id)); return safeAuthPayloads(existing); }
    }
    if (!counted) return message;
    const token = input.tokenId ?? 0;
    const incoming = input.messageType === 'user' ? 1 : 0;
    await tx.execute(sql`UPDATE bot_users SET interaction_count=COALESCE(interaction_count,0)+1,last_interaction=NOW()
      WHERE project_id=${input.projectId} AND token_id=${token} AND user_id::text=${input.userId}`);
    await tx.execute(sql`INSERT INTO message_activity_daily(project_id,token_id,day,incoming_count,outgoing_count)
      VALUES(${input.projectId},${token},(NOW() AT TIME ZONE 'UTC')::date,${incoming},${1 - incoming})
      ON CONFLICT(project_id,token_id,day) DO UPDATE SET incoming_count=message_activity_daily.incoming_count+EXCLUDED.incoming_count,
        outgoing_count=message_activity_daily.outgoing_count+EXCLUDED.outgoing_count`);
    if (incoming && /^[1-9][0-9]{0,18}$/.test(String(input.userId))) {
      await tx.execute(sql`INSERT INTO user_activity_daily(project_id,token_id,day,user_id,first_seen_at)
        VALUES(${input.projectId},${token},(NOW() AT TIME ZONE 'UTC')::date,${input.userId}::bigint,
          COALESCE((SELECT registered_at FROM bot_users WHERE project_id=${input.projectId} AND token_id=${token} AND user_id::text=${input.userId}),NOW()))
        ON CONFLICT(project_id,token_id,day,user_id) DO NOTHING`);
    }
    return message;
  });
}
