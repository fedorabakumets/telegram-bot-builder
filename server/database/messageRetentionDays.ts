/** @fileoverview SQL-выражение действующего срока хранения сообщений бота. */

import { sql } from 'drizzle-orm';
import { botProjects, botTokens } from '@shared/schema';
import { MESSAGES_RETENTION_DAYS_VALUES } from '../../shared/messages-retention';
import { DEFAULT_BOT_SETTINGS } from '../../shared/bot-inherited-settings';

/**
 * Разрешает срок хранения на стороне БД, сохраняя нулевые значения и старые записи.
 * @returns SQL-выражение для соединённых таблиц ботов и проектов.
 */
export function getEffectiveMessageRetentionDaysSql() {
  const key = 'messagesRetentionDays';
  const allowed = sql.join(MESSAGES_RETENTION_DAYS_VALUES.map(days => sql`to_jsonb(${days}::integer)`), sql`, `);
  return sql<number>`case when ${botTokens.inheritBotSettings} ? ${key} then
    case when ${botProjects.botSettingDefaults} -> ${key} in (${allowed})
      then (${botProjects.botSettingDefaults} ->> ${key})::numeric::integer
      else ${DEFAULT_BOT_SETTINGS.messagesRetentionDays} end
    else ${botTokens.messagesRetentionDays} end`;
}
