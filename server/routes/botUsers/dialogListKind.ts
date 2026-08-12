/**
 * @fileoverview SQL-фрагменты списка диалогов с фильтром по типу чата
 * @module server/routes/botUsers/dialogListKind
 */

/** Допустимые значения фильтра вкладки «Диалоги» */
export type DialogKind = 'all' | 'users' | 'groups' | 'channels';

/**
 * Разбирает query: dialogKind приоритетнее includeGroups
 * @param query - Express req.query
 * @returns Нормализованный вид фильтра
 */
export function resolveDialogKind(query: Record<string, unknown>): DialogKind {
  const raw = String(query.dialogKind ?? '').toLowerCase();
  if (raw === 'all' || raw === 'users' || raw === 'groups' || raw === 'channels') {
    return raw;
  }
  return query.includeGroups === 'true' ? 'all' : 'users';
}

/**
 * Нужна ли часть с личными пользователями
 * @param kind - Фильтр диалогов
 * @returns true, если грузим bot_users
 */
export function wantsUsers(kind: DialogKind): boolean {
  return kind === 'all' || kind === 'users';
}

/**
 * Нужна ли часть с группами/каналами
 * @param kind - Фильтр диалогов
 * @returns true, если грузим групповые чаты из bot_messages
 */
export function wantsGroups(kind: DialogKind): boolean {
  return kind === 'all' || kind === 'groups' || kind === 'channels';
}

/**
 * SQL IN-список chat_type для групповой части
 * @param kind - Фильтр диалогов
 * @returns Фрагмент вида ('group','supergroup')
 */
export function groupChatTypesSql(kind: DialogKind): string {
  if (kind === 'channels') return `('channel')`;
  if (kind === 'groups') return `('group', 'supergroup')`;
  return `('group', 'supergroup', 'channel')`;
}

/**
 * SELECT групп/каналов как строк диалога (без UNION ALL)
 * @param chatTypesSql - Уже готовый IN-список типов
 * @returns SQL SELECT
 */
export function buildGroupsSelectSql(chatTypesSql: string): string {
  return `
      SELECT
        (-(ROW_NUMBER() OVER (ORDER BY MAX(bm.created_at) DESC))::bigint) AS id,
        bm.chat_id AS "userId",
        NULL AS "userName",
        COALESCE(bg.name, bm.chat_id) AS "firstName",
        NULL AS "lastName",
        bg.avatar_url AS "avatarUrl",
        MIN(bm.created_at) AS "registeredAt",
        MIN(bm.created_at) AS "createdAt",
        MAX(bm.created_at) AS "lastInteraction",
        COUNT(*)::integer AS "interactionCount",
        TRUE AS "isActive",
        FALSE AS "isPremium",
        FALSE AS "isBlocked",
        FALSE AS "isBot",
        NULL AS "languageCode",
        NULL AS "deepLinkParam",
        NULL AS "referrerId",
        NULL AS "userData",
        (ARRAY_AGG(bm.message_text ORDER BY bm.created_at DESC))[1] AS "lastMessageText",
        MAX(bm.created_at) AS "lastMessageAt",
        TRUE AS "isGroup",
        bm.chat_type AS "chatType"
      FROM bot_messages bm
      LEFT JOIN bot_groups bg
        ON bg.group_id = bm.chat_id
        AND bg.project_id = bm.project_id
        AND (bg.token_id IS NULL OR bg.token_id = bm.token_id)
      WHERE bm.project_id = $1
        AND bm.chat_type IN ${chatTypesSql}
        AND bm.chat_id IS NOT NULL
        AND ($2::integer IS NULL OR bm.token_id = $2)
      GROUP BY bm.chat_id, bm.chat_type, bg.name, bg.avatar_url
  `;
}
