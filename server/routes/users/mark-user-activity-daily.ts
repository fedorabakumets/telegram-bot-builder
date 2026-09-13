/**
 * @fileoverview Вставка дневной отметки активности пользователя
 * @module server/routes/users/mark-user-activity-daily
 */

import { sql } from "drizzle-orm";
import { db } from "../../database/db";

/**
 * Параметры отметки дневной активности
 */
export interface MarkUserActivityDailyParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор токена бота (null/undefined → 0) */
  tokenId?: number | null;
  /** Telegram user_id */
  userId: number | string;
}

/**
 * Ставит отметку «человек был активен сегодня».
 * first_seen_at берётся из bot_users.registered_at либо NOW() если профиля ещё нет.
 * Повторный вызов в тот же день ничего не меняет (DO NOTHING).
 * @param params - Проект, токен и пользователь
 * @returns Promise<void>
 */
export async function markUserActivityDaily(
  params: MarkUserActivityDailyParams,
): Promise<void> {
  const tokenId = params.tokenId ?? 0;
  const userId = Number(params.userId);
  if (!Number.isFinite(userId)) return;

  await db.execute(sql`
    INSERT INTO user_activity_daily (project_id, token_id, day, user_id, first_seen_at)
    VALUES (
      ${params.projectId},
      ${tokenId},
      CURRENT_DATE,
      ${userId},
      COALESCE(
        (SELECT registered_at FROM bot_users
          WHERE project_id = ${params.projectId}
            AND token_id = ${tokenId}
            AND user_id = ${userId}),
        NOW()
      )
    )
    ON CONFLICT (project_id, token_id, day, user_id) DO NOTHING
  `);
}
