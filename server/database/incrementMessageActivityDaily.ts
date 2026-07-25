/**
 * @fileoverview Инкремент дневного счётчика активности сообщений
 * @module server/database/incrementMessageActivityDaily
 */

import { sql } from "drizzle-orm";
import { db } from "./db";

/**
 * Параметры инкремента дневной активности
 */
export interface IncrementMessageActivityDailyParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор токена бота (null/undefined → 0) */
  tokenId?: number | null;
  /** Тип сообщения: user — входящее, иначе исходящее */
  messageType: string;
}

/**
 * Увеличивает дневной счётчик входящих или исходящих сообщений.
 * Ошибки глотаются вызывающим кодом — сохранение сообщения не должно падать.
 * @param params - Проект, токен и тип сообщения
 * @returns Promise<void>
 */
export async function incrementMessageActivityDaily(
  params: IncrementMessageActivityDailyParams,
): Promise<void> {
  const tokenId = params.tokenId ?? 0;
  const isIncoming = params.messageType === "user";
  const incoming = isIncoming ? 1 : 0;
  const outgoing = isIncoming ? 0 : 1;

  await db.execute(sql`
    INSERT INTO message_activity_daily (project_id, token_id, day, incoming_count, outgoing_count)
    VALUES (${params.projectId}, ${tokenId}, CURRENT_DATE, ${incoming}, ${outgoing})
    ON CONFLICT (project_id, token_id, day) DO UPDATE SET
      incoming_count = message_activity_daily.incoming_count + EXCLUDED.incoming_count,
      outgoing_count = message_activity_daily.outgoing_count + EXCLUDED.outgoing_count
  `);
}
